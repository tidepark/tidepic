import test from "node:test";
import assert from "node:assert/strict";
import { computeFeed, computeValue } from "../src/compute.js";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
const feedOf = (...values) => ({ values: values.map((value) => ({ value })) });

test("fill 은 (value − from) ÷ (to − from) 이고, from 이 없으면 0 이다", () => {
  near(computeValue({ value: 6200, to: 10000 }).fill, 0.62);
  near(computeValue({ value: 71200, from: 70100, to: 71900 }).fill, 1100 / 1800);
});

test("to 가 from 보다 작아도 된다. fill 은 from 에서 to 로 온 만큼이다", () => {
  near(computeValue({ value: 72, from: 78, to: 70 }).fill, 0.75); // 감량
  near(computeValue({ value: 3, from: 30, to: 0 }).fill, 0.9); // 남은 날
});

test("fill 은 0~1 로 자르고, 범위 밖은 over 와 under 로 낸다", () => {
  const past = computeValue({ value: 132, to: 100 });
  assert.equal(past.fill, 1);
  near(past.over, 0.32);
  assert.equal(past.under, 0);
  const short = computeValue({ value: -5, to: 100 });
  assert.equal(short.fill, 0);
  near(short.under, 0.05);
  assert.equal(short.over, 0);
  assert.equal(computeValue({ value: 900, to: 100 }).over, 1);
  // 줄어드는 범위에서도 to 를 지나면 over 다
  near(computeValue({ value: 68, from: 78, to: 70 }).over, 0.25);
});

test("to 가 없거나 from 과 같으면 fill, over, under 는 없다", () => {
  assert.equal(computeValue({ value: 5 }).fill, null);
  assert.equal(computeValue({ value: 5, from: 1 }).fill, null);
  const flat = computeValue({ value: 5, from: 10, to: 10 });
  assert.deepEqual([flat.fill, flat.over, flat.under], [null, null, null]);
});

test("rise 는 (value − base) ÷ 폭이다. 폭은 scale, 없으면 범위의 크기", () => {
  near(computeValue({ value: 110, base: 100, scale: 40 }).rise, 0.25);
  near(computeValue({ value: 71200, from: 70100, to: 71900, base: 70500 }).rise, 700 / 1800);
  near(computeValue({ value: 72, from: 78, to: 70, base: 74 }).rise, -0.25);
  assert.equal(computeValue({ value: 500, base: 100, scale: 40 }).rise, 1);
  assert.equal(computeValue({ value: -500, base: 100, scale: 40 }).rise, -1);
});

test("base 나 폭이 없으면 rise 는 없다", () => {
  assert.equal(computeValue({ value: 5, to: 10 }).rise, null);
  assert.equal(computeValue({ value: 5, base: 3 }).rise, null);
});

test("momentum 은 rate ÷ rateScale 이고 −1~1 로 자른다. 둘 중 하나가 없으면 없다", () => {
  near(computeValue({ value: 5, rate: -0.8, rateScale: 2 }).momentum, -0.4);
  assert.equal(computeValue({ value: 5, rate: 9, rateScale: 2 }).momentum, 1);
  assert.equal(computeValue({ value: 5, rate: 0, rateScale: 2 }).momentum, 0);
  assert.equal(computeValue({ value: 5, rate: 0.3 }).momentum, null);
  assert.equal(computeValue({ value: 5, to: 10 }).momentum, null);
});

test("share 는 그 값 ÷ 값들의 합이다", () => {
  const even = computeFeed(feedOf(1, 1));
  assert.deepEqual(even.map((c) => c.share), [0.5, 0.5]);
  const lead = computeFeed(feedOf(1, 10));
  near(lead[0].share, 1 / 11);
  near(lead[1].share, 10 / 11);
  near(computeFeed(feedOf(50, 30, 20))[1].share, 0.3);
});

test("rank 는 큰 순서다. 같은 값은 같은 순위다", () => {
  const rank = (...values) => computeFeed(feedOf(...values)).map((c) => c.rank);
  assert.deepEqual(rank(512, 430, 58), [1, 2, 3]);
  assert.deepEqual(rank(3.1, 2.9, 3.4, 2.2, 3.0), [2, 4, 1, 5, 3]);
  assert.deepEqual(rank(2, 2, 1), [1, 1, 3]);
});

test("값이 하나이면 견줄 것이 없어 share 와 rank 가 없다", () => {
  const [only] = computeFeed(feedOf(3));
  assert.equal(only.share, null);
  assert.equal(only.rank, null);
});

test("음수가 섞이거나 합이 0 이면 share 는 없다", () => {
  assert.deepEqual(computeFeed(feedOf(0, 0)).map((c) => c.share), [null, null]);
  assert.deepEqual(computeFeed(feedOf(5, -1)).map((c) => c.share), [null, null]);
});

test("같은 피드는 몇 번을 계산해도 같은 값을 낸다", () => {
  const feed = { values: [{ value: 6200, to: 10000, base: 5400 }, { value: 100, to: 400 }] };
  const first = computeFeed(feed);
  for (let i = 0; i < 5; i++) assert.deepEqual(computeFeed(feed), first);
});

test("원래 값은 raw 로 그대로 넘긴다", () => {
  const v = { value: 5, to: 10 };
  assert.equal(computeValue(v).raw, v);
});
