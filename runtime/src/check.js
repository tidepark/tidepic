// 맞는지 점검하기 (규칙 9절). 컴패니언이 밝힌 것(reads)과 실제로 온 것을 대조한다.
// 알릴 것을 목록으로 돌려줄 뿐, 화면을 비우지 않는다.

// 식에 필요한 폭이 없어 값을 낼 수 없는 것을 알린다. 조용히 없애지 않는다.
export function checkFeed(feed) {
  const notices = [];
  feed.values.forEach((v, i) => {
    const ranged = v.to !== undefined && v.to !== (v.from ?? 0);
    if (v.base !== undefined && v.scale === undefined && !ranged) {
      notices.push({
        level: "warn",
        code: "no-scale",
        where: `values[${i}]`,
        message: `values[${i}]: base 가 있는데 scale 도 범위도 없어 rise 를 계산할 수 없다`,
      });
    }
    if (v.rate !== undefined && v.rateScale === undefined) {
      notices.push({
        level: "warn",
        code: "no-rate-scale",
        where: `values[${i}]`,
        message: `values[${i}]: rate 가 있는데 rateScale 이 없어 momentum 을 계산할 수 없다`,
      });
    }
  });
  return notices;
}

export function checkReads(reads, feed, computed) {
  const notices = [];
  if (!reads || typeof reads !== "object") return notices;

  const count = feed.values.length;
  if ((reads.values === 1 || reads.values === 2) && count !== reads.values) {
    notices.push({
      level: "warn",
      code: "count",
      message: `값을 ${reads.values}개 읽는 컴패니언에 ${count}개가 왔다`,
    });
  }

  const needs = Array.isArray(reads.needs) ? reads.needs : [];
  const why = {
    fill: "fill 을 계산할 수 없다 (to 가 없다)",
    rise: "rise 를 계산할 수 없다 (base 나 폭이 없다)",
    momentum: "momentum 을 계산할 수 없다 (rate 나 rateScale 이 없다)",
    share: "share 를 계산할 수 없다 (음수가 있거나 합이 0 이다)",
  };
  for (const [name, message] of Object.entries(why)) {
    if (needs.includes(name) && computed.some((c) => c[name] === null)) {
      notices.push({ level: "warn", code: `needs-${name}`, message });
    }
  }

  const domains = Array.isArray(reads.extra) ? reads.extra : [];
  const missing = domains.filter((d) => !feed.extra || !(d in feed.extra));
  if (missing.length) {
    notices.push({
      level: "info",
      code: "extra",
      message: `extra(${missing.join(", ")})가 오지 않아 기본 동작으로 표시됨`,
    });
  }
  return notices;
}
