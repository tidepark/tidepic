import test from "node:test";
import assert from "node:assert/strict";
import { randomFeed } from "../src/random.js";
import { validateFeed } from "../src/validate.js";
import { computeFeed } from "../src/compute.js";
import { checkFeed, checkReads } from "../src/check.js";
import { formatNumber, numberText } from "../src/overlay.js";
import { createSource } from "../src/source.js";

test("난수는 씨앗과 시각이 같으면 같은 피드를 낸다", () => {
  const a = randomFeed({ seed: "tide", count: 2, time: 12.5 });
  const b = randomFeed({ seed: "tide", count: 2, time: 12.5 });
  const c = randomFeed({ seed: "park", count: 2, time: 12.5 });
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test("난수 피드는 검사를 통과하고 0~100 안에서 부드럽게 움직인다", () => {
  let prev;
  for (let t = 0; t < 600; t += 1) {
    const feed = randomFeed({ seed: 7, count: 5, time: t });
    const result = validateFeed(feed);
    assert.equal(result.ok, true);
    assert.deepEqual(result.dropped, []);
    assert.equal(feed.values.length, 5);
    feed.values.forEach((v, i) => {
      assert.ok(v.value >= 0 && v.value <= 100);
      if (prev) assert.ok(Math.abs(v.value - prev[i].value) < 7);
    });
    prev = feed.values;
  }
});

const check = (reads, data) => {
  const { feed } = validateFeed(data);
  return checkReads(reads, feed, computeFeed(feed)).map((n) => `${n.level}:${n.code}`);
};

test("점검: 폭이 없어 낼 수 없는 값은 조용히 넘기지 않고 알린다", () => {
  const codes = (v) => checkFeed({ values: [v] }).map((n) => n.code);
  assert.deepEqual(codes({ value: 12840, base: 12790 }), ["no-scale"]);
  assert.deepEqual(codes({ value: 12840, base: 12790, scale: 100 }), []);
  assert.deepEqual(codes({ value: 5, to: 10, base: 3 }), []);
  assert.deepEqual(codes({ value: 5, rate: 1 }), ["no-rate-scale"]);
  assert.deepEqual(codes({ value: 5, rate: 1, rateScale: 2 }), []);
});

test("점검: 개수가 다르면 경고한다", () => {
  assert.deepEqual(check({ values: 2 }, { spec: 1, values: [{ value: 1 }] }), ["warn:count"]);
  assert.deepEqual(check({ values: 2 }, { spec: 1, values: [{ value: 1 }, { value: 2 }] }), []);
  assert.deepEqual(check({ values: "many" }, { spec: 1, values: [{ value: 1 }] }), []);
});

test("점검: 계산할 수 없는 값이 필요하면 경고한다", () => {
  const reads = { values: 1, needs: ["fill", "rise"] };
  assert.deepEqual(check(reads, { spec: 1, values: [{ value: 1 }] }), ["warn:needs-fill", "warn:needs-rise"]);
  assert.deepEqual(check(reads, { spec: 1, values: [{ value: 1, to: 2 }] }), ["warn:needs-rise"]);
  assert.deepEqual(check(reads, { spec: 1, values: [{ value: 1, to: 2, base: 1 }] }), []);
  assert.deepEqual(check({ needs: ["share"] }, { spec: 1, values: [{ value: 0 }, { value: 0 }] }), ["warn:needs-share"]);
  assert.deepEqual(check({ needs: ["share"] }, { spec: 1, values: [{ value: 1 }, { value: 10 }] }), []);
});

test("점검: extra 가 오지 않으면 기본 동작으로 표시됨을 알린다", () => {
  const reads = { values: 1, extra: ["baseball"] };
  assert.deepEqual(check(reads, { spec: 1, values: [{ value: 1 }] }), ["info:extra"]);
  assert.deepEqual(check(reads, { spec: 1, values: [{ value: 1 }], extra: { baseball: { outs: 1 } } }), []);
});

test("숫자는 기기 설정과 상관없이 같은 모양으로 적는다", () => {
  assert.equal(formatNumber(71200), "71,200");
  assert.equal(formatNumber(1234567.8), "1,234,568");
  assert.equal(formatNumber(62), "62");
  assert.equal(formatNumber(3.14159), "3.14");
  assert.equal(formatNumber(-1500), "-1,500");
  assert.equal(formatNumber(0), "0");
});

test("값이 1개면 그 값, 2개면 맞대결, 그보다 많으면 숫자를 보여 주지 않는다", () => {
  assert.equal(numberText([{ value: 62 }]), "62");
  assert.equal(numberText([{ value: 92 }, { value: 102 }]), "92 : 102");
  // 값이 셋 이상이면 focus 가 가리키는 값을 보여 준다. 없으면 첫째다.
  assert.equal(numberText([{ value: 1 }, { value: 2 }, { value: 3 }]), "1");
  assert.equal(numberText([{ value: 1 }, { value: 2 }, { value: 3 }], 2), "3");
});

test("받는 곳: 난수와 주소에 적은 값은 검사를 거친 피드를 낸다", async () => {
  const random = await createSource({ kind: "random" }, { seed: "a", count: 2 }).next(3);
  assert.equal(random.ok, true);
  assert.equal(random.feed.values.length, 2);
  const inline = await createSource({ kind: "inline", values: [{ value: 62, to: 100 }] }, {}).next(0);
  assert.deepEqual(inline.feed.values, [{ value: 62, to: 100 }]);
});

test("받는 곳: 주소에서 받은 피드도 검사한다", async () => {
  const reply = (body, init = {}) => async () => new Response(body, init);
  const from = (fetchImpl) => createSource({ kind: "url", url: "https://feed.example.com/a" }, { fetchImpl }).next(0);
  assert.equal((await from(reply('{"spec":1,"values":[{"value":5,"to":10}]}'))).ok, true);
  assert.equal((await from(reply('{"spec":1,"values":[]}'))).ok, false);
  assert.equal((await from(reply("<html>", { status: 200 }))).ok, false);
  assert.equal((await from(reply("no", { status: 404 }))).ok, false);
  assert.equal((await from(reply(" ".repeat(20000)))).ok, false);
});
