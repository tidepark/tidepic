// 설정 읽기 (규칙 5절). 우선순위는 주소 인자, 설정 파일, 내장 기본값 순이다.

import { parseDay } from "./dates.js";

export const POSITIONS = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];

const TITLE_MAX = 40;
const SLUG = /^[a-z0-9-]{1,64}$/;

// 주소 인자로 받는 것. assets 와 dataOrigins 는 설정 파일에서만 받는다.
const URL_KEYS = [
  "data",
  "every",
  "skin",
  "seed",
  "title",
  "titleAt",
  "num",
  "numAt",
  "v",
  "from",
  "to",
  "base",
  "scale",
  "rate",
  "rateScale",
  "low",
  "high",
  "momentum",
  "until",
  "since",
];

const isObject = (x) =>
  x !== null && typeof x === "object" && !Array.isArray(x);

// 후보를 앞에서부터 보고, 처음으로 맞는 값을 돌려준다.
function first(parse, ...candidates) {
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null) continue;
    const value = parse(candidate);
    if (value !== undefined) return value;
  }
  return undefined;
}

const parseEvery = (x) => {
  const n = Number(x);
  return Number.isFinite(n) && n >= 1 && n <= 86400 ? n : undefined;
};
const parseSlug = (x) => (typeof x === "string" && SLUG.test(x) ? x : undefined);
const parseSeed = (x) => {
  const text = String(x);
  return text.length >= 1 && text.length <= 64 ? text : undefined;
};
const parsePosition = (x) => (POSITIONS.includes(x) ? x : undefined);
const parseNum = (x) => x === true || x === 1 || x === "1";
// 제목은 일반 글자다. 제어 문자를 빼고 40자에서 자른다.
const parseTitle = (x) =>
  Array.from(String(x).replace(/[\u0000-\u001f\u007f]/g, ""))
    .slice(0, TITLE_MAX)
    .join("");

function parseList(x) {
  const parts = Array.isArray(x) ? x : String(x).split(",");
  const nums = parts.map((part) =>
    typeof part === "string" && part.trim() === "" ? NaN : Number(part),
  );
  return nums.length >= 1 && nums.length <= 64 && nums.every(Number.isFinite)
    ? nums
    : undefined;
}

// 주소에 직접 적은 값을 피드의 values 로 바꾼다. 하나만 적은 from·to 같은 값은 모든 값에 쓴다.
// low, high, momentum 은 0.2 전의 이름이다. 이미 복사해 간 주소가 있어, 주소에서만 한동안 받는다.
function inlineValues(raw) {
  const v = first(parseList, raw.v);
  if (!v) return undefined;
  const lists = {
    from: first(parseList, raw.from, raw.low),
    to: first(parseList, raw.to, raw.high),
    base: first(parseList, raw.base),
    scale: first(parseList, raw.scale),
    rate: first(parseList, raw.rate, raw.momentum),
    rateScale: first(parseList, raw.rateScale),
  };
  // 옛 momentum 은 이미 −1~1 이다.
  if (raw.rate === undefined && lists.rate && !lists.rateScale) lists.rateScale = [1];
  return v.map((value, i) => {
    const out = { value };
    for (const [key, list] of Object.entries(lists)) {
      if (!list) continue;
      const n = list.length === 1 ? list[0] : list[i];
      if (n !== undefined) out[key] = n;
    }
    return out;
  });
}

function parseDataUrl(x, base, origins) {
  if (typeof x !== "string" || x === "random") return undefined;
  let url;
  try {
    url = new URL(x, base);
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
  // 다른 곳의 피드는 https 로만 받는다. 같은 곳의 것은 페이지를 따라간다.
  let home;
  try {
    home = new URL(base).origin;
  } catch {
    home = undefined;
  }
  if (url.origin !== home && url.protocol !== "https:") return undefined;
  if (origins.length && !origins.some((o) => url.href.startsWith(o))) {
    return undefined;
  }
  return url.href;
}

// 주소 인자를 먼저 보고, 그다음 설정 파일을 본다. 어느 쪽에도 없으면 난수다.
function pickSource(fromUrl, file, base, origins) {
  for (const raw of [fromUrl, file]) {
    if (raw.data === "random") return { kind: "random" };
    const url = parseDataUrl(raw.data, base, origins);
    if (url) return { kind: "url", url };
    const values = inlineValues(raw);
    if (values) return { kind: "inline", values };
    const until = parseDay(raw.until);
    if (until) {
      const since = parseDay(raw.since);
      return since ? { kind: "date", until, since } : { kind: "date", until };
    }
  }
  return { kind: "random" };
}

export function readConfig(file, search = "", base) {
  if (!isObject(file)) file = {};
  const params = new URLSearchParams(search);
  const fromUrl = {};
  for (const key of URL_KEYS) {
    if (params.has(key)) fromUrl[key] = params.get(key);
  }

  const origins = Array.isArray(file.dataOrigins)
    ? file.dataOrigins.filter((o) => typeof o === "string" && o.length > 0)
    : [];
  let assets;
  if (typeof file.assets === "string" && file.assets) {
    try {
      assets = new URL(file.assets, base).href;
    } catch {
      assets = undefined;
    }
  }

  return {
    source: pickSource(fromUrl, file, base, origins),
    every: first(parseEvery, fromUrl.every, file.every) ?? 60,
    skin: first(parseSlug, fromUrl.skin, file.skin),
    seed: first(parseSeed, fromUrl.seed, file.seed),
    title: first(parseTitle, fromUrl.title, file.title) ?? "",
    // 위치를 고르지 않았으면 비워 둔다. 스킨이 권하는 위치, 그다음 기본값이 채운다.
    titleAt: first(parsePosition, fromUrl.titleAt, file.titleAt),
    num: first(parseNum, fromUrl.num, file.num) ?? false,
    numAt: first(parsePosition, fromUrl.numAt, file.numAt),
    assets,
    // 주소에 적은 것만 따로 둔다. 피드의 view 보다 앞서기 때문이다.
    fixed: {
      skin: first(parseSlug, fromUrl.skin),
      title: first(parseTitle, fromUrl.title),
      titleAt: first(parsePosition, fromUrl.titleAt),
      num: fromUrl.num === undefined ? undefined : parseNum(fromUrl.num),
      numAt: first(parsePosition, fromUrl.numAt),
    },
  };
}

// 보이기를 정한다 (규칙 5절). 주소에 적은 것, 피드의 view, 설정 파일의 순으로 먼저 쓴다.
// 화면을 걸어 둔 사람(주소)이 보내는 쪽(피드)보다 앞선다.
export function resolveView(config, view = {}) {
  const out = {};
  for (const key of ["skin", "title", "titleAt", "num", "numAt"]) {
    out[key] = config.fixed[key] ?? view[key] ?? config[key];
  }
  return out;
}
