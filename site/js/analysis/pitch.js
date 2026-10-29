// 기본 주파수(f0)와 주기성 찾기: YIN(de Cheveigné & Kawahara 2002)의 차이 함수를 FFT 자기상관으로 계산한다.
// d(τ) = Σ(x_j − x_{j+τ})², 누적 평균으로 나눈 d′(τ)가 THRESHOLD 아래인 첫 골을 주기로 본다.
// 결과 { f0, aperiodicity }: aperiodicity = 그 골의 d′(0에 가까울수록 주기적). 골이 없으면 f0 = 0.
import { fft, nextPowerOfTwo } from './fft.js';

const THRESHOLD = 0.15;

export function detectPitch(frame, sampleRate, { minFrequency, maxFrequency }) {
  const length = frame.length;
  const maxLag = Math.min(Math.floor(length / 2), Math.ceil(sampleRate / minFrequency));
  const minLag = Math.max(2, Math.floor(sampleRate / maxFrequency));

  // 선형 자기상관 r(τ) = Σ x_j·x_{j+τ}
  const size = nextPowerOfTwo(2 * length);
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  re.set(frame);
  fft(re, im);
  for (let k = 0; k < size; k++) {
    re[k] = re[k] ** 2 + im[k] ** 2;
    im[k] = 0;
  }
  fft(re, im);
  const r = (lag) => re[lag] / size;

  // 에너지 앞부분 합으로 d(τ) = Σ_{j<L−τ} x_j² + Σ_{j≥τ} x_j² − 2r(τ)
  const prefix = new Float64Array(length + 1);
  for (let i = 0; i < length; i++) prefix[i + 1] = prefix[i] + frame[i] ** 2;
  const difference = (lag) => prefix[length - lag] + (prefix[length] - prefix[lag]) - 2 * r(lag);

  const normalized = new Float64Array(maxLag + 1).fill(1);
  let running = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    const d = difference(lag);
    running += d;
    normalized[lag] = running > 0 ? (d * lag) / running : 1;
  }

  let best = -1;
  for (let lag = minLag; lag < maxLag; lag++) {
    if (normalized[lag] < THRESHOLD) {
      while (lag + 1 < maxLag && normalized[lag + 1] < normalized[lag]) lag++;
      best = lag;
      break;
    }
  }
  if (best < 0) {
    best = minLag;
    for (let lag = minLag; lag < maxLag; lag++) if (normalized[lag] < normalized[best]) best = lag;
  }
  // 골 근처를 포물선으로 다듬는다.
  const [a, b, c] = [normalized[best - 1], normalized[best], normalized[best + 1] ?? normalized[best]];
  const shift = a - 2 * b + c > 0 ? Math.max(-1, Math.min(1, (a - c) / (2 * (a - 2 * b + c)))) : 0;
  return { f0: sampleRate / (best + shift), aperiodicity: b };
}
