// 그리기 코드 (기본 등급). 받은 것만으로 그리고, 같은 입력이면 같은 그림을 낸다.
// 틀의 본보기 장면이다. 물의 높이가 채움(fill), 해의 높이가 오르내림(rise),
// 물결의 세기가 모멘텀이다. 새 컴패니언은 이 파일을 바꿔 쓴다.

const SKY = "#f6f0e2";
const SUN = "#f2994a";
const WATER = "#4fa9c9";
const DEEP = "#256f90";

function wave(ctx, { width, height, level, amp, length, shift, color }) {
  ctx.beginPath();
  ctx.moveTo(0, height);
  for (let x = 0; x <= width + 8; x += 8) {
    const y = level + amp * Math.sin(((x + shift) / length) * Math.PI * 2);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function draw(ctx, { values, state, skin, width, height, time }) {
  const value = values[0] ?? {};
  const fill = value.fill ?? 0.5;
  const rise = value.rise ?? 0;
  const momentum = value.momentum ?? 0;
  const unit = Math.min(width, height);
  const waveSize = (skin.layout.wave ?? 0.03) * unit;
  const sunSize = (skin.layout.sun ?? 0.09) * unit;

  ctx.fillStyle = SKY;
  ctx.fillRect(0, 0, width, height);

  // 해는 기준보다 오르면 높이, 내리면 낮게 뜬다.
  ctx.beginPath();
  ctx.arc(width * 0.72, height * (0.36 - 0.24 * rise), sunSize, 0, Math.PI * 2);
  ctx.fillStyle = SUN;
  ctx.fill();

  // 물은 가득 차도 하늘을 조금 남기고, 비어도 바닥에 조금 남는다.
  const level = height * (0.9 - 0.75 * fill);
  const amp = waveSize * (0.5 + Math.abs(momentum));
  // 흐르는 빠르기와 방향은 정해 둔다. 모멘텀은 물결의 높이만 바꾼다(빠르기에 값을 곱하지 않는다).
  const drift = time * unit * 0.06;
  wave(ctx, { width, height, level, amp, length: unit * 0.9, shift: -drift * 0.6, color: WATER });
  wave(ctx, {
    width,
    height,
    level: level + waveSize * 1.6,
    amp: amp * 0.8,
    length: unit * 0.7,
    shift: drift + unit * 0.3,
    color: DEEP,
  });

  // 쉬는 중이거나 끝났거나 끊겼으면 색을 가라앉힌다.
  if (state !== "live") {
    ctx.fillStyle = state === "stale" ? "rgba(90, 90, 90, 0.45)" : "rgba(30, 77, 59, 0.28)";
    ctx.fillRect(0, 0, width, height);
  }
}
