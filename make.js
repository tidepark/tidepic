// 컴패니언 만들기. 같은 것을 찍은 그림 몇 장이나 GIF 한 편으로, 숫자에 따라 바뀌는 컴패니언(경우표, 규칙 7.1절)을 만든다.
// 넣은 그림은 이 브라우저 안에서만 다룬다. 어디에도 보내지 않는다. 글자는 textContent 로만 넣는다.

import { computeFeed } from "./runtime/src/compute.js";
import { judgeFeed, sceneConditions } from "./runtime/src/conditions.js";
import { readScenes } from "./runtime/src/scenes.js";
import { createStage } from "./runtime/src/stage.js";
import { validateFeed } from "./runtime/src/validate.js";

const TEXT = {
  ko: {
    levels: ["비었음", "낮음", "중간", "높음", "가득"],
    choose: "그림 넣기",
    remove: (level) => `${level} 칸의 그림 빼기`,
    none: "그림을 넣어 주세요.",
    example: "지금 보이는 것은 본보기입니다(Tidepark 의 꽃병). 내 그림을 넣으면 본보기는 사라집니다.",
    own: (n) => `그림 ${n}장. 칸을 끌면 자리를 옮깁니다. 빈 칸은 가장 가까운 칸의 그림을 씁니다.`,
    cantRead: "이 브라우저에서 읽을 수 없는 파일입니다.",
    noDecoder: "이 브라우저는 GIF 를 나누지 못합니다. 크롬 같은 다른 브라우저에서 열거나, 그림을 따로 넣어 주세요.",
    needOwn: "내려받으려면 내 그림을 두 장 이상 넣어 주세요.",
    working: "묶는 중입니다…",
    failed: "묶지 못했습니다. 잠시 뒤에 다시 해 주세요.",
    done: (file) => `${file} 을 내려받았습니다.`,
    defaultName: "내 장면",
  },
  en: {
    levels: ["Empty", "Low", "Middle", "High", "Full"],
    choose: "Add a picture",
    remove: (level) => `Remove the picture in ${level}`,
    none: "Put in a picture.",
    example: "This is the example: the vase from Tidepark. It goes away when you put in a picture of your own.",
    own: (n) => `${n} picture${n === 1 ? "" : "s"}. Drag a slot to move it. An empty slot uses the picture of the nearest slot.`,
    cantRead: "This browser cannot read that file.",
    noDecoder: "This browser cannot split a GIF. Open this page in another browser such as Chrome, or put in separate pictures.",
    needOwn: "Put in at least two pictures of your own to download.",
    working: "Packing…",
    failed: "Could not pack it. Please try again in a moment.",
    done: (file) => `Downloaded ${file}.`,
    defaultName: "My scene",
  },
};
const t = TEXT[document.documentElement.lang === "ko" ? "ko" : "en"];

const LEVELS = ["empty", "low", "mid", "high", "full"]; // 규칙 3.7절의 level. 낮은 쪽부터
const RANGES = ["0–4", "5–34", "35–64", "65–94", "95–100"]; // 범위가 0~100 일 때 단계마다의 숫자
const MAX_SIDE = 1600; // 넣은 그림은 긴 변을 이 안으로 줄인다
const FRAME_MS = 1000 / 30;
// 본보기는 Tidepark 의 꽃병이다. 주소로만 가져다 보이고 묶음에는 넣지 않는다.
const EXAMPLE = "https://assets.tidepark.com/vase/cosmos/";

const $ = (id) => document.getElementById(id);
const canvas = $("scene");
const ctx = canvas.getContext("2d");
const range = $("value");
const note = $("note");

// 칸 다섯(낮은 쪽부터). 칸마다 { media: 그릴 것, thumb: 작은 그림의 주소, blob: 묶음에 넣을 파일, ext } 이거나 비어 있다.
let slots = LEVELS.map(() => null);
let example = true;
let stage = null;
let memory;
let shownLevel = "";
let target = 0; // 그림을 넣을 칸
let dragging = null; // 끌고 있는 칸

const fileName = (k) => `${LEVELS[k]}.${slots[k].ext}`;

// 빈 칸은 가장 가까운 칸의 그림을 쓴다.
function nearest(i) {
  let best = -1;
  slots.forEach((slot, k) => {
    if (slot && (best < 0 || Math.abs(k - i) < Math.abs(best - i))) best = k;
  });
  return best;
}

