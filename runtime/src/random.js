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

// 지난 값은 10초 간격으로 24개, 곧 지난 4분이다. 같은 물결을 지난 시각에 다시 계산한다.
const HISTORY = 24;
const EVERY = 10;

export function randomFeed({ seed, count = 1, time = 0 }) {
  const rand = mulberry32(hashSeed(seed));
  const values = [];
  for (let i = 0; i < count; i++) {
    const waves = WAVES.map((wave) => {
      const period = wave.min + rand() * (wave.max - wave.min);
      const phase = rand() * Math.PI * 2;
      return { amp: wave.amp, w: (Math.PI * 2) / period, phase };
    });
    const at = (t) =>
      waves.reduce((x, o) => x + o.amp * Math.sin(o.w * t + o.phase), 0);
    const dx = waves.reduce(
      (d, o) => d + o.amp * o.w * Math.cos(o.w * time + o.phase),
      0,
    );
    const number = (t) => Math.round((50 + 45 * at(t)) * 10) / 10;
    // 값은 50 + 45x 이므로 변화율은 45dx 다. 전과 같은 기울기가 나오게 폭을 잡았다.
    values.push({
      value: number(time),
      from: 0,
      to: 100,
      base: 50,
      rate: Math.round(45 * dx * 100) / 100,
      rateScale: 5.6,
      history: Array.from({ length: HISTORY }, (_, k) =>
        number(time - (HISTORY - k) * EVERY),
      ),
      every: EVERY,
    });
  }
  return { spec: 1, values, state: "live" };
}
