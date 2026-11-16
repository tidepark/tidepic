// 경우표 (규칙 7.1절). scenes.json 을 검사해 읽고, 조건에 맞는 장면을 고른다.

import { CONDITION_NAMES } from "./conditions.js";

const IMAGE = /^[a-z0-9][a-z0-9._-]*\.(webp|png|jpe?g)$/;
const VIDEO = /^[a-z0-9][a-z0-9._-]*\.(webm|mp4)$/;
const LOTTIE = /^[a-z0-9][a-z0-9._-]*\.json$/;
const RESERVED = ["scenes.json", "skin.json"];
const WORD = /^[a-z]+$/;
const EFFECTS = ["drift", "fall", "float", "count"];
const AMOUNTS = ["fill", "rise", "momentum", "share"];
const MAX_SCENES = 64;
const MAX_EFFECTS = 8;

const isObject = (x) =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const isNum = (x) => typeof x === "number" && Number.isFinite(x);
const isImage = (x) => typeof x === "string" && IMAGE.test(x);
export const isVideo = (x) => typeof x === "string" && VIDEO.test(x);
export const isLottie = (x) =>
  typeof x === "string" && LOTTIE.test(x) && !RESERVED.includes(x);

// when: { 조건: 이름 | [이름…] } 을 { 조건: [이름…] } 으로 맞춘다. 틀리면 null.
function readWhen(when) {
  if (!isObject(when)) return null;
  const out = {};
  for (const [key, value] of Object.entries(when)) {
    const known = CONDITION_NAMES[key];
    const list = Array.isArray(value) ? value : [value];
    if (!known || !list.length || !list.every((v) => known.includes(v))) {
      return null;
    }
    out[key] = list;
  }
  return out;
}

function readEffect(effect) {
  if (!isObject(effect) || !EFFECTS.includes(effect.type)) return null;
  if (!isImage(effect.image)) return null;
  const amount = effect.amount ?? 1;
  const ok = AMOUNTS.includes(amount) || (isNum(amount) && amount >= 0 && amount <= 1);
  if (!ok) return null;
  const out = { type: effect.type, image: effect.image, amount };
  // 조각의 크기(짧은 변에 대한 비율)와 자리. 규칙에 없는 항목이다 (잠정).
  if (isNum(effect.size) && effect.size > 0 && effect.size <= 0.5) {
    out.size = effect.size;
  }
  const isSpot = (s) =>
    Array.isArray(s) && s.length === 2 && s.every((n) => isNum(n) && n >= 0 && n <= 1);
  if (Array.isArray(effect.spots) && effect.spots.length <= 64 && effect.spots.every(isSpot)) {
    out.spots = effect.spots.map((s) => [...s]);
  }
  return out;
}

function readScene(scene, problems, i) {
  if (!isObject(scene)) return null;
  const out = {};
  if (scene.when !== undefined) {
    out.when = readWhen(scene.when);
    if (!out.when) {
      problems.push(`scenes[${i}].when`);
      return null;
    }
  }
  if (isVideo(scene.show) || isLottie(scene.show)) {
    // 영상과 Lottie 에는 정지 화면에 쓸 poster 그림이 있어야 한다.
    if (!isImage(scene.poster)) {
      problems.push(`scenes[${i}].poster`);
      return null;
    }
    out.poster = scene.poster;
    // follow: 되풀이해 트는 대신 그 값의 자리에 멈춰 보여 준다. Lottie 에만 쓴다.
    if (scene.follow !== undefined) {
      if (isLottie(scene.show) && AMOUNTS.includes(scene.follow)) out.follow = scene.follow;
      else problems.push(`scenes[${i}].follow`);
    }
  } else if (!isImage(scene.show)) {
    problems.push(`scenes[${i}].show`);
    return null;
  }
  out.show = scene.show;
  out.effects = [];
  const effects = Array.isArray(scene.effects) ? scene.effects : [];
  effects.slice(0, MAX_EFFECTS).forEach((effect, k) => {
    const clean = readEffect(effect);
    if (clean) out.effects.push(clean);
    else problems.push(`scenes[${i}].effects[${k}]`);
  });
  return out;
}

// 돌려주는 것: { ok, table: { scenes, events, fade }, problems } 또는 { ok: false, error }
export function readScenes(json) {
  if (!isObject(json) || !Array.isArray(json.scenes) || !json.scenes.length) {
    return { ok: false, error: "scenes 가 없다" };
  }
  if (json.scenes.length > MAX_SCENES) {
    return { ok: false, error: "scenes 가 64줄을 넘는다" };
  }
  const problems = [];
  const scenes = [];
  json.scenes.forEach((scene, i) => {
    const clean = readScene(scene, problems, i);
    if (clean) scenes.push(clean);
    else if (!problems.some((p) => p.startsWith(`scenes[${i}]`))) {
      problems.push(`scenes[${i}]`);
    }
  });
  // 마지막 줄은 when 이 없는 기본 장면이어야 한다.
  const last = scenes[scenes.length - 1];
  if (!last || last.when) return { ok: false, error: "기본 장면(마지막 줄, when 없음)이 없다" };

  const events = [];
  (Array.isArray(json.events) ? json.events : []).forEach((event, i) => {
    const ok =
      isObject(event) &&
      typeof event.on === "string" &&
      WORD.test(event.on) &&
      (isVideo(event.play) || isImage(event.play));
    if (ok) events.push({ on: event.on, play: event.play });
    else problems.push(`events[${i}]`);
  });

  const fade = isNum(json.fade) && json.fade >= 0 && json.fade <= 10 ? json.fade : 1;
  return { ok: true, table: { scenes, events, fade }, problems };
}

const matches = (when, conditions) =>
  !when ||
  Object.entries(when).every(([key, names]) => names.includes(conditions[key]));

// 위에서부터 맞춰 보고, when 이 처음으로 맞는 줄의 번호를 돌려준다.
export function pickScene(table, conditions) {
  return table.scenes.findIndex((scene) => matches(scene.when, conditions));
}

// 지금 판정할 수 없는 조건을 쓰는 줄의 조건 이름들 (규칙 9절). 그 줄은 맞는 일이 없다.
export function unjudged(table, conditions) {
  const keys = new Set();
  for (const scene of table.scenes) {
    for (const key of Object.keys(scene.when ?? {})) {
      if (conditions[key] === undefined) keys.add(key);
    }
  }
  return [...keys];
}

// 경우표가 쓰는 파일 이름을 모은다.
export function tableFiles(table) {
  const files = new Set();
  for (const scene of table.scenes) {
    files.add(scene.show);
    if (scene.poster) files.add(scene.poster);
    for (const effect of scene.effects) files.add(effect.image);
  }
  for (const event of table.events) files.add(event.play);
  return [...files];
}