// 경우표 (규칙 7.1절). 단계마다 그림 한 장이고, 맞는 줄이 없으면 가운데 그림이다.
function tableJson(slug, name) {
  const scenes = LEVELS.map((level, i) => ({ when: { level }, show: fileName(nearest(i)) })).reverse();
  scenes.push({ show: fileName(nearest(2)) });
  return { slug, name: { en: name, ko: name }, scenes, fade: 1 };
}

// n 개 가운데 count 개를 고르게 고른다.
function pickEvenly(n, count) {
  const k = Math.min(n, count);
  return Array.from({ length: k }, (_, i) => (k === 1 ? 0 : Math.round((i * (n - 1)) / (k - 1))));
}

// 그림을 줄여 캔버스에 옮기고, 묶음에 넣을 파일로 만든다.
async function toSlot(source, width, height) {
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
  const media = document.createElement("canvas");
  media.width = Math.round(width * scale);
  media.height = Math.round(height * scale);
  media.getContext("2d").drawImage(source, 0, 0, media.width, media.height);
  const blob = await new Promise((done) => media.toBlob(done, "image/webp", 0.85));
  // webp 로 내지 못하는 브라우저는 png 를 준다.
  return { media, blob, thumb: URL.createObjectURL(blob), ext: blob.type === "image/webp" ? "webp" : "png" };
}

async function fromFile(file) {
  const bitmap = await createImageBitmap(file);
  const slot = await toSlot(bitmap, bitmap.width, bitmap.height);
  bitmap.close();
  return slot;
}

// GIF 에서 다섯 장을 고르게 뽑는다.
async function fromAnimation(file) {
  const decoder = new ImageDecoder({ data: await file.arrayBuffer(), type: file.type });
  await decoder.tracks.ready;
  await decoder.completed;
  const out = [];
  for (const frameIndex of pickEvenly(decoder.tracks.selectedTrack.frameCount, LEVELS.length)) {
    const { image } = await decoder.decode({ frameIndex });
    out.push(await toSlot(image, image.displayWidth, image.displayHeight));
    image.close();
  }
  decoder.close();
  return out;
}

function clear() {
  for (const slot of slots) if (slot?.blob) URL.revokeObjectURL(slot.thumb);
  slots = LEVELS.map(() => null);
}

// 그림 여러 장을 칸에 고르게 놓는다. 첫 장이 비었음, 마지막 장이 가득이다.
function fill(items) {
  clear();
  example = false;
  const picked = pickEvenly(items.length, LEVELS.length).map((i) => items[i]);
  const places = picked.length === 1 ? [2] : pickEvenly(LEVELS.length, picked.length);
  places.forEach((k, i) => (slots[k] = picked[i]));
  rebuild();
}

function showExample() {
  clear();
  example = true;
  slots = LEVELS.map((_, k) => {
    const media = new Image();
    media.src = `${EXAMPLE}back${LEVELS.length - k}.webp`; // back1 이 생생한 꽃, back5 가 마른 꽃
    return { media, thumb: media.src, blob: null, ext: "webp" };
  });
  rebuild();
}

function renderSlots() {
  const box = $("slots");
  box.replaceChildren(
    ...slots.map((slot, k) => {
      const item = document.createElement("div");
      item.className = "slot";
      item.dataset.level = LEVELS[k];
      // 누르면 그림을 넣는 곳. 버튼 요소는 끌리지 않는 브라우저가 있어 div 로 둔다.
      const pick = document.createElement("div");
      pick.className = "pick";
      pick.role = "button";
      pick.tabIndex = 0;
      const frame = document.createElement("span");
      frame.className = "thumb";
      if (slot) {
        const image = document.createElement("img");
        image.src = slot.thumb;
        image.alt = "";
        image.draggable = false;
        frame.append(image);
      } else {
        frame.textContent = t.choose;
      }
      const name = document.createElement("strong");
      name.textContent = t.levels[k];
      const numbers = document.createElement("small");
      numbers.textContent = RANGES[k];
      pick.append(frame, name, numbers);
      const choose = () => {
        target = k;
        $("pick-one").click();
      };
      pick.addEventListener("click", choose);
      pick.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        choose();
      });
      item.append(pick);
      if (slot && !example) {
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", t.remove(t.levels[k]));
        remove.addEventListener("click", () => removeOne(k));
        item.append(remove);
      }
      // 그림이 있는 칸은 끌어서 옮긴다. 파일을 끌어다 놓으면 그 칸에 넣는다.
      item.draggable = Boolean(slot);
      item.addEventListener("dragstart", (event) => {
        dragging = k;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", LEVELS[k]);
        item.classList.add("dragging");
      });
      item.addEventListener("dragend", () => {
        dragging = null;
        item.classList.remove("dragging");
      });
      item.addEventListener("dragover", (event) => {
        event.preventDefault();
        if (dragging !== k) item.classList.add("over");
      });
      item.addEventListener("dragleave", (event) => {
        if (!item.contains(event.relatedTarget)) item.classList.remove("over");
      });
      item.addEventListener("drop", (event) => {
        event.preventDefault();
        item.classList.remove("over");
        const from = dragging;
        dragging = null;
        const file = event.dataTransfer.files[0];
        if (from !== null) moveOne(from, k);
        else if (file) setOne(k, file);
      });
      return item;
    }),
  );
  shownLevel = "";
}

