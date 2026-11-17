// 계산되는 값 (규칙 3.2절). 컴패니언은 원래 숫자가 아니라 이 값으로 그린다.
// 모두 (숫자 − 원점) ÷ 폭 이다. 피드 한 장만으로 정한다. 지난 피드를 기억해 값을 만들지 않는다.
// 지난 값은 보내는 쪽이 history 에 담아 보낸 것만 쓴다.

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// 지난 값들과 지금 값을 차례로 0~1 로 바꾼 줄. 범위가 있으면 fill 과 같은 식이고,
// 없으면 줄 안의 가장 작은 값과 가장 큰 값에 맞춘다.
function computeHistory(v, from, span) {
  if (!v.history) return null;
  const points = [...v.history, v.value];
  if (span !== 0) return points.map((x) => clamp((x - from) / span, 0, 1));
  const lo = Math.min(...points);
  const hi = Math.max(...points);
  return points.map((x) => (hi > lo ? (x - lo) / (hi - lo) : 0.5));
}

// total: 값들의 합. 몫을 낼 수 없으면 null 이다.
export function computeValue(v, total = null) {
  // 얼마나 왔는가: from 에서 to 로. to 가 from 보다 작아도 된다.
  const from = v.from ?? 0;
  const span = v.to === undefined ? 0 : v.to - from;
  const along = span !== 0 ? (v.value - from) / span : null;

  // 기준보다 얼마나: 폭은 scale, 없으면 범위의 크기다.
  const scale = v.scale ?? Math.abs(span);
  const rise =
    v.base !== undefined && scale > 0
      ? clamp((v.value - v.base) / scale, -1, 1)
      : null;

  // 어느 쪽으로 얼마나 빨리
  const momentum =
    v.rate !== undefined && v.rateScale > 0
      ? clamp(v.rate / v.rateScale, -1, 1)
      : null;

  return {
    fill: along === null ? null : clamp(along, 0, 1),
    over: along === null ? null : clamp(along - 1, 0, 1), // to 를 넘은 만큼
    under: along === null ? null : clamp(-along, 0, 1), // from 에 못 미친 만큼
    rise,
    momentum,
    history: computeHistory(v, from, span),
    share: total === null ? null : v.value / total,
    raw: v,
  };
}

export function computeFeed(feed) {
  // 값이 하나이면 견줄 것이 없어 몫도 순위도 없다.
  const many = feed.values.length > 1;
  // 음수가 섞이거나 합이 0 이하이면 몫을 내지 않는다.
  const sum = feed.values.reduce((s, v) => s + v.value, 0);
  const total =
    many && sum > 0 && feed.values.every((v) => v.value >= 0) ? sum : null;
  return feed.values.map((v) => ({
    ...computeValue(v, total),
    // 값마다의 상태. 적지 않았으면 피드 전체의 것이다.
    state: v.state ?? feed.state ?? "live",
    // 순위: 1 이 가장 크다. 같은 값은 같은 순위다.
    rank: many ? 1 + feed.values.filter((o) => o.value > v.value).length : null,
  }));
}
