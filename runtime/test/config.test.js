import test from "node:test";
import assert from "node:assert/strict";
import { readConfig } from "../src/config.js";

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
  assert.deepEqual(readConfig({}, "?v=62&high=100", BASE).source, {
    kind: "inline",
    values: [{ value: 62, high: 100 }],
  });
  assert.deepEqual(readConfig({}, "?v=92,102&low=0&high=110,120", BASE).source, {
    kind: "inline",
    values: [
      { value: 92, low: 0, high: 110 },
      { value: 102, low: 0, high: 120 },
    ],
  });
  assert.deepEqual(
    readConfig({}, "?v=102&base=100&scale=5&momentum=-0.4", BASE).source,
    {
      kind: "inline",
      values: [{ value: 102, base: 100, scale: 5, momentum: -0.4 }],
    },
  );
  assert.deepEqual(readConfig({}, "?v=1,,3", BASE).source, { kind: "random" });
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
