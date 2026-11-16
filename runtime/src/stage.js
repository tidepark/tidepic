// 경우표로 만든 컴패니언의 장면을 그린다 (규칙 7.1절). 그리기 코드가 없는 컴패니언에서 런타임이 쓴다.

import { hashSeed, mulberry32 } from "./random.js";
import { isLottie, isVideo, pickScene } from "./scenes.js";

const MAX_PIECES = 24; // 떠다니는 조각의 최대 개수 (잠정)
const EVENT_IMAGE_SECONDS = 2; // 사건에 그림을 틀 때 보여 주는 시간 (잠정)

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const wrap = (x) => ((x % 1) + 1) % 1;

// 어떤 화면 비율에서도 빈 띠 없이 채운다 (규칙 10절).
function drawCover(ctx, media, width, height) {
  const mw = media.videoWidth || media.naturalWidth || media.width;
  const mh = media.videoHeight || media.naturalHeight || media.height;
  if (!mw || !mh) return false;
  const scale = Math.max(width / mw, height / mh);
  const w = mw * scale;
  const h = mh * scale;
  ctx.drawImage(media, (width - w) / 2, (height - h) / 2, w, h);
  return true;
}

const videoReady = (video) => video && video.readyState >= 2;

// Lottie 의 몇 번째 그림을 보여 줄지. follow 가 없으면 시각을 따라 되풀이하고,
// 있으면 그 값의 자리다 (0~1 은 처음~끝, -1~1 은 0 이 가운데).
const SIGNED = ["rise", "momentum"];
function lottieFrame(scene, lottie, { values, time }) {
  if (!scene.follow) return ((time / lottie.seconds) % 1) * lottie.frames;
  const value = values[0]?.[scene.follow] ?? 0;
  const at = SIGNED.includes(scene.follow) ? (value + 1) / 2 : value;
  return clamp01(at) * (lottie.frames - 1);
}

// files: { 파일 이름: 그림 또는 영상 요소 }
export function createStage({ table, files, seed }) {
  let current = -1;
  let previous = -1;
  let changedAt = 0;
  let playing = true;
  let eventAt = null;

  // 조각마다 씨앗에서 자리와 빠르기를 정한다. 시각이 같으면 같은 자리에 있다.
  const pieceCache = new Map();
  function pieces(key) {
    if (!pieceCache.has(key)) {
      const rand = mulberry32(hashSeed(`${seed}:${key}`));
      pieceCache.set(
        key,
        Array.from({ length: MAX_PIECES }, () => ({
          x: rand(),
          y: rand(),
          speed: 0.04 + rand() * 0.06,
          sway: 0.01 + rand() * 0.03,
          phase: rand() * Math.PI * 2,
          size: 0.7 + rand() * 0.6,
        })),
      );
    }
    return pieceCache.get(key);
  }

  function amountOf(effect, value) {
    if (typeof effect.amount === "number") return effect.amount;
    return clamp01(Math.abs(value?.[effect.amount] ?? 0));
  }

  function drawEffect(ctx, effect, key, { values, width, height, time }) {
    const image = files[effect.image];
    if (!image?.naturalWidth) return;
    const unit = Math.min(width, height);
    const base = (effect.size ?? 0.06) * unit;
    const amount = amountOf(effect, values[0]);
    const put = (x, y, size) => {
      const h = (size * image.naturalHeight) / image.naturalWidth;
      ctx.drawImage(image, x * width - size / 2, y * height - h / 2, size, h);
    };

    if (effect.type === "count") {
      // 정해진 자리에 놓는다. 자리가 없으면 아래쪽에 한 줄로 놓는다.
      const spots =
        effect.spots ?? Array.from({ length: 10 }, (_, i) => [(i + 0.5) / 10, 0.82]);
      const n = Math.round(amount * spots.length);
      for (let i = 0; i < n; i++) put(spots[i][0], spots[i][1], base);
      return;
    }
    const n = Math.round(amount * MAX_PIECES);
    const list = pieces(key);
    for (let i = 0; i < n; i++) {
      const p = list[i];
      const wobble = p.sway * Math.sin(time * 0.8 + p.phase);
      const along = wrap(p.y + p.speed * time) * 1.2 - 0.1; // 화면 밖에서 들어와 밖으로 나간다
      if (effect.type === "fall") put(wrap(p.x + wobble), along, base * p.size);
      else if (effect.type === "float") put(wrap(p.x + wobble), 1 - along, base * p.size);
      else put(wrap(p.x + p.speed * time) * 1.2 - 0.1, p.y + wobble, base * p.size);
    }
  }

  function drawScene(ctx, index, alpha, frame) {
    const scene = table.scenes[index];
    if (!scene) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    const video = isVideo(scene.show) ? files[scene.show] : null;
    const lottie = isLottie(scene.show) ? files[scene.show] : null;
    if (lottie) lottie.show(lottieFrame(scene, lottie, frame));
    // 영상이나 Lottie 가 아직 준비되지 않았으면 정지 화면용 그림을 보여 준다.
    const media = lottie
      ? lottie.canvas
      : videoReady(video)
        ? video
        : files[scene.poster ?? scene.show];
    if (media) drawCover(ctx, media, frame.width, frame.height);
    scene.effects.forEach((effect, k) => drawEffect(ctx, effect, `${index}:${k}`, frame));
    ctx.restore();
  }

  function setVideo(index, on) {
    const scene = table.scenes[index];
    const video = scene && isVideo(scene.show) ? files[scene.show] : null;
    if (!video) return;
    if (on && playing) video.play().catch(() => {});
    else video.pause();
  }

  function drawEvent(ctx, event, { width, height }) {
    if (!event) return;
    const entry = table.events.find((e) => e.on === event.type);
    const media = entry && files[entry.play];
    if (!media) return;
    if (isVideo(entry.play)) {
      if (eventAt !== event.at) {
        eventAt = event.at;
        media.currentTime = 0;
        if (playing) media.play().catch(() => {});
      }
      if (!media.ended && videoReady(media)) drawCover(ctx, media, width, height);
    } else if (event.age < EVENT_IMAGE_SECONDS) {
      ctx.save();
      ctx.globalAlpha = clamp01((EVENT_IMAGE_SECONDS - event.age) * 2);
      drawCover(ctx, media, width, height);
      ctx.restore();
    }
  }

  return {
    // frame: { conditions, values, event, width, height, time }
    draw(ctx, frame) {
      const index = pickScene(table, frame.conditions);
      if (index !== current) {
        setVideo(previous, false);
        previous = current;
        current = index;
        changedAt = frame.time;
        setVideo(current, true);
      }
      // 장면이 바뀌면 겹쳐 넘어간다.
      const t = table.fade > 0 ? (frame.time - changedAt) / table.fade : 1;
      if (previous >= 0 && t < 1) {
        drawScene(ctx, previous, 1, frame);
        drawScene(ctx, current, clamp01(t), frame);
      } else {
        if (previous >= 0) {
          setVideo(previous, false);
          previous = -1;
        }
        drawScene(ctx, current, 1, frame);
      }
      drawEvent(ctx, frame.event, frame);
    },
    // 탭이 숨겨지면 영상도 멈춘다.
    setPlaying(on) {
      playing = on;
      setVideo(current, on);
      if (!on) {
        for (const media of Object.values(files)) media.pause?.();
      }
    },
  };
}
