// 피드 검사 (규칙 3절, 11절). 맞는 것만 새 객체로 옮겨 담아 돌려준다.
// 필수 항목이 틀리면 피드 전체를 버리고, 선택 항목이 틀리면 그 항목만 버린다. 고쳐 쓰지 않는다.

export const LIMITS = {
  feedBytes: 16 * 1024,
  values: 64,
  extraBytes: 4 * 1024,
  text: 64,
};

const STATES = ["live", "idle", "done"];
const WORD = /^[a-z]+$/;
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

const isObject = (x) =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const byteLength = (text) => new TextEncoder().encode(text).length;
const isWord = (x) =>
  typeof x === "string" &&
  x.length <= LIMITS.text &&
  WORD.test(x) &&
  !UNSAFE_KEYS.has(x);

// code 는 화면이 제 말로 바꿔 보여 줄 때 쓴다. where 는 틀린 자리다.
const fail = (error, code, where) => ({ ok: false, error, code, ...(where && { where }) });

export function parseFeed(text) {
  if (typeof text !== "string") return fail("피드가 글자가 아니다", "not-text");
  if (byteLength(text) > LIMITS.feedBytes) return fail("피드가 16KB 를 넘는다", "too-big");
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return fail("피드가 JSON 이 아니다", "not-json");
  }
  return validateFeed(data);
}

export function validateFeed(data) {
  if (!isObject(data)) return fail("피드가 객체가 아니다", "not-object");
  if (data.spec !== 1) return fail("spec 이 1 이 아니다", "spec");
  if (!Array.isArray(data.values) || data.values.length < 1) {
    return fail("values 가 없다", "no-values");
  }
  if (data.values.length > LIMITS.values) return fail("values 가 64개를 넘는다", "too-many-values");

  const dropped = [];
  const values = [];
  for (let i = 0; i < data.values.length; i++) {
    const value = cleanValue(data.values[i], i, dropped);
    if (!value) {
      return fail(`values[${i}].value 가 숫자가 아니다`, "value", `values[${i}].value`);
    }
    values.push(value);
  }

  const feed = { spec: 1, values, state: "live" };
  if (STATES.includes(data.state)) feed.state = data.state;

  // 경우표와 숫자 표시가 볼 값의 순서. 없으면 첫째다.
  if (data.focus !== undefined) {
    const inRange =
      Number.isInteger(data.focus) && data.focus >= 0 && data.focus < values.length;
    if (inRange) feed.focus = data.focus;
    else dropped.push("focus");
  }
  if (data.step !== undefined) {
    const step = cleanStep(data.step);
    if (step) feed.step = step;
    else dropped.push("step");
  }
  if (data.event !== undefined) {
    const event = cleanEvent(data.event, values.length);
    if (event) feed.event = event;
    else dropped.push("event");
  }
  if (data.extra !== undefined) {
    const extra = cleanExtra(data.extra, dropped);
    if (extra) feed.extra = extra;
  }
  if (data.ttl !== undefined) {
    if (isNum(data.ttl) && data.ttl >= 0) feed.ttl = data.ttl;
    else dropped.push("ttl");
  }
  return { ok: true, feed, dropped };
}

function cleanValue(v, i, dropped) {
  if (!isObject(v) || !isNum(v.value)) return null;
  const out = { value: v.value };
  // 원점과 숫자: 어떤 수든 된다.
  for (const key of ["from", "to", "base", "rate"]) {
    if (v[key] === undefined) continue;
    if (isNum(v[key])) out[key] = v[key];
    else dropped.push(`values[${i}].${key}`);
  }
  // 폭: 0 보다 커야 한다.
  for (const key of ["scale", "rateScale"]) {
    if (v[key] === undefined) continue;
    if (isNum(v[key]) && v[key] > 0) out[key] = v[key];
    else dropped.push(`values[${i}].${key}`);
  }
  // 0.2 에서 없앤 이름. 읽지 않지만, 보낸 쪽이 알 수 있게 버린 목록에 넣는다.
  for (const key of ["low", "high", "momentum", "better"]) {
    if (v[key] !== undefined) dropped.push(`values[${i}].${key}`);
  }
  return out;
}

// 단계는 값과 같은 모양이다: 지금이 몇 번째(value)이고 몇 번째에서 끝나는가(to).
function cleanStep(step) {
  if (!isObject(step) || !isNum(step.value)) return null;
  const out = { value: step.value };
  if (step.to !== undefined) {
    if (!isNum(step.to)) return null;
    out.to = step.to;
  }
  return out;
}

function cleanEvent(event, count) {
  if (!isObject(event) || !isWord(event.type) || !isNum(event.at)) return null;
  const out = { type: event.type, at: event.at };
  if (event.index !== undefined) {
    const ok =
      Number.isInteger(event.index) && event.index >= 0 && event.index < count;
    if (!ok) return null;
    out.index = event.index;
  }
  return out;
}

// extra 에는 숫자, 짧은 글자, 참·거짓, 그 배열만 넣을 수 있다. 주소와 HTML 은 넣을 수 없다.
function isScalar(x) {
  if (typeof x === "boolean" || isNum(x)) return true;
  return (
    typeof x === "string" &&
    x.length <= LIMITS.text &&
    !/[<>]|:\/\//.test(x)
  );
}

function cleanExtra(extra, dropped) {
  const tooBig = () =>
    byteLength(JSON.stringify(extra)) > LIMITS.extraBytes;
  if (!isObject(extra) || tooBig()) {
    dropped.push("extra");
    return null;
  }
  const out = {};
  for (const [domain, body] of Object.entries(extra)) {
    const clean = isWord(domain) && isObject(body) ? cleanDomain(body) : null;
    if (clean) out[domain] = clean;
    else dropped.push(`extra.${domain}`);
  }
  return out;
}

function cleanDomain(body) {
  const out = {};
  for (const [key, value] of Object.entries(body)) {
    if (UNSAFE_KEYS.has(key) || key.length > LIMITS.text) return null;
    if (Array.isArray(value)) {
      if (value.length > LIMITS.values || !value.every(isScalar)) return null;
      out[key] = [...value];
    } else if (isScalar(value)) {
      out[key] = value;
    } else return null;
  }
  return out;
}
