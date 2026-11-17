// 제목과 숫자 (규칙 5절). 장면 위에 런타임이 그린다. 페이지 요소가 아니라 캔버스에 그린다.

// 천 단위 쉼표를 넣고, 100 미만은 소수 둘째 자리까지 보여 준다. 기기의 언어 설정을 타지 않는다.
export function formatNumber(n) {
  const rounded = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 100) / 100;
  const [int, frac] = Math.abs(rounded).toString().split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (rounded < 0 ? "-" : "") + grouped + (frac ? "." + frac : "");
}

// 초를 9:00, 4:20:00 처럼 보여 준다.
export function formatDuration(seconds) {
  const s = Math.round(Math.abs(seconds));
  const pad = (n) => String(n).padStart(2, "0");
  const [h, m] = [Math.floor(s / 3600), Math.floor((s % 3600) / 60)];
  const text = h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
  return (seconds < 0 && s > 0 ? "-" : "") + text;
}

// 값 하나를 보내는 쪽이 적은 형식과 단위로 보여 준다. 단위는 숫자 바로 뒤에 붙인다.
export function formatValue(v) {
  const text = v.format === "duration" ? formatDuration(v.value) : formatNumber(v.value);
  return text + (v.unit ?? "");
}

// 값이 1개면 그 값, 2개면 "92 : 102", 그보다 많으면 focus 가 가리키는 값을 보여 준다.
export function numberText(values, focus = 0) {
  if (values.length === 2) return `${formatValue(values[0])} : ${formatValue(values[1])}`;
  return formatValue(values[values.length === 1 ? 0 : focus]);
}

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

export function drawOverlay(ctx, { width, height, title, titleAt, number, numAt }) {
  const unit = Math.min(width, height);
  const margin = unit * 0.05;
  const lines = [];
  if (title) {
    lines.push({ text: title, at: titleAt, size: clamp(unit * 0.05, 11, 28), weight: 600 });
  }
  if (number) {
    lines.push({ text: number, at: numAt, size: clamp(unit * 0.1, 14, 64), weight: 700 });
  }
  if (!lines.length) return;

  // 같은 칸에 놓이면 제목이 숫자 위에 온다 (제목을 먼저 넣었다).
  const cells = new Map();
  for (const line of lines) {
    if (!cells.has(line.at)) cells.set(line.at, []);
    cells.get(line.at).push(line);
  }

  ctx.save();
  ctx.textBaseline = "top";
  // 밝은 장면에서도 읽히도록 어두운 테두리를 먼저 긋고 흰 글자를 올린다.
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
  ctx.lineJoin = "round";
  for (const [at, cell] of cells) {
    const row = at[0];
    const col = at[1];
    const gap = unit * 0.012;
    const total =
      cell.reduce((sum, line) => sum + line.size * 1.15, 0) +
      gap * (cell.length - 1);
    let y =
      row === "t" ? margin : row === "b" ? height - margin - total : (height - total) / 2;
    ctx.textAlign = col === "l" ? "left" : col === "r" ? "right" : "center";
    const x = col === "l" ? margin : col === "r" ? width - margin : width / 2;
    for (const line of cell) {
      ctx.font = `${line.weight} ${line.size}px system-ui, -apple-system, "Apple SD Gothic Neo", sans-serif`;
      ctx.lineWidth = line.size * 0.16;
      ctx.strokeText(line.text, x, y, width - margin * 2);
      ctx.fillText(line.text, x, y, width - margin * 2);
      y += line.size * 1.15 + gap;
    }
  }
  ctx.restore();
}
