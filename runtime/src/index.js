// tidepic 런타임. 컴패니언 안에서 설정을 읽고, 피드를 받아 검사하고, 그릴 값을 준비해 장면을 그린다.
// 코드로 만든 컴패니언은 draw 를 넘기고, 경우표로 만든 컴패니언은 런타임이 장면을 보여 준다.

import { readConfig } from "./config.js";
import { createSource } from "./source.js";
import { computeFeed } from "./compute.js";
import { judgeFeed, sceneConditions } from "./conditions.js";
import { checkLottie, loadLottie } from "./lottie.js";
import { isLottie, isVideo, readScenes, tableFiles, unjudged } from "./scenes.js";
import { createStage } from "./stage.js";
import { checkFeed, checkReads } from "./check.js";
import { drawOverlay, numberText } from "./overlay.js";

export { validateFeed, parseFeed, LIMITS } from "./validate.js";
export { computeValue, computeFeed } from "./compute.js";
export { judgeFeed, sceneConditions, CONDITION_NAMES } from "./conditions.js";
export { readScenes, pickScene } from "./scenes.js";
export { randomFeed } from "./random.js";
export { dateFeed, parseDay } from "./dates.js";
export { readConfig, POSITIONS } from "./config.js";
export { checkFeed, checkReads } from "./check.js";
export { drawOverlay, numberText, formatNumber, formatValue } from "./overlay.js";

const FRAME_MS = 1000 / 30; // 초당 30장을 넘지 않는다 (규칙 10절)
const EASE_SECONDS = 0.6; // 새 값의 장면으로 옮겨 가는 시간. 도착하는 값은 바꾸지 않는다
const STALE_AFTER = 3; // 이만큼 잇달아 받지 못하면 끊김(stale)으로 알린다 (잠정)
const SLUG = /^[a-z0-9-]{1,64}$/;
const IMAGE_FILE = /^[a-z0-9][a-z0-9._-]*\.(webp|png|jpe?g)$/;

const isObject = (x) =>
  x !== null && typeof x === "object" && !Array.isArray(x);

async function loadJson(url) {
  const response = await fetch(url, { credentials: "omit" });
  if (!response.ok) throw new Error(`${url} 응답이 ${response.status} 이다`);
  return response.json();
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`그림을 받지 못했다: ${url}`));
    image.src = url;
  });
}

// 영상은 다 받을 때까지 기다리지 않는다. 그동안은 정지 화면용 그림을 보여 준다.
function loadVideo(url, loop) {
  const video = document.createElement("video");
  video.muted = true;
  video.loop = loop;
  video.playsInline = true;
  video.preload = "auto";
  video.src = url;
  return video;
}

// 스킨을 고르고, 그 파일을 받아 올 곳을 정한다. 파일은 설정 파일에 적힌 곳(assets)에서만 받는다.
function pickSkin(companion, config, base) {
  const slugs = Array.isArray(companion.skins)
    ? companion.skins.filter((s) => typeof s === "string" && SLUG.test(s))
    : [];
  if (!slugs.length) return null;
  const slug = slugs.includes(config.skin) ? config.skin : slugs[0];
  const folder = new URL(`skins/${slug}/`, base);
  const root = config.assets ? new URL(`${slug}/`, config.assets) : folder;
  return { slug, folder, root };
}

// 코드로 그리는 컴패니언의 스킨 (skin.json): 그림과 배치 숫자
async function loadSkin(companion, config, base, notify) {
  const empty = { slug: "", images: {}, layout: {}, overlay: {} };
  const picked = pickSkin(companion, config, base);
  if (!picked) return empty;
  let json;
  try {
    json = await loadJson(new URL("skin.json", picked.folder));
  } catch (error) {
    notify("warn", "skin", error.message);
    return { ...empty, slug: picked.slug };
  }
  const images = {};
  const entries = isObject(json.images) ? Object.entries(json.images) : [];
  await Promise.all(
    entries.map(async ([name, file]) => {
      if (typeof file !== "string" || !IMAGE_FILE.test(file)) {
        notify("warn", `image-${name}`, `스킨 그림 이름이 맞지 않다: ${name}`);
        return;
      }
      try {
        images[name] = await loadImage(new URL(file, picked.root).href);
      } catch (error) {
        notify("warn", `image-${name}`, error.message);
      }
    }),
  );
  return {
    slug: picked.slug,
    images,
    layout: isObject(json.layout) ? json.layout : {},
    overlay: isObject(json.overlay) ? json.overlay : {},
  };
}

