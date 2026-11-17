// 피드 확인기. 붙여 넣은 피드를 이 브라우저 안에서만 검사하고 계산한다. 어디에도 보내지 않는다.

import { checkFeed } from "./runtime/src/check.js";
import { computeFeed } from "./runtime/src/compute.js";
import { judgeFeed } from "./runtime/src/conditions.js";
import { formatValue } from "./runtime/src/overlay.js";
import { parseFeed } from "./runtime/src/validate.js";

const TEXT = {
  ko: {
    ok: "규칙에 맞는 피드입니다.",
    bad: "규칙에 맞지 않아 피드 전체를 버립니다.",
    errors: {
      "too-big": "피드가 16KB 를 넘습니다.",
      "not-json": "JSON 이 아닙니다. 따옴표나 쉼표를 확인해 주세요.",
      "not-object": "피드는 { } 로 감싼 객체여야 합니다.",
      spec: "spec 이 1 이어야 합니다.",
      "no-values": "values 에 값이 하나 이상 있어야 합니다.",
      "too-many-values": "values 는 64개까지입니다.",
      value: (where) => `${where} 가 숫자여야 합니다.`,
    },
    dropped: "틀렸거나 0.2 전의 이름이어서 버린 항목입니다. 없는 것으로 봅니다:",
    notices: {
      "no-scale": (where) => `${where}: base 가 있는데 scale 도 범위(from, to)도 없어 rise 를 계산할 수 없습니다.`,
      "no-rate-scale": (where) => `${where}: rate 가 있는데 rateScale 이 없어 momentum 을 계산할 수 없습니다.`,
    },
    kinds: ["채움 또는 오르내림 (값 1개)", "맞대결 (값 2개)", "무리 (값 여럿)"],
    kind: "장면의 종류",
    value: (i) => `값 ${i}`,
    none: {
      fill: "없음. to 가 있어야 합니다.",
      rise: "없음. base 와 폭(scale, 또는 범위)이 있어야 합니다.",
      momentum: "없음. rate 와 rateScale 이 있어야 합니다.",
      share: "없음. 음수가 섞였거나 합이 0 입니다.",
    },
    conditions: "조건",
    feed: "피드 전체",
    foot: "조건의 경계 값은 잠정입니다. 경계 가까이에서는 실제 화면이 앞의 상태를 조금 더 붙들고 있을 수 있습니다.",
  },
  en: {
    ok: "This feed follows the rules.",
    bad: "This feed breaks the rules, so the whole feed is dropped.",
    errors: {
      "too-big": "The feed is larger than 16 KB.",
      "not-json": "This is not JSON. Check the quotes and commas.",
      "not-object": "A feed must be an object wrapped in { }.",
      spec: "spec must be 1.",
      "no-values": "values needs at least one value.",
      "too-many-values": "values can hold up to 64 items.",
      value: (where) => `${where} must be a number.`,
    },
    dropped: "Dropped because they were wrong or use a name from before 0.2. They count as missing:",
    notices: {
      "no-scale": (where) => `${where}: base is there, but with no scale and no range (from, to) rise cannot be computed.`,
      "no-rate-scale": (where) => `${where}: rate is there, but with no rateScale momentum cannot be computed.`,
    },
    kinds: ["Fill or rise (1 value)", "Head to head (2 values)", "Group (many values)"],
    kind: "Kind of scene",
    value: (i) => `Value ${i}`,
    none: {
      fill: "None. It needs to.",
      rise: "None. It needs base and a span (scale, or a range).",
      momentum: "None. It needs rate and rateScale.",
      share: "None. A value is negative or the sum is 0.",
    },
    conditions: "Conditions",
    feed: "Whole feed",
    foot: "The condition boundaries are provisional. Near a boundary, a live screen may hold on to the previous state a little longer.",
  },
};

const EXAMPLES = {
  steps: { spec: 1, values: [{ value: 6200, to: 10000, base: 4700 }] },
  price: {
    spec: 1,
    state: "live",
    values: [{ value: 71200, from: 70100, to: 71900, base: 70500, scale: 1400, rate: 50, rateScale: 150, unit: "원" }],
    meta: { ttl: 60 },
  },
  score: { spec: 1, values: [{ value: 92 }, { value: 102 }] },
  days: { spec: 1, values: [{ value: 12, from: 30, to: 0 }] },
};

