import test from "node:test";
import assert from "node:assert/strict";
import { parseFeed, validateFeed } from "../src/validate.js";

const sample = {
  spec: 1,
  values: [{ value: 71200, from: 70100, to: 71900, base: 70500, rate: 45, rateScale: 150 }],
  step: { now: 2, total: 4 },
  state: "live",
  event: { type: "score", index: 0, at: 1794787200 },
  extra: { baseball: { inning: 7, half: "bottom", outs: 2, bases: [1, 0, 1] } },
  ttl: 60,
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

test("선택 항목이 틀리면 그 항목만 버린다. 고쳐 쓰지 않는다", () => {
  const result = validateFeed({
    spec: 1,
    values: [{ value: 5, from: "0", to: 10, rate: "fast", scale: 0, rateScale: -1, high: 10, momentum: 0.3 }],
    step: { now: "2" },
    ttl: -1,
  });
  assert.equal(result.ok, true);
  assert.deepEqual(result.feed.values, [{ value: 5, to: 10 }]);
  assert.equal(result.feed.step, undefined);
  assert.equal(result.feed.ttl, undefined);
  assert.deepEqual(result.dropped.sort(), [
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
