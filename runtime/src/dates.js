// 날짜 (규칙 4절). 받는 곳 가운데 하나다. 그날까지 남은 날을 페이지가 센다. 네트워크를 쓰지 않는다.

const DAY_MS = 86400000;

// "2026-12-25" 같은 날짜만 받는다. 없는 날(2월 30일)은 받지 않는다.
export function parseDay(text) {
  if (typeof text !== "string") return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!m) return undefined;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  const real =
    date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d;
  return real ? text : undefined;
}

// 보는 기기의 시간대에서 그날 0시
function midnight(text) {
  const [y, mo, d] = text.split("-").map(Number);
  return new Date(y, mo - 1, d);
}

// 남은 날을 세는 피드. value 가 남은 날이고, 전체 날(from)에서 0(to)으로 간다.
// 그래서 채움은 그날에 다가온 만큼이다. since(시작한 날)가 없으면 범위가 없다.
// 그날이 지나면 0 이고 끝남(done)이다.
export function dateFeed({ until, since }, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const left = Math.round((midnight(until) - start) / DAY_MS);
  const value = { value: Math.max(0, left) };
  if (since) {
    const total = Math.round((midnight(until) - midnight(since)) / DAY_MS);
    if (total > 0) Object.assign(value, { from: total, to: 0 });
  }
  return { spec: 1, values: [value], state: left < 0 ? "done" : "live" };
}
