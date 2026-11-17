import test from "node:test";
import assert from "node:assert/strict";
import { pickOptions, readOptions } from "../src/options.js";

const declared = readOptions({
  petal: ["wedge", "round", "pointed"],
  petals: [4, 24],
  width: [0.5, 2],
  from: "color",
  to: "color",
});

test("스킨이 밝힌 항목을 세 가지 모양으로 읽는다", () => {
  assert.deepEqual(declared.petal, { kind: "choice", choices: ["wedge", "round", "pointed"] });
  assert.deepEqual(declared.petals, { kind: "range", min: 4, max: 24, whole: true });
  assert.deepEqual(declared.width, { kind: "range", min: 0.5, max: 2, whole: false });
  assert.deepEqual(declared.from, { kind: "color" });
});

test("틀리게 밝힌 항목은 없는 것으로 본다", () => {
  const bad = readOptions({
    __proto__: "color",
    "bad name": "color",
    text: "anything",
    range: [5, 1],
    words: ["ok", "<b>"],
    empty: [],
  });
  assert.deepEqual(bad, {});
  assert.deepEqual(readOptions("color"), {});
  assert.deepEqual(readOptions(undefined), {});
});

test("밝힌 항목만, 밝힌 범위 안에서만 받는다", () => {
  const { values, dropped } = pickOptions(declared, {
    petal: "round",
    petals: "6", // 주소에서 온 값은 글자다
    width: 1.5,
    from: "FFB000", // 주소에는 # 를 적지 못한다
    to: "#fff3c4",
  });
  assert.deepEqual(values, { petal: "round", petals: 6, width: 1.5, from: "#ffb000", to: "#fff3c4" });
  assert.deepEqual(dropped, []);
});

test("틀린 값과 밝히지 않은 항목은 버린다. 고쳐 쓰지 않는다", () => {
  const { values, dropped } = pickOptions(declared, {
    petal: "star",
    petals: 6.5,
    width: 9,
    from: "red",
    to: "",
    title: "x",
    constructor: "x",
  });
  assert.deepEqual(values, {});
  assert.deepEqual(dropped.sort(), ["constructor", "from", "petal", "petals", "title", "to", "width"]);
  assert.deepEqual(pickOptions(declared, undefined), { values: {}, dropped: [] });
});