const t = TEXT[document.documentElement.lang === "ko" ? "ko" : "en"];
const input = document.getElementById("feed");
const result = document.getElementById("result");

// 글자는 언제나 textContent 로 넣는다. 붙여 넣은 내용을 HTML 로 읽지 않는다.
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

const round = (x) => String(Math.round(x * 100) / 100);

function meter(value, signed) {
  const track = el("div", signed ? "meter signed" : "meter");
  const bar = el("i");
  const left = signed ? Math.min(0.5, 0.5 + value / 2) : 0;
  const width = signed ? Math.abs(value) / 2 : value;
  bar.style.left = `${left * 100}%`;
  bar.style.width = `${width * 100}%`;
  track.append(bar);
  return track;
}

function row(rows, name, value, signed) {
  rows.append(el("code", "", name));
  if (value === null) {
    rows.append(el("span", "none", t.none[name]));
    return;
  }
  rows.append(el("span", "num", round(value)), meter(value, signed));
}

function chips(pairs) {
  const box = el("div", "chips");
  for (const [key, name] of pairs) {
    const chip = el("span", "", `${key} `);
    chip.append(el("code", "", name));
    box.append(chip);
  }
  return box;
}

function show() {
  result.replaceChildren();
  const text = input.value.trim();
  if (!text) return;

  const read = parseFeed(text);
  if (!read.ok) {
    const message = t.errors[read.code] ?? read.error;
    result.append(
      el("p", "verdict bad", t.bad),
      el("p", "note bad", typeof message === "function" ? message(read.where) : message),
    );
    return;
  }
  const { feed, dropped } = read;
  const computed = computeFeed(feed);
  const judged = judgeFeed(feed, computed);

  result.append(el("p", "verdict", t.ok));
  if (dropped.length) {
    result.append(el("p", "note bad", `${t.dropped} ${dropped.join(", ")}`));
  }
  for (const notice of checkFeed(feed)) {
    result.append(el("p", "note bad", t.notices[notice.code](notice.where)));
  }

  computed.forEach((c, i) => {
    const card = el("section", "card");
    card.append(el("h2", "", `${t.value(i + 1)}: ${formatValue(c.raw)}`));
    const rows = el("div", "rows");
    row(rows, "fill", c.fill, false);
    if (c.over) row(rows, "over", c.over, false);
    if (c.under) row(rows, "under", c.under, false);
    row(rows, "rise", c.rise, true);
    row(rows, "momentum", c.momentum, true);
    // 값이 하나이면 견줄 것이 없어 몫과 순위가 없다.
    const pairs = Object.entries(judged.values[i]);
    if (feed.values.length > 1) {
      row(rows, "share", c.share, false);
      pairs.push(["rank", String(c.rank)]);
    }
    card.append(rows, chips(pairs));
    result.append(card);
  });

  const whole = el("section", "card");
  whole.append(el("h2", "", t.feed));
  const pairs = [["state", judged.state]];
  if (judged.step) pairs.push(["step", judged.step]);
  if (feed.values.length > 2) pairs.push(["focus", String(judged.focus)]);
  const kind = t.kinds[Math.min(feed.values.length, 3) - 1];
  whole.append(el("p", "", `${t.kind}: ${kind}`), chips(pairs));
  if (feed.view) {
    whole.append(chips(Object.entries(feed.view).map(([key, value]) => [`view.${key}`, String(value)])));
  }
  if (feed.meta) {
    whole.append(chips(Object.entries(feed.meta).map(([key, value]) => [key, String(value)])));
  }
  result.append(whole, el("p", "note", t.foot));
}

for (const button of document.querySelectorAll("[data-example]")) {
  button.addEventListener("click", () => {
    input.value = JSON.stringify(EXAMPLES[button.dataset.example], null, 2);
    show();
  });
}
input.addEventListener("input", show);
input.value = JSON.stringify(EXAMPLES.steps, null, 2);
show();
