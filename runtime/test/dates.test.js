import test from "node:test";
import assert from "node:assert/strict";
import { dateFeed, parseDay } from "../src/dates.js";
import { readConfig } from "../src/config.js";
import { createSource } from "../src/source.js";
import { validateFeed } from "../src/validate.js";

const at = (y, m, d, h = 12) => new Date(y, m - 1, d, h);

test("날짜는 YYYY-MM-DD 만 받고, 없는 날은 받지 않는다", () => {
  assert.equal(parseDay("2026-12-25"), "2026-12-25");
  assert.equal(parseDay("2026-02-30"), undefined);
  assert.equal(parseDay("2026-13-01"), undefined);
  assert.equal(parseDay("2026-1-5"), undefined);
  assert.equal(parseDay("tomorrow"), undefined);
  assert.equal(parseDay(20261225), undefined);
});

test("그날까지 남은 날을 센다. 시각은 보지 않는다", () => {
  const feed = (today) => dateFeed({ until: "2026-12-25" }, today);
  assert.deepEqual(feed(at(2026, 11, 16)), { spec: 1, values: [{ value: 39 }], state: "live" });
  assert.equal(feed(at(2026, 11, 16, 0)).values[0].value, 39);
  assert.equal(feed(at(2026, 11, 16, 23)).values[0].value, 39);
  assert.equal(feed(at(2026, 12, 24)).values[0].value, 1);
});

test("그날은 0 이고, 지나면 0 인 채로 끝남이 된다", () => {
  const feed = (today) => dateFeed({ until: "2026-12-25" }, today);
  assert.deepEqual(feed(at(2026, 12, 25)), { spec: 1, values: [{ value: 0 }], state: "live" });
  assert.deepEqual(feed(at(2026, 12, 26)), { spec: 1, values: [{ value: 0 }], state: "done" });
});

test("시작한 날을 주면 전체 날이 high 가 된다", () => {
  const feed = dateFeed({ until: "2026-12-25", since: "2026-11-15" }, at(2026, 11, 16));
  assert.deepEqual(feed.values, [{ value: 39, high: 40 }]);
  const backwards = dateFeed({ until: "2026-12-25", since: "2027-01-01" }, at(2026, 11, 16));
  assert.deepEqual(backwards.values, [{ value: 39 }]);
});

test("서머타임이 낀 기간도 날 수가 맞다", () => {
  assert.equal(dateFeed({ until: "2026-04-01" }, at(2026, 3, 1)).values[0].value, 31);
  assert.equal(dateFeed({ until: "2026-11-15" }, at(2026, 10, 15)).values[0].value, 31);
});

test("날짜 피드는 검사를 통과한다", () => {
  const result = validateFeed(dateFeed({ until: "2026-12-25", since: "2026-11-01" }, at(2026, 11, 16)));
  assert.equal(result.ok, true);
  assert.deepEqual(result.dropped, []);
});

test("설정: until 을 적으면 날짜에서 받는다", () => {
  const base = "https://tidepark.com/c/petals/";
  assert.deepEqual(readConfig({}, "?until=2026-12-25", base).source, { kind: "date", until: "2026-12-25" });
  assert.deepEqual(readConfig({}, "?until=2026-12-25&since=2026-11-01", base).source, {
    kind: "date",
    until: "2026-12-25",
    since: "2026-11-01",
  });
  assert.deepEqual(readConfig({}, "?until=someday", base).source, { kind: "random" });
  assert.deepEqual(readConfig({}, "?since=2026-11-01", base).source, { kind: "random" });
  assert.deepEqual(readConfig({ until: "2026-12-25" }, "", base).source, { kind: "date", until: "2026-12-25" });
});

test("설정: 주소에 적은 값과 피드 주소가 날짜보다 먼저다", () => {
  const base = "https://tidepark.com/c/petals/";
  assert.equal(readConfig({}, "?until=2026-12-25&v=7", base).source.kind, "inline");
  assert.equal(readConfig({}, "?until=2026-12-25&data=https://feed.example.com/a", base).source.kind, "url");
  assert.equal(readConfig({ data: "https://feed.example.com/a" }, "?until=2026-12-25", base).source.kind, "date");
});

test("받는 곳: 날짜는 시계를 읽어 피드를 낸다", async () => {
  const source = createSource({ kind: "date", until: "2026-12-25" }, { clock: () => at(2026, 12, 20) });
  const result = await source.next(0);
  assert.equal(result.ok, true);
  assert.deepEqual(result.feed.values, [{ value: 5 }]);
});
