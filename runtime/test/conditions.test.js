import test from "node:test";
import assert from "node:assert/strict";
import { judgeFeed, sceneConditions } from "../src/conditions.js";
import { computeFeed } from "../src/compute.js";

const judge = (values, options) => {
  const feed = { values, state: "live" };
  return judgeFeed(feed, computeFeed(feed), options);
};
const one = (v) => judge([v]).values[0];

test("level 은 fill 의 높이다", () => {
  const level = (fill) => one({ value: fill, high: 1 }).level;
  assert.equal(level(0.04), "empty");
  assert.equal(level(0.05), "low");
  assert.equal(level(0.34), "low");
  assert.equal(level(0.35), "mid");
  assert.equal(level(0.64), "mid");
  assert.equal(level(0.65), "high");
  assert.equal(level(0.94), "high");
  assert.equal(level(0.95), "full");
  assert.equal(level(1), "full");
});

test("trend 는 rise 의 방향이다", () => {
  const trend = (rise) => one({ value: rise, base: 0, scale: 1 }).trend;
  assert.equal(trend(-0.11), "fall");
  assert.equal(trend(-0.1), "flat");
  assert.equal(trend(0), "flat");
  assert.equal(trend(0.1), "flat");
  assert.equal(trend(0.11), "rise");
});

test("pace 는 momentum 의 크기다", () => {
  const pace = (momentum) => one({ value: 1, momentum }).pace;
  assert.equal(pace(0), "calm");
  assert.equal(pace(0.29), "calm");
  assert.equal(pace(0.3), "brisk");
  assert.equal(pace(-0.8), "brisk");
  assert.equal(one({ value: 1 }).pace, "calm");
});

test("판정할 수 없는 조건은 없다", () => {
  assert.deepEqual(one({ value: 5 }), { pace: "calm" });
  assert.deepEqual(one({ value: 5, high: 10 }), { level: "mid", pace: "calm" });
});

test("lead 는 값이 2개일 때만 있다", () => {
  assert.equal(judge([{ value: 3 }, { value: 1 }]).lead, "first");
  assert.equal(judge([{ value: 1 }, { value: 10 }]).lead, "second");
  assert.equal(judge([{ value: 2 }, { value: 2 }]).lead, "tie");
  assert.equal(judge([{ value: 2 }]).lead, undefined);
  assert.equal(judge([{ value: 1 }, { value: 2 }, { value: 3 }]).lead, undefined);
});

test("state 는 피드의 것이고, 끊기면 stale 이다", () => {
  assert.equal(judge([{ value: 1 }]).state, "live");
  assert.equal(judge([{ value: 1 }], { stale: true }).state, "stale");
});

test("경계에서 깜빡이지 않는다: 바뀐 뒤에는 0.03 을 더 넘어가야 되돌아간다", () => {
  let memory;
  const level = (fill) => {
    const judged = judge([{ value: fill, high: 1 }], { memory });
    memory = judged.memory;
    return judged.values[0].level;
  };
  assert.equal(level(0.34), "low");
  assert.equal(level(0.36), "mid"); // 경계를 넘으면 바로 바뀐다
  assert.equal(level(0.34), "mid"); // 살짝 돌아와서는 되돌아가지 않는다
  assert.equal(level(0.33), "mid");
  assert.equal(level(0.31), "low"); // 0.03 을 더 넘어가면 되돌아간다
  assert.equal(level(0.36), "low"); // 방금 내려왔으므로 다시 올라가는 것도 마찬가지다
  assert.equal(level(0.39), "mid");
  assert.equal(level(0.66), "high"); // 되돌아가는 방향이 아니면 경계에서 바로 바뀐다
  assert.equal(level(0.1), "low"); // 크게 움직이면 바로 바뀐다
});

test("앞의 상태가 없으면(정지 그림) 값만으로 판정한다", () => {
  assert.equal(one({ value: 0.34, high: 1 }).level, "low");
  assert.equal(one({ value: 0.36, high: 1 }).level, "mid");
});

test("경우표는 첫째 값의 조건과 lead, state 를 본다", () => {
  const judged = judge([
    { value: 9, high: 10, base: 5 },
    { value: 1, high: 10 },
  ]);
  assert.deepEqual(sceneConditions(judged), {
    level: "high",
    trend: "rise",
    pace: "calm",
    state: "live",
    lead: "first",
  });
});
