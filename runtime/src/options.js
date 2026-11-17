// 스킨의 선택 항목 (규칙 7.3절). 스킨이 바꿀 수 있는 항목을 스스로 밝히고,
// 런타임은 밝힌 항목만, 밝힌 범위 안에서만 받는다. 받은 값은 스킨의 layout 위에 덮는다.

const NAME = /^[a-z][a-zA-Z0-9]{0,31}$/;
const WORD = /^[a-z0-9-]{1,32}$/;
const COLOR = /^#?[0-9a-f]{6}$/i;
const UNSAFE = new Set(["__proto__", "constructor", "prototype"]);
const MAX = 16;

const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const ok = (name) => NAME.test(name) && !UNSAFE.has(name);

// 스킨이 밝힌 것을 읽는다. 항목 하나는 셋 중 하나다:
//   낱말의 목록 ["round", "pointed"]  → 그 가운데 하나
//   숫자 둘 [4, 24]                   → 그 사이의 수 (둘 다 정수이면 정수만)
//   "color"                           → 색 (#rrggbb)
export function readOptions(declared) {
  const out = {};
  if (declared === null || typeof declared !== "object" || Array.isArray(declared)) return out;
  for (const [name, rule] of Object.entries(declared).slice(0, MAX)) {
    if (!ok(name)) continue;
    if (rule === "color") out[name] = { kind: "color" };
    else if (Array.isArray(rule) && rule.length === 2 && rule.every(isNum) && rule[0] < rule[1]) {
      out[name] = { kind: "range", min: rule[0], max: rule[1], whole: rule.every(Number.isInteger) };
    } else if (
      Array.isArray(rule) &&
      rule.length >= 1 &&
      rule.length <= 32 &&
      rule.every((w) => typeof w === "string" && WORD.test(w))
    ) {
      out[name] = { kind: "choice", choices: rule };
    }
  }
  return out;
}

// given 에서 밝힌 항목에 맞는 값만 고른다. 틀린 값은 고쳐 쓰지 않고 버린다.
// 돌려주는 것: { values, dropped }
export function pickOptions(options, given) {
  const values = {};
  const dropped = [];
  if (given === null || typeof given !== "object") return { values, dropped };
  for (const [name, value] of Object.entries(given)) {
    const rule = Object.hasOwn(options, name) ? options[name] : null;
    const text = String(value);
    if (!rule) dropped.push(name);
    else if (rule.kind === "color" && COLOR.test(text)) {
      values[name] = `#${text.replace("#", "").toLowerCase()}`;
    } else if (rule.kind === "choice" && rule.choices.includes(text)) {
      values[name] = text;
    } else if (rule.kind === "range" && text.trim() !== "") {
      const n = Number(value);
      const fits = Number.isFinite(n) && n >= rule.min && n <= rule.max;
      if (fits && (!rule.whole || Number.isInteger(n))) values[name] = n;
      else dropped.push(name);
    } else dropped.push(name);
  }
  return { values, dropped };
}
