// 계산되는 값 (규칙 3.2절). 컴패니언은 원래 숫자가 아니라 이 값으로 그린다.
// 피드 한 장만으로 정한다. 지난 피드를 기억해 값을 만들지 않는다.

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

// total: 값들의 합. 몫을 낼 수 없으면 null 이다.
export function computeValue(v, total = null) {
  const low = v.low ?? 0;
  const span = v.high === undefined ? undefined : v.high - low;
  const fill = span > 0 ? clamp((v.value - low) / span, 0, 1) : null;

  const scale = v.scale ?? span;
  const rise =
    v.base !== undefined && scale > 0
      ? clamp((v.value - v.base) / scale, -1, 1)
      : null;

  return {
    fill,
    rise,
    momentum: v.momentum ?? 0,
    share: total === null ? null : v.value / total,
    raw: v,
  };
}

export function computeFeed(feed) {
  // 음수가 섞이거나 합이 0 이하이면 몫을 내지 않는다.
  const sum = feed.values.reduce((s, v) => s + v.value, 0);
  const total = sum > 0 && feed.values.every((v) => v.value >= 0) ? sum : null;
  return feed.values.map((v) => computeValue(v, total));
}