function rebuild() {
  renderSlots();
  const count = slots.filter(Boolean).length;
  const files = {};
  slots.forEach((slot, k) => {
    if (slot) files[fileName(k)] = slot.media;
  });
  stage = count ? createStage({ table: readScenes(tableJson("preview", "preview")).table, files, seed: "make" }) : null;
  if (!stage) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  note.textContent = example ? t.example : count ? t.own(count) : t.none;
  note.classList.remove("bad");
}

function fail(message) {
  note.textContent = message;
  note.classList.add("bad");
}

async function setOne(k, file) {
  try {
    const slot = await fromFile(file);
    if (example) clear();
    else if (slots[k]) URL.revokeObjectURL(slots[k].thumb);
    example = false;
    slots[k] = slot;
    rebuild();
  } catch {
    fail(t.cantRead);
  }
}

function removeOne(k) {
  URL.revokeObjectURL(slots[k].thumb);
  slots[k] = null;
  rebuild();
}

// 빈 칸에 놓으면 그 칸으로 옮기고, 그림이 있는 칸에 놓으면 그 자리에 끼워 넣고 사이의 칸을 한 칸씩 민다.
function moveOne(from, to) {
  if (from === to) return;
  const slot = slots[from];
  if (slots[to]) {
    slots.splice(from, 1);
    slots.splice(to, 0, slot);
  } else {
    slots[to] = slot;
    slots[from] = null;
  }
  rebuild();
}

// ---------- 미리 보기: 실행기가 하는 대로 값을 계산하고, 조건을 판정하고, 경우표의 장면을 그린다

function frame(stamp) {
  requestAnimationFrame(frame);
  if (stamp - frame.last < FRAME_MS - 1) return;
  frame.last = stamp;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!stage || !width || !height) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const { feed } = validateFeed({ spec: 1, values: [{ value: Number(range.value), to: 100 }] });
  const values = computeFeed(feed);
  const judged = judgeFeed(feed, values, { memory });
  memory = judged.memory;
  const conditions = sceneConditions(judged);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);
  stage.draw(ctx, { conditions, values, width, height, time: stamp / 1000 });
  // 지금 보이는 단계의 칸을 짚어 준다.
  if (conditions.level !== shownLevel) {
    shownLevel = conditions.level;
    for (const slot of $("slots").children) slot.classList.toggle("on", slot.dataset.level === shownLevel);
  }
}

// ---------- 묶음 내려받기

const CRC = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
function crc32(bytes) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// 압축하지 않고 묶기만 하는 zip. 그림은 이미 줄어 있다. entries: [{ name, data(Uint8Array) }]
function zip(entries) {
  const encoder = new TextEncoder();
  const now = new Date();
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const parts = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const path = encoder.encode(name);
    const crc = crc32(data);
    const head = new DataView(new ArrayBuffer(30));
    head.setUint32(0, 0x04034b50, true);
    head.setUint16(4, 20, true);
    head.setUint16(6, 0x0800, true); // 이름은 UTF-8
    head.setUint16(10, time, true);
    head.setUint16(12, date, true);
    head.setUint32(14, crc, true);
    head.setUint32(18, data.length, true);
    head.setUint32(22, data.length, true);
    head.setUint16(26, path.length, true);
    parts.push(head, path, data);
    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(12, time, true);
    entry.setUint16(14, date, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, path.length, true);
    entry.setUint32(42, offset, true);
    central.push(entry, path);
    offset += 30 + path.length + data.length;
  }
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, central.reduce((n, part) => n + part.byteLength, 0), true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: "application/zip" });
}

// 실행기의 파일들. index.js 에서 시작해 불러 쓰는 파일을 따라가며 모은다.
async function runtimeFiles() {
  const found = new Map();
  const queue = ["index.js"];
  while (queue.length) {
    const name = queue.pop();
    if (found.has(name)) continue;
    const response = await fetch(`runtime/src/${name}`);
    if (!response.ok) throw new Error(name);
    const source = await response.text();
    found.set(name, source);
    for (const match of source.matchAll(/from\s+"\.\/([\w-]+\.js)"/g)) queue.push(match[1]);
  }
  return found;
}

