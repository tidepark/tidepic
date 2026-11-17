import test from "node:test";
import assert from "node:assert/strict";
import { parseFeed, validateFeed } from "../src/validate.js";

const sample = {
  spec: 1,
  values: [{ value: 71200, from: 70100, to: 71900, base: 70500, rate: 45, rateScale: 150 }],
  step: { value: 2, to: 4 },
  state: "live",
  event: { type: "score", index: 0, at: 1794787200 },
  extra: { baseball: { inning: 7, half: "bottom", outs: 2, bases: [1, 0, 1] } },
  meta: { ttl: 60, at: 1794787200, credit: "Based on data from MET Norway" },
};

test("규칙의 예시 피드는 그대로 통과한다", () => {
  const result = validateFeed(sample);
  assert.equal(result.ok, true);
  assert.deepEqual(result.feed, sample);
  assert.deepEqual(result.dropped, []);
});

test("필수 항목이 틀리면 피드 전체를 버린다", () => {
  assert.equal(validateFeed(null).ok, false);
  assert.equal(validateFeed([]).ok, false);
  assert.equal(validateFeed({ values: [{ value: 1 }] }).ok, false);
  assert.equal(validateFeed({ spec: 2, values: [{ value: 1 }] }).ok, false);
  assert.equal(validateFeed({ spec: 1, values: [] }).ok, false);
  assert.equal(validateFeed({ spec: 1, values: [{ value: "1" }] }).ok, false);
  assert.equal(validateFeed({ spec: 1, values: [{ value: Infinity }] }).ok, false);
  assert.equal(validateFeed({ spec: 1, values: [{ value: 1 }, {}] }).ok, false);
});

test("values 는 64개까지다. 넘으면 잘라 쓰지 않고 버린다", () => {
  const many = (n) => ({ spec: 1, values: Array.from({ length: n }, (_, i) => ({ value: i })) });
  assert.equal(validateFeed(many(64)).ok, true);
  assert.equal(validateFeed(many(65)).ok, false);
});

test("단위와 형식은 짧은 글자와 정해진 이름만 받는다", () => {
  const value = (extra) => validateFeed({ spec: 1, values: [{ value: 5, ...extra }] });
  assert.deepEqual(value({ unit: "°C", format: "duration" }).feed.values, [
    { value: 5, unit: "°C", format: "duration" },
  ]);
  assert.deepEqual(value({ unit: " steps" }).feed.values, [{ value: 5, unit: " steps" }]);
  for (const unit of ["", "아홉 글자가 넘는 단위", "<b>", "a\nb", 5]) {
    assert.deepEqual(value({ unit }).dropped, ["values[0].unit"]);
  }
  assert.deepEqual(value({ format: "percent" }).dropped, ["values[0].format"]);
});

test("meta 는 ttl, at, credit 을 받는다. 맨 위의 ttl 은 읽지 않는다", () => {
  const feed = (extra) => validateFeed({ spec: 1, values: [{ value: 1 }], ...extra });
  assert.deepEqual(feed({ meta: { ttl: 600, at: 1794787200, credit: "MET Norway" } }).feed.meta, {
    ttl: 600,
    at: 1794787200,
    credit: "MET Norway",
  });
  const bad = feed({ meta: { ttl: -1, at: "now", credit: "see https://example.com" } });
  assert.equal(bad.feed.meta, undefined);
  assert.deepEqual(bad.dropped.sort(), ["meta.at", "meta.credit", "meta.ttl"]);
  assert.deepEqual(feed({ meta: "x" }).dropped, ["meta"]);
  const old = feed({ ttl: 60 });
  assert.equal(old.feed.meta, undefined);
  assert.deepEqual(old.dropped, ["ttl"]);
});

test("view 는 설정과 같은 이름만 받고, 틀린 것만 버린다", () => {
  const feed = (view) => validateFeed({ spec: 1, values: [{ value: 1 }], view });
  const good = { skin: "alps", title: "서울", titleAt: "tl", num: true, numAt: "br" };
  assert.deepEqual(feed(good).feed.view, good);
  const bad = feed({
    skin: "../other",
    title: "<b>제목</b>",
    titleAt: "middle",
    num: 1,
    numAt: "br",
    layout: { x: 1 },
  });
  assert.deepEqual(bad.feed.view, { numAt: "br" }); // 모르는 항목(layout)은 그냥 지나친다
  assert.deepEqual(bad.dropped.sort(), ["view.num", "view.skin", "view.title", "view.titleAt"]);
  assert.deepEqual(feed("alps").dropped, ["view"]);
  assert.equal(feed({ title: "가".repeat(41) }).feed.view, undefined);
});

