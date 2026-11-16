// 데이터를 받는 곳 (규칙 4절). 어느 곳이든 검사를 거친 같은 모양의 결과를 낸다.

import { LIMITS, parseFeed, validateFeed } from "./validate.js";
import { randomFeed } from "./random.js";
import { dateFeed } from "./dates.js";

// source: readConfig 가 고른 받는 곳. count: 난수로 만들 값의 개수.
export function createSource(
  source,
  { seed, count = 1, fetchImpl = fetch, clock = () => new Date() },
) {
  if (source.kind === "inline") {
    const result = validateFeed({ spec: 1, values: source.values });
    return { kind: "inline", next: async () => result };
  }
  if (source.kind === "date") {
    return {
      kind: "date",
      next: async () => validateFeed(dateFeed(source, clock())),
    };
  }
  if (source.kind === "url") {
    return {
      kind: "url",
      async next() {
        const response = await fetchImpl(source.url, {
          credentials: "omit",
          referrerPolicy: "no-referrer",
          cache: "no-store",
        });
        if (!response.ok) {
          return { ok: false, error: `피드 응답이 ${response.status} 이다` };
        }
        const length = Number(response.headers.get("content-length"));
        if (length > LIMITS.feedBytes) {
          return { ok: false, error: "피드가 16KB 를 넘는다" };
        }
        return parseFeed(await response.text());
      },
    };
  }
  return {
    kind: "random",
    next: async (time) => validateFeed(randomFeed({ seed, count, time })),
  };
}