// 경우표로 만든 컴패니언의 스킨 (scenes.json): 경우표와 그 파일들
async function loadTable(companion, config, base, notify) {
  const picked = pickSkin(companion, config, base);
  if (!picked) throw new Error("경우표 컴패니언에 스킨이 없다");
  const json = await loadJson(new URL("scenes.json", picked.folder));
  const result = readScenes(json);
  if (!result.ok) throw new Error(`경우표를 읽지 못했다: ${result.error}`);
  for (const name of result.problems) {
    notify("warn", `table-${name}`, `경우표에서 틀린 곳을 버렸다: ${name}`);
  }
  const { table } = result;
  const once = new Set(table.events.map((e) => e.play)); // 사건 영상은 한 번만 튼다
  const files = {};
  await Promise.all(
    tableFiles(table).map(async (name) => {
      const url = new URL(name, picked.root).href;
      if (isVideo(name)) {
        files[name] = loadVideo(url, !once.has(name));
        return;
      }
      try {
        if (isLottie(name)) {
          const data = await loadJson(url);
          const problem = checkLottie(data);
          if (problem) throw new Error(`Lottie 파일을 쓸 수 없다 (${name}): ${problem}`);
          files[name] = await loadLottie(data);
          return;
        }
        files[name] = await loadImage(url);
      } catch (error) {
        notify("warn", `file-${name}`, error.message);
      }
    }),
  );
  return {
    slug: picked.slug,
    table,
    files,
    overlay: isObject(json.overlay) ? json.overlay : {},
  };
}

