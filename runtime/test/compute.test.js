import test from "node:test";
import assert from "node:assert/strict";
import { computeFeed, computeValue } from "../src/compute.js";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
const feedOf = (...values) => ({ values: values.map((value) => ({ value })) });

test("fill 은 (value − low) ÷ (high − low) 이고, low 가 없으면 0 이다", () => {
  near(computeValue({ value: 6200, high: 10000 }).fill, 0.62);
  near(computeValue({ value: 71200, low: 70100, high: 71900 }).fill, 1100 / 1800);
});

test("fill 은 0~1 로 자른다", () => {
  assert.equal(computeValue({ value: 120, high: 100 }).fill, 1);
  assert.equal(computeValue({ value: -5, high: 100 }).fill, 0);
});

test("high 가 없으면 fill 은 없다", () => {
  assert.equal(computeValue({ value: 5 }).fill, null);
  assert.equal(computeValue({ value: 5, low: 1 }).fill, null);
  assert.equal(computeValue({ value: 5, low: 10, high: 10 }).fill, null);
});

test("rise 는 (value − base) ÷ 축척이다. 축척은 scale, 없으면 high − low", () => {
  near(computeValue({ value: 110, base: 100, scale: 40 }).rise, 0.25);
  near(computeValue({ value: 71200, low: 70100, high: 71900, base: 70500 }).rise, 700 / 1800);
  assert.equal(computeValue({ value: 500, base: 100, scale: 40 }).rise, 1);
  assert.equal(computeValue({ value: -500, base: 100, scale: 40 }).rise, -1);
});

test("base 가 없으면 rise 도 없다", () => {
  assert.equal(computeValue({ value: 5, high: 10 }).rise, null);
  assert.equal(computeValue({ value: 5, base: 3 }).rise, null);
});

test("momentum 은 보낸 값만 쓴다. 없으면 0 이다", () => {
  assert.equal(computeValue({ value: 5, high: 10, momentum: -0.4 }).momentum, -0.4);
  assert.equal(computeValue({ value: 5, high: 10 }).momentum, 0);
});

test("share 는 그 값 ÷ 값들의 합이다", () => {
  const even = computeFeed(feedOf(1, 1));
  assert.deepEqual(even.map((c) => c.share), [0.5, 0.5]);
  const lead = computeFeed(feedOf(1, 10));
  near(lead[0].share, 1 / 11);
  near(lead[1].share, 10 / 11);
  assert.deepEqual(computeFeed(feedOf(3)).map((c) => c.share), [1]);
  near(computeFeed(feedOf(50, 30, 20))[1].share, 0.3);
});

test("음수가 섞이거나 합이 0 이면 share 는 없다", () => {
  assert.deepEqual(computeFeed(feedOf(0, 0)).map((c) => c.share), [null, null]);
  assert.deepEqual(computeFeed(feedOf(5, -1)).map((c) => c.share), [null, null]);
});

test("같은 피드는 몇 번을 계산해도 같은 값을 낸다", () => {
  const feed = { values: [{ value: 6200, high: 10000, base: 5400 }, { value: 100, high: 400 }] };
  const first = computeFeed(feed);
  for (let i = 0; i < 5; i++) assert.deepEqual(computeFeed(feed), first);
});

test("원래 값은 raw 로 그대로 넘긴다", () => {
  const v = { value: 5, high: 10, better: "low" };
  assert.equal(computeValue(v).raw, v);
});
