import test from "node:test";
import assert from "node:assert/strict";
import { checkLottie } from "../src/lottie.js";
import { isLottie, pickScene, readScenes, tableFiles, unjudged } from "../src/scenes.js";

// 규칙 7.1절의 예시
const sample = {
  slug: "spring",
  name: { en: "Spring", ko: "봄" },
  scenes: [
    { when: { state: ["idle", "done"] }, show: "night.webp" },
    { when: { level: "full" }, show: "bloom.webm", poster: "bloom.webp" },
    {
      when: { trend: "rise", pace: "brisk" },
      show: "breeze.webp",
      effects: [{ type: "drift", image: "petal.webp", amount: "fill" }],
    },
    { show: "calm.webp" },
  ],
  events: [{ on: "score", play: "burst.webm" }],
  fade: 1.5,
};

test("규칙의 예시 경우표를 읽는다", () => {
  const result = readScenes(sample);
  assert.equal(result.ok, true);
  assert.deepEqual(result.problems, []);
  assert.equal(result.table.scenes.length, 4);
  assert.equal(result.table.fade, 1.5);
  assert.deepEqual(result.table.scenes[0].when, { state: ["idle", "done"] });
  assert.deepEqual(result.table.scenes[2].effects, [{ type: "drift", image: "petal.webp", amount: "fill" }]);
  assert.deepEqual(result.table.events, [{ on: "score", play: "burst.webm" }]);
});

test("위에서부터 맞춰 보고 처음 맞는 줄을 고른다", () => {
  const { table } = readScenes(sample);
  const pick = (conditions) => table.scenes[pickScene(table, conditions)].show;
  assert.equal(pick({ state: "idle", level: "full" }), "night.webp");
  assert.equal(pick({ state: "live", level: "full" }), "bloom.webm");
  assert.equal(pick({ state: "live", level: "mid", trend: "rise", pace: "brisk" }), "breeze.webp");
  assert.equal(pick({ state: "live", level: "mid", trend: "rise", pace: "calm" }), "calm.webp");
  assert.equal(pick({ state: "live" }), "calm.webp");
});

test("기본 장면이 없으면 경우표를 받지 않는다", () => {
  assert.equal(readScenes({ scenes: [{ when: { level: "full" }, show: "a.webp" }] }).ok, false);
  assert.equal(readScenes({ scenes: [] }).ok, false);
  assert.equal(readScenes(null).ok, false);
});

test("틀린 줄은 버리고 알린다", () => {
  const result = readScenes({
    scenes: [
      { when: { level: "huge" }, show: "a.webp" },
      { when: { weather: "rain" }, show: "a.webp" },
      { when: { level: "full" }, show: "movie.webm" },
      { when: { level: "low" }, show: "../secret.webp" },
      { when: { level: "mid" }, show: "https://example.com/a.webp" },
      { show: "base.webp", effects: [{ type: "explode", image: "p.webp" }, { type: "fall", image: "p.webp", amount: 2 }] },
    ],
    events: [{ on: "Score", play: "a.webm" }, { on: "score", play: "x.exe" }],
    fade: -1,
  });
  assert.equal(result.ok, true);
  assert.equal(result.table.scenes.length, 1);
  assert.deepEqual(result.table.scenes[0], { show: "base.webp", effects: [] });
  assert.deepEqual(result.table.events, []);
  assert.equal(result.table.fade, 1);
  assert.deepEqual(result.problems, [
    "scenes[0].when",
    "scenes[1].when",
    "scenes[2].poster",
    "scenes[3].show",
    "scenes[4].show",
    "scenes[5].effects[0]",
    "scenes[5].effects[1]",
    "events[0]",
    "events[1]",
  ]);
});

test("판정할 수 없는 조건을 쓰는 줄을 찾아낸다", () => {
  const { table } = readScenes(sample);
  assert.deepEqual(unjudged(table, { state: "live", pace: "calm" }).sort(), ["level", "trend"]);
  assert.deepEqual(unjudged(table, { state: "live", pace: "calm", level: "mid", trend: "flat" }), []);
});

test("경우표가 쓰는 파일을 모은다", () => {
  const { table } = readScenes(sample);
  assert.deepEqual(tableFiles(table).sort(), [
    "bloom.webm",
    "bloom.webp",
    "breeze.webp",
    "burst.webm",
    "calm.webp",
    "night.webp",
    "petal.webp",
  ]);
});

test("Lottie 파일을 show 에 적을 수 있다. poster 가 있어야 하고 follow 로 값을 따라간다", () => {
  const result = readScenes({
    scenes: [
      { when: { level: "full" }, show: "sun.json", poster: "sun.webp", follow: "fill" },
      { when: { level: "high" }, show: "sun.json", poster: "sun.webp", follow: "speed" },
      { when: { level: "mid" }, show: "sun.json" },
      { when: { level: "low" }, show: "clip.webm", poster: "sun.webp", follow: "fill" },
      { when: { level: "empty" }, show: "scenes.json", poster: "sun.webp" },
      { show: "sun.json", poster: "sun.webp" },
    ],
  });
  assert.equal(result.ok, true);
  assert.deepEqual(
    result.table.scenes.map((s) => [s.show, s.follow]),
    [["sun.json", "fill"], ["sun.json", undefined], ["clip.webm", undefined], ["sun.json", undefined]],
  );
  assert.deepEqual(result.problems, [
    "scenes[1].follow",
    "scenes[2].poster",
    "scenes[3].follow",
    "scenes[4].show",
  ]);
  assert.deepEqual(tableFiles(result.table).sort(), ["clip.webm", "sun.json", "sun.webp"]);
  assert.equal(isLottie("skin.json"), false);
  assert.equal(isLottie("../a.json"), false);
});

test("Lottie 파일은 그림을 안에 담고, 글꼴을 쓰지 않아야 한다", () => {
  const ok = { w: 800, h: 500, fr: 30, ip: 0, op: 60, layers: [] };
  assert.equal(checkLottie(ok), null);
  assert.equal(
    checkLottie({ ...ok, assets: [{ id: "a", layers: [] }, { id: "b", p: "data:image/png;base64,AAAA" }] }),
    null,
  );
  assert.ok(checkLottie({ ...ok, assets: [{ id: "a", u: "https://example.com/", p: "a.png" }] }));
  assert.ok(checkLottie({ ...ok, assets: [{ id: "a", u: "images/", p: "a.png" }] }));
  assert.ok(checkLottie({ ...ok, fonts: { list: [{ fName: "X", fPath: "https://example.com/x.css" }] } }));
  assert.ok(checkLottie({ ...ok, op: 0 }));
  assert.ok(checkLottie({ scenes: [] }));
  assert.ok(checkLottie(null));
});