export async function start({
  canvas,
  draw,
  base = document.baseURI,
  search = location.search,
  onNotice,
}) {
  // 같은 알림은 한 번만 낸다.
  const told = new Set();
  const notify = (level, code, message) => {
    if (told.has(code + message)) return;
    told.add(code + message);
    (level === "warn" ? console.warn : console.info)(`[tidepic] ${message}`);
    onNotice?.({ level, code, message });
  };

  const companion = await loadJson(new URL("companion.json", base));
  const file = await loadJson(new URL("tidepic.config.json", base)).catch(
    () => ({}),
  );
  const config = readConfig(file, search, base);
  const seed = config.seed ?? String(Math.floor(Math.random() * 1e9));

  const byTable = companion.made === "table";
  if (!byTable && typeof draw !== "function") {
    throw new Error("코드로 만든 컴패니언에는 draw 가 있어야 한다");
  }
  const skin = byTable
    ? await loadTable(companion, config, base, notify)
    : await loadSkin(companion, config, base, notify);
  const stage = byTable
    ? createStage({ table: skin.table, files: skin.files, seed })
    : null;
  const titleAt = config.titleAt ?? skin.overlay?.titleAt ?? "tl";
  const numAt = config.numAt ?? skin.overlay?.numAt ?? "br";

  const reads = isObject(companion.reads) ? companion.reads : {};
  const count = reads.values === 2 ? 2 : reads.values === "many" ? 5 : 1;
  const source = createSource(config.source, { seed, count });
  const ctx = canvas.getContext("2d");
  const startedAt = performance.now();
  const now = () => (performance.now() - startedAt) / 1000;

  let feed = null; // 마지막으로 받은, 검사를 통과한 피드
  let target = []; // 계산한 값
  let shown = []; // 화면에 보이는 값. target 을 부드럽게 따라간다
  let judged = null; // 조건. 받은 값(target)으로 판정한다
  let failures = 0;
  let event = null; // { at, since }
  let firstFeed = true;
  let timer = 0;
  let round = 0; // 숨었다 돌아오면 올린다. 앞서 떠난 요청이 뒤늦게 이어 가지 못하게 한다
  let raf = 0;
  let lastFrame = 0;

  async function poll() {
    const mine = round;
    let seconds = config.every;
    try {
      const result = await source.next(now());
      if (mine !== round) return;
      if (!result.ok) throw new Error(result.error);
      feed = result.feed;
      for (const name of result.dropped) {
        notify("warn", `dropped-${name}`, `형식이 맞지 않아 버렸다: ${name}`);
      }
      target = computeFeed(feed);
      judged = judgeFeed(feed, target, { memory: judged?.memory });
      for (const n of [...checkFeed(feed), ...checkReads(reads, feed, target)]) {
        notify(n.level, n.code, n.message);
      }
      if (byTable) {
        for (const key of unjudged(skin.table, sceneConditions(judged))) {
          notify(
            "warn",
            `unjudged-${key}`,
            `경우표가 판정할 수 없는 조건을 쓴다: ${key}`,
          );
        }
      }
      // 처음 받은 피드에 들어 있던 사건은 지난 일로 보고 반응하지 않는다.
      if (feed.event && feed.event.at !== event?.at) {
        event = { at: feed.event.at, since: firstFeed ? -Infinity : now() };
      }
      firstFeed = false;
      failures = 0;
      // 난수는 네트워크를 쓰지 않으므로 1초마다 새로 만든다 (잠정).
      seconds =
        source.kind === "random" ? 1 : Math.max(config.every, feed.meta?.ttl ?? 0);
    } catch (error) {
      if (mine !== round) return;
      failures += 1;
      notify("warn", "feed", `피드를 받지 못했다: ${error.message}`);
    }
    if (!document.hidden) timer = setTimeout(poll, seconds * 1000);
  }

  function ease(dt) {
    const k = 1 - Math.exp(-dt / EASE_SECONDS);
    if (shown.length !== target.length) {
      shown = target.map((t) => ({ ...t }));
      return;
    }
    shown = target.map((t, i) => {
      const out = { raw: t.raw, rank: t.rank };
      for (const name of ["fill", "over", "under", "rise", "momentum", "share"]) {
        const from = shown[i][name];
        out[name] =
          t[name] === null || from === null || from === undefined
            ? t[name]
            : from + (t[name] - from) * k;
      }
      return out;
    });
  }

  function frame(stamp) {
    raf = requestAnimationFrame(frame);
    if (stamp - lastFrame < FRAME_MS - 1) return;
    const dt = lastFrame ? (stamp - lastFrame) / 1000 : 0;
    lastFrame = stamp;
    if (!feed) return;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (
      canvas.width !== Math.round(width * ratio) ||
      canvas.height !== Math.round(height * ratio)
    ) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    ease(dt);

    const time = now();
    const age = event ? time - event.since : Infinity;
    const state = failures >= STALE_AFTER ? "stale" : feed.state;
    const happened =
      feed.event && Number.isFinite(age) ? { ...feed.event, age } : undefined;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.save();
    if (stage) {
      stage.draw(ctx, {
        conditions: { ...sceneConditions(judged), state },
        values: shown,
        event: happened,
        width,
        height,
        time,
      });
    } else {
      draw(ctx, {
        values: shown,
        focus: feed.focus ?? 0,
        step: feed.step,
        state,
        event: happened,
        extra: feed.extra ?? {},
        skin,
        width,
        height,
        time,
        seed,
      });
    }
    ctx.restore();
    drawOverlay(ctx, {
      width,
      height,
      title: config.title,
      titleAt,
      number: config.num ? numberText(feed.values, feed.focus) : "",
      numAt,
    });
  }

  // 탭이 숨겨지면 멈춘다 (규칙 10절).
  function onVisibility() {
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    round += 1;
    stage?.setPlaying(!document.hidden);
    if (document.hidden) return;
    lastFrame = 0;
    poll();
    raf = requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", onVisibility);
  onVisibility();

  return {
    config,
    stop() {
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      stage?.setPlaying(false);
    },
  };
}