const escapeHtml = (text) =>
  text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const pageOf = (name) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="no-referrer" />
    <title>${escapeHtml(name)}</title>
    <style>
      html, body { margin: 0; height: 100%; overflow: hidden; background: #000; }
      canvas { display: block; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <canvas id="scene"></canvas>
    <script type="module">
      import { start } from "./runtime/src/index.js";
      start({ canvas: document.getElementById("scene") });
    </script>
  </body>
</html>
`;

const readmeOf = (name) => `${name}
A tidepic companion made at https://tidepic.com/make.html
tidepic 컴패니언. https://tidepic.com/make.ko.html 에서 만들었습니다.

How to use / 쓰는 법
  Put this folder on a web host and open index.html there.
  Opening the file by double-clicking does not work.
  이 폴더를 웹에 올리고 그 주소의 index.html 을 엽니다.
  파일을 두 번 눌러 여는 것으로는 동작하지 않습니다.

  index.html?v=30&to=100       a number in the address / 주소에 숫자 적기
  index.html?data=https://...  the address of a feed / 피드 주소

Rules / 규칙: https://tidepic.com
The runtime in runtime/ is under the MIT license (runtime/LICENSE-MIT).
runtime/ 의 실행기는 MIT 라이선스입니다 (runtime/LICENSE-MIT).
`;

async function download() {
  if (example || slots.filter(Boolean).length < 2) return fail(t.needOwn);
  const name = $("name").value.trim() || t.defaultName;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "my-scene";
  note.textContent = t.working;
  note.classList.remove("bad");
  try {
    const text = (value) => new TextEncoder().encode(value);
    const json = (value) => text(`${JSON.stringify(value, null, 2)}\n`);
    const entries = [
      { name: "index.html", data: text(pageOf(name)) },
      { name: "README.txt", data: text(readmeOf(name)) },
      {
        name: "companion.json",
        data: json({
          slug,
          name: { en: name, ko: name },
          spec: 1,
          made: "table",
          grade: "basic",
          still: true,
          reads: { values: 1, needs: ["fill"], step: false, events: [], extra: [] },
          skins: [slug],
        }),
      },
      { name: "tidepic.config.json", data: json({ data: "random", every: 60, skin: slug }) },
      { name: `skins/${slug}/scenes.json`, data: json(tableJson(slug, name)) },
    ];
    for (const [k, slot] of slots.entries()) {
      if (slot) entries.push({ name: `skins/${slug}/${fileName(k)}`, data: new Uint8Array(await slot.blob.arrayBuffer()) });
    }
    for (const [file, source] of await runtimeFiles()) {
      entries.push({ name: `runtime/src/${file}`, data: text(source) });
    }
    const license = await fetch("LICENSE-MIT");
    if (!license.ok) throw new Error("LICENSE-MIT");
    entries.push({ name: "runtime/LICENSE-MIT", data: new Uint8Array(await license.arrayBuffer()) });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(zip(entries.map((e) => ({ ...e, name: `${slug}/${e.name}` }))));
    link.download = `${slug}.zip`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10000);
    note.textContent = t.done(link.download);
  } catch {
    fail(t.failed);
  }
}

// ---------- 누르는 것들

$("pick-one").addEventListener("change", (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (file) setOne(target, file);
});

$("many").addEventListener("click", () => $("pick-many").click());
$("pick-many").addEventListener("change", async (event) => {
  // 이름 순서로 놓는다. 1, 2, 10 처럼 숫자는 숫자로 견준다.
  const files = [...event.target.files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  event.target.value = "";
  if (!files.length) return;
  try {
    fill(await Promise.all(files.map(fromFile)));
  } catch {
    fail(t.cantRead);
  }
});

$("gif").addEventListener("click", () => {
  if ("ImageDecoder" in window) $("pick-gif").click();
  else fail(t.noDecoder);
});
$("pick-gif").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  try {
    fill(await fromAnimation(file));
  } catch {
    fail(t.cantRead);
  }
});

$("flip").addEventListener("click", () => {
  slots.reverse();
  rebuild();
});
$("example").addEventListener("click", showExample);
$("download").addEventListener("click", download);
range.addEventListener("input", () => ($("shown").textContent = range.value));

$("name").placeholder = t.defaultName;
showExample();
requestAnimationFrame(frame);
