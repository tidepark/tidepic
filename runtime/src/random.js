// 난수 (규칙 4절). 받는 곳 가운데 하나다. 씨앗과 시각이 같으면 같은 피드가 나온다.

export function hashSeed(seed) {
  const text = String(seed);
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// 느린 물결 세 개를 더해 0~100 사이를 부드럽게 오르내리게 한다.
const WAVES = [
  { amp: 0.6, min: 90, max: 180 },
  { amp: 0.3, min: 40, max: 70 },
  { amp: 0.1, min: 15, max: 25 },
];

export function randomFeed({ seed, count = 1, time = 0 }) {
  const rand = mulberry32(hashSeed(seed));
  const values = [];
  for (let i = 0; i < count; i++) {
    let x = 0;
    let dx = 0;
    for (const wave of WAVES) {
      const period = wave.min + rand() * (wave.max - wave.min);
      const phase = rand() * Math.PI * 2;
      const w = (Math.PI * 2) / period;
      x += wave.amp * Math.sin(w * time + phase);
      dx += wave.amp * w * Math.cos(w * time + phase);
    }
    // 값은 50 + 45x 이므로 변화율은 45dx 다. 전과 같은 기울기가 나오게 폭을 잡았다.
    values.push({
      value: Math.round((50 + 45 * x) * 10) / 10,
      from: 0,
      to: 100,
      base: 50,
      rate: Math.round(45 * dx * 100) / 100,
      rateScale: 5.6,
    });
  }
  return { spec: 1, values, state: "live" };
}
