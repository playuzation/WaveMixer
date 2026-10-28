// 걸러진 잡음(filtered noise)을 만든다. 마찰·터짐·숨소리처럼 주기가 없는 소리에 쓴다.
// resonators: [{ center: 중심 Hz, bandwidth: 대역폭 Hz, gain: 상대 세기 }]
// 백색 잡음을 대역통과 필터(2차 필터 2단, 약 −24 dB/oct 경사)에 통과시키고 세기를 곱해 더한다.
// 시드가 같으면 같은 잡음이 나온다. 결과의 실효값(RMS)은 1로 맞춘다.

// mulberry32: 작고 빠른 의사 난수 생성기(0 이상 1 미만)
function random(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// RBJ 대역통과 필터 계수(중심에서 이득 1)
function bandpass(center, bandwidth, sampleRate) {
  const w = (2 * Math.PI * center) / sampleRate;
  const alpha = Math.sin(w) / (2 * (center / bandwidth));
  const a0 = 1 + alpha;
  return { b0: alpha / a0, b2: -alpha / a0, a1: (-2 * Math.cos(w)) / a0, a2: (1 - alpha) / a0 };
}

function filter(input, { b0, b2, a1, a2 }) {
  const output = new Float64Array(input.length);
  let [x1, x2, y1, y2] = [0, 0, 0, 0];
  for (let i = 0; i < input.length; i++) {
    const y = b0 * input[i] + b2 * x2 - a1 * y1 - a2 * y2;
    [x2, x1, y2, y1] = [x1, input[i], y1, y];
    output[i] = y;
  }
  return output;
}

// 필터가 자리 잡는 동안 생기는 앞부분 흔들림을 버리기 위해 그만큼 더 만든다.
const WARMUP_SECONDS = 0.02;

// −1 이상 1 미만의 백색 잡음(분산 1/3)
export function whiteNoise(length, seed) {
  const next = random(seed);
  return Float64Array.from({ length }, () => next() * 2 - 1);
}

export function filteredNoise(resonators, length, sampleRate, seed) {
  const warmup = Math.round(WARMUP_SECONDS * sampleRate);
  const white = whiteNoise(warmup + length, seed);

  const sum = new Float64Array(length);
  for (const { center, bandwidth, gain } of resonators) {
    const coefficients = bandpass(center, bandwidth, sampleRate);
    const band = filter(filter(white, coefficients), coefficients);
    for (let i = 0; i < length; i++) sum[i] += gain * band[warmup + i];
  }
  const rms = Math.sqrt(sum.reduce((total, value) => total + value * value, 0) / length);
  return rms ? sum.map((value) => value / rms) : sum;
}
