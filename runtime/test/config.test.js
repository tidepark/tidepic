import test from "node:test";
import assert from "node:assert/strict";
import { resolveView, readConfig } from "../src/config.js";

const BASE = "https://tidepark.com/c/train/";

test("아무것도 없으면 내장 기본값이다", () => {
  const config = readConfig({}, "", BASE);
  assert.deepEqual(config.source, { kind: "random" });
  assert.equal(config.every, 60);
  assert.equal(config.title, "");
  assert.equal(config.num, false);
  assert.equal(config.titleAt, undefined);
  assert.equal(config.skin, undefined);
});

test("주소 인자가 설정 파일을 덮어쓴다", () => {
  const file = { every: 30, skin: "alps", title: "파일", num: 1, numAt: "bc" };
  const config = readConfig(file, "?every=5&skin=night&title=주소&num=0&numAt=tr", BASE);
  assert.equal(config.every, 5);
  assert.equal(config.skin, "night");
  assert.equal(config.title, "주소");
  assert.equal(config.num, false);
  assert.equal(config.numAt, "tr");
});

test("주소 인자가 틀리면 설정 파일의 값을 쓴다", () => {
  const file = { every: 30, skin: "alps", titleAt: "bc" };
  const config = readConfig(file, "?every=abc&skin=../x&titleAt=zz", BASE);
  assert.equal(config.every, 30);
  assert.equal(config.skin, "alps");
  assert.equal(config.titleAt, "bc");
});

test("assets 와 dataOrigins 는 주소 인자로 바꿀 수 없다", () => {
  const file = { assets: "https://assets.example.com/train/" };
  const config = readConfig(file, "?assets=https://evil.example/&dataOrigins=x", BASE);
  assert.equal(config.assets, "https://assets.example.com/train/");
  assert.equal(readConfig({}, "?assets=https://evil.example/", BASE).assets, undefined);
});

test("v 를 적으면 주소에 직접 적은 값을 쓴다", () => {
  assert.deepEqual(readConfig({}, "?v=62&to=100", BASE).source, {
    kind: "inline",
    values: [{ value: 62, to: 100 }],
  });
  assert.deepEqual(readConfig({}, "?v=92,102&from=0&to=110,120", BASE).source, {
    kind: "inline",
    values: [
      { value: 92, from: 0, to: 110 },
      { value: 102, from: 0, to: 120 },
    ],
  });
  assert.deepEqual(
    readConfig({}, "?v=102&base=100&scale=5&rate=-0.8&rateScale=2", BASE).source,
    {
      kind: "inline",
      values: [{ value: 102, base: 100, scale: 5, rate: -0.8, rateScale: 2 }],
    },
  );
  assert.deepEqual(readConfig({}, "?v=1,,3", BASE).source, { kind: "random" });
});

test("주소에서는 0.2 전의 이름(low, high, momentum)도 받아 새 이름으로 바꾼다", () => {
  assert.deepEqual(readConfig({}, "?v=62&low=10&high=100", BASE).source.values, [
    { value: 62, from: 10, to: 100 },
  ]);
  // 옛 momentum 은 이미 −1~1 이므로 폭을 1 로 둔다
  assert.deepEqual(readConfig({}, "?v=100&momentum=0.7", BASE).source.values, [
    { value: 100, rate: 0.7, rateScale: 1 },
  ]);
  // 새 이름을 같이 적으면 새 이름이 앞선다
  assert.deepEqual(readConfig({}, "?v=5&high=10&to=20", BASE).source.values, [
    { value: 5, to: 20 },
  ]);
  assert.deepEqual(readConfig({}, "?v=abc", BASE).source, { kind: "random" });
});

test("data 에 주소를 적으면 그 주소에서 받는다", () => {
  assert.deepEqual(readConfig({}, "?data=https://feed.example.com/a.json", BASE).source, {
    kind: "url",
    url: "https://feed.example.com/a.json",
  });
  assert.deepEqual(readConfig({}, "?data=feed.json", BASE).source, {
    kind: "url",
    url: "https://tidepark.com/c/train/feed.json",
  });
  assert.deepEqual(readConfig({}, "?data=javascript:alert(1)", BASE).source, { kind: "random" });
});

test("주소 인자의 data 가 설정 파일의 data 보다 먼저다", () => {
  const file = { data: "https://feed.example.com/file.json" };
  assert.equal(readConfig(file, "", BASE).source.url, "https://feed.example.com/file.json");
  assert.deepEqual(readConfig(file, "?data=random", BASE).source, { kind: "random" });
  assert.equal(readConfig(file, "?v=5&high=10", BASE).source.kind, "inline");
});

test("dataOrigins 가 있으면 그 안의 주소만 받는다", () => {
  const file = { dataOrigins: ["https://feed.tidepark.com/"] };
  assert.equal(readConfig(file, "?data=https://feed.tidepark.com/x", BASE).source.kind, "url");
  assert.deepEqual(readConfig(file, "?data=https://evil.example/x", BASE).source, { kind: "random" });
});

test("제목은 제어 문자를 빼고 40자에서 자른다", () => {
  const title = readConfig({}, "?title=" + encodeURIComponent("가".repeat(50) + "\n"), BASE).title;
  assert.equal(title, "가".repeat(40));
  assert.equal(readConfig({}, "?title=%3Cb%3E", BASE).title, "<b>");
});

test("every 는 1초에서 하루 사이다", () => {
  assert.equal(readConfig({}, "?every=0.1", BASE).every, 60);
  assert.equal(readConfig({}, "?every=999999", BASE).every, 60);
  assert.equal(readConfig({}, "?every=1", BASE).every, 1);
});

test("보이기는 주소, 피드의 view, 설정 파일의 순으로 먼저 쓴다", () => {
  const file = { skin: "alps", title: "파일", num: true };
  const view = { skin: "plain", title: "피드", num: false, numAt: "tr" };

  // 주소에 아무것도 없으면 피드가 설정 파일을 덮는다
  assert.deepEqual(resolveView(readConfig(file, "", BASE), view), {
    skin: "plain",
    title: "피드",
    titleAt: undefined,
    num: false,
    numAt: "tr",
  });
  // 주소에 적은 것은 피드보다 앞선다
  const fromUrl = resolveView(readConfig(file, "?skin=night&title=주소&num=1&numAt=bl", BASE), view);
  assert.deepEqual(fromUrl, {
    skin: "night",
    title: "주소",
    titleAt: undefined,
    num: true,
    numAt: "bl",
  });
  // 주소에서 비우거나 끈 것도 주소가 정한 것이다
  const off = resolveView(readConfig(file, "?title=&num=0", BASE), view);
  assert.equal(off.title, "");
  assert.equal(off.num, false);
  // 피드에 view 가 없으면 설정 파일과 기본값이다
  assert.deepEqual(resolveView(readConfig(file, "", BASE)), {
    skin: "alps",
    title: "파일",
    titleAt: undefined,
    num: true,
    numAt: undefined,
  });
});
