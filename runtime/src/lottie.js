// 경우표의 show 에 적은 Lottie 파일을 캔버스에 그린다 (규칙 7.1절).
// 식을 실행하지 않는 가벼운 재생기를 쓰고, 필요할 때만 불러온다.

const LONG_SIDE = 1600; // 그려 둘 캔버스의 긴 변 (잠정)

const isObject = (x) =>
  x !== null && typeof x === "object" && !Array.isArray(x);
const isNum = (x) => typeof x === "number" && Number.isFinite(x);

// 스킨에는 코드, 주소, 글꼴을 넣지 않는다 (규칙 7절). 쓸 수 없으면 이유를, 쓸 수 있으면 null 을 돌려준다.
export function checkLottie(data) {
  if (!isObject(data) || !Array.isArray(data.layers)) return "Lottie 파일이 아니다";
  const sized = [data.w, data.h, data.fr].every((n) => isNum(n) && n > 0);
  if (!sized || !isNum(data.ip) || !isNum(data.op) || data.op <= data.ip) {
    return "크기나 길이가 없다";
  }
  for (const asset of Array.isArray(data.assets) ? data.assets : []) {
    if (Array.isArray(asset?.layers)) continue; // 파일 안에서 다시 쓰는 묶음
    const embedded = typeof asset?.p === "string" && asset.p.startsWith("data:image/");
    if (!embedded) return "그림을 파일 밖에서 가져온다";
  }
  if (data.fonts?.list?.length) return "글꼴을 쓴다";
  return null;
}

// 돌려주는 것: { canvas, frames, seconds, show(frame) }
export async function loadLottie(data) {
  const mod = await import("lottie-web/build/player/lottie_light_canvas.js");
  const lottie = mod.default ?? mod;
  const canvas = document.createElement("canvas");
  const k = LONG_SIDE / Math.max(data.w, data.h);
  canvas.width = Math.round(data.w * k);
  canvas.height = Math.round(data.h * k);
  const anim = lottie.loadAnimation({
    renderer: "canvas",
    loop: false,
    autoplay: false,
    animationData: data,
    rendererSettings: { context: canvas.getContext("2d"), clearCanvas: true },
  });
  if (!anim.isLoaded) {
    await new Promise((done) => anim.addEventListener("DOMLoaded", done));
  }
  const frames = anim.totalFrames;
  let shown = null;
  return {
    canvas,
    frames,
    seconds: frames / anim.frameRate,
    // 재생은 런타임의 시각을 따른다. 같은 시각이면 같은 그림이다.
    show(frame) {
      const at = Math.min(Math.max(frame, 0), frames - 0.01);
      if (at === shown) return;
      shown = at;
      anim.goToAndStop(at, true);
    },
  };
}
