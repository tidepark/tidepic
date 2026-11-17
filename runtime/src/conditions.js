// 조건 (규칙 3.7절). 계산된 값을 이름 붙은 상태로 바꾼다. 경계 값은 잠정이다.

// 조건이 한번 바뀌면, 값이 경계를 이만큼 더 넘어가야 되돌아간다.
export const HOLD = 0.03;

const count = (bounds, x) => bounds.filter((b) => x >= b).length;

// 띠 i 와 i+1 사이의 경계가 bounds[i] 다.
const BANDS = {
  level: {
    names: ["empty", "low", "mid", "high", "full"],
    bounds: [0.05, 0.35, 0.65, 0.95],
    index: (x) => count([0.05, 0.35, 0.65, 0.95], x),
  },
  // 범위 밖인가. 보는 숫자는 fill 에 넘친 만큼을 더하고 못 미친 만큼을 뺀 것이다.
  bound: {
    names: ["under", "inside", "over"],
    bounds: [0, 1],
    index: (x) => (x < 0 ? 0 : x > 1 ? 2 : 1),
  },
  trend: {
    names: ["fall", "flat", "rise"],
    bounds: [-0.1, 0.1],
    index: (x) => (x < -0.1 ? 0 : x > 0.1 ? 2 : 1),
  },
  drift: {
    names: ["down", "still", "up"],
    bounds: [-0.1, 0.1],
    index: (x) => (x < -0.1 ? 0 : x > 0.1 ? 2 : 1),
  },
  pace: {
    names: ["calm", "brisk"],
    bounds: [0.3],
    index: (x) => (x < 0.3 ? 0 : 1),
  },
};

export const CONDITION_NAMES = {
  level: BANDS.level.names,
  bound: BANDS.bound.names,
  trend: BANDS.trend.names,
  drift: BANDS.drift.names,
  pace: BANDS.pace.names,
  ahead: ["yes", "tie", "no"],
  step: ["first", "mid", "last"],
  state: ["live", "idle", "done", "fault", "stale"],
};

// prev: { name, from }. from 은 이 띠에 들어올 때 넘은 경계의 번호다.
// 앞의 상태가 없으면(정지 그림) 값만으로 판정한다.
function settle(band, value, prev) {
  const fresh = band.index(value);
  const was = prev ? band.names.indexOf(prev.name) : -1;
  if (was < 0) return { name: band.names[fresh] };
  if (fresh === was) return prev;
  const back =
    (fresh < was && prev.from === was - 1) || (fresh > was && prev.from === was);
  if (back && Math.abs(value - band.bounds[prev.from]) < HOLD) return prev;
  return { name: band.names[fresh], from: fresh > was ? fresh - 1 : fresh };
}

function judgeValue(c, prev = {}) {
  const memory = {};
  if (c.fill !== null) {
    memory.level = settle(BANDS.level, c.fill, prev.level);
    memory.bound = settle(BANDS.bound, c.fill + c.over - c.under, prev.bound);
  }
  if (c.rise !== null) memory.trend = settle(BANDS.trend, c.rise, prev.trend);
  if (c.momentum !== null) {
    memory.drift = settle(BANDS.drift, c.momentum, prev.drift);
    memory.pace = settle(BANDS.pace, Math.abs(c.momentum), prev.pace);
  }
  return memory;
}

// 단계의 조건. 처음(1 이하), 마지막(to 에 닿음), 그 사이.
function judgeStep(step) {
  if (step.to !== undefined && step.value >= step.to) return "last";
  return step.value <= 1 ? "first" : "mid";
}

// 돌려주는 것: values(값마다의 조건), focus, state, step, 그리고 다음 판정에 넘길 memory.
export function judgeFeed(feed, computed, { stale = false, memory = [] } = {}) {
  const next = computed.map((c, i) => judgeValue(c, memory[i]));
  const tops = computed.filter((c) => c.rank === 1).length;
  const judged = {
    values: next.map((m, i) => {
      const names = Object.fromEntries(
        Object.entries(m).map(([key, v]) => [key, v.name]),
      );
      // 상태는 값마다 있다. 소식이 끊기면 모두 stale 이다.
      names.state = stale ? "stale" : computed[i].state;
      // 앞섰는가: 혼자 가장 크면 yes, 같이 가장 크면 tie. 값이 하나이면 없다.
      const { rank } = computed[i];
      if (rank !== null && rank !== undefined) {
        names.ahead = rank > 1 ? "no" : tops > 1 ? "tie" : "yes";
      }
      return names;
    }),
    focus: feed.focus ?? 0,
    state: stale ? "stale" : feed.state,
    memory: next,
  };
  if (feed.step) judged.step = judgeStep(feed.step);
  return judged;
}

// 경우표가 보는 조건. focus 가 가리키는 값의 것을 쓴다. 상태도 그 값의 것이다.
export function sceneConditions(judged) {
  const out = { ...judged.values[judged.focus] };
  if (judged.step) out.step = judged.step;
  return out;
}