test("focus 는 values 안의 순서여야 한다", () => {
  const feed = (focus) => ({ spec: 1, values: [{ value: 1 }, { value: 2 }, { value: 3 }], focus });
  assert.equal(validateFeed(feed(2)).feed.focus, 2);
  assert.equal(validateFeed(feed(0)).feed.focus, 0);
  for (const bad of [3, -1, 1.5, "1"]) {
    const result = validateFeed(feed(bad));
    assert.equal(result.feed.focus, undefined);
    assert.deepEqual(result.dropped, ["focus"]);
  }
});

test("선택 항목이 틀리면 그 항목만 버린다. 고쳐 쓰지 않는다", () => {
  const result = validateFeed({
    spec: 1,
    values: [{ value: 5, from: "0", to: 10, rate: "fast", scale: 0, rateScale: -1, high: 10, momentum: 0.3 }],
    step: { now: 2, total: 4 },
    focus: 3,
    ttl: -1,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.feed.values, [{ value: 5, to: 10 }]);
  assert.equal(result.feed.step, undefined);
  assert.equal(result.feed.meta, undefined);
  assert.deepEqual(result.dropped.sort(), [
    "focus",
    "step",
    "ttl",
    "values[0].from",
    "values[0].high",
    "values[0].momentum",
    "values[0].rate",
    "values[0].rateScale",
    "values[0].scale",
  ]);
});

test("모르는 항목과 모르는 state 는 무시한다", () => {
  const result = validateFeed({ spec: 1, values: [{ value: 1, color: "red" }], state: "rain", note: "hi" });
  assert.deepEqual(result.feed, { spec: 1, values: [{ value: 1 }], state: "live" });
  assert.deepEqual(result.dropped, []);
});

test("event 는 종류, 시각, 순서를 검사한다", () => {
  const withEvent = (event) => validateFeed({ spec: 1, values: [{ value: 1 }, { value: 2 }], event });
  assert.deepEqual(withEvent({ type: "score", at: 10 }).feed.event, { type: "score", at: 10 });
  assert.deepEqual(withEvent({ type: "score", index: 1, at: 10 }).feed.event.index, 1);
  for (const bad of [
    { type: "Score", at: 10 },
    { type: "score" },
    { type: "score", index: 2, at: 10 },
    { type: "score", index: -1, at: 10 },
    { type: "<b>", at: 10 },
    "score",
  ]) {
    const result = withEvent(bad);
    assert.equal(result.feed.event, undefined);
    assert.deepEqual(result.dropped, ["event"]);
  }
});

test("extra 는 분야별로 검사한다. 주소, HTML, 겹친 객체는 넣을 수 없다", () => {
  const result = validateFeed({
    spec: 1,
    values: [{ value: 1 }],
    extra: {
      baseball: { inning: 7, live: true, bases: [1, 0, 1], half: "bottom" },
      link: { to: "https://example.com/x" },
      html: { text: "<b>hi</b>" },
      nested: { a: { b: 1 } },
      Weather: { rain: 1 },
      long: { text: "x".repeat(65) },
    },
  });
  assert.deepEqual(result.feed.extra, {
    baseball: { inning: 7, live: true, bases: [1, 0, 1], half: "bottom" },
  });
  assert.deepEqual(result.dropped.sort(), [
    "extra.Weather",
    "extra.html",
    "extra.link",
    "extra.long",
    "extra.nested",
  ]);
});

test("extra 가 4KB 를 넘으면 통째로 버린다", () => {
  const big = {};
  for (let i = 0; i < 100; i++) big["k" + i] = "x".repeat(60);
  const result = validateFeed({ spec: 1, values: [{ value: 1 }], extra: { big } });
  assert.equal(result.feed.extra, undefined);
  assert.deepEqual(result.dropped, ["extra"]);
});

test("위험한 이름은 받아들이지 않는다", () => {
  const data = JSON.parse('{"spec":1,"values":[{"value":1}],"extra":{"constructor":{"a":1},"ok":{"__proto__":{"x":1}}}}');
  const result = validateFeed(data);
  assert.deepEqual(Object.keys(result.feed.extra), []);
  assert.equal({}.x, undefined);
});

test("parseFeed 는 크기와 JSON 형식을 먼저 본다", () => {
  assert.equal(parseFeed(JSON.stringify(sample)).ok, true);
  assert.equal(parseFeed("{").ok, false);
  assert.equal(parseFeed(42).ok, false);
  const big = JSON.stringify({ spec: 1, values: [{ value: 1 }], pad: "x".repeat(17000) });
  assert.equal(parseFeed(big).ok, false);
});
