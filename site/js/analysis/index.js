// 소리 분석 패키지 진입점. 소리 파일의 한 구간이나 파일 전체를 코사인파 묶음으로 닮게 나타낸다.
// 주기적인 소리는 기본 주파수 배음 자리에서, 아닌 소리는 스펙트럼 봉우리에서 성분을 고른다.
// 주기적이라고 보려면 YIN 비주기성이 PERIODIC보다 작고, 센 봉우리 CHECKED개의 에너지 중 HARMONIC_SHARE 이상이
// 배음 자리(기본 주파수의 HARMONIC_TOLERANCE배 안)에 있어야 한다(종처럼 거의 반복되지만 배음이 아닌 소리를 거름).
// 진폭은 창을 씌운 스펙트럼에서 같은 주파수 코사인의 진폭으로 환산한 값(2|X|/Σw)이다. 배음은 Hann 창으로,
// 봉우리는 곁엽이 낮은(−92 dB) 4항 Blackman-Harris 창으로 찾아 곁엽을 봉우리로 잘못 고르지 않게 한다.
// 근거는 docs/sound-matching.md.
import { fft, nextPowerOfTwo } from './fft.js';
import { detectPitch } from './pitch.js';

export const MAX_SECONDS = 10;
export const SEGMENT_SECONDS = 0.1;
const FRAME_SECONDS = 0.05;
const HOP_SECONDS = 0.01;
const PERIODIC = 0.35;
const HARMONIC_TOLERANCE = 0.05;
const HARMONIC_SHARE = 0.9;
const CHECKED = 8;
const MAX_FREQUENCY = 10000;
const MIN_LEVEL = 0.001; // 가장 강한 성분 대비 −60 dB(화면에서 입력할 수 있는 가장 작은 진폭)
const SILENCE = 1e-5; // 이보다 작은 진폭은 소리가 없는 것으로 본다
const SEGMENT = { pitch: { minFrequency: 30, maxFrequency: 2000 }, pad: 4 };
const FRAME = { pitch: { minFrequency: 50, maxFrequency: 2000 }, pad: 2 };

// 창 함수(x: 0~1)와 주엽 반폭(칸 수)
const HANN = { shape: (x) => 0.5 - 0.5 * Math.cos(2 * Math.PI * x), halfWidth: 2 };
const BLACKMAN_HARRIS = {
  shape: (x) =>
    0.35875 - 0.48829 * Math.cos(2 * Math.PI * x) + 0.14128 * Math.cos(4 * Math.PI * x) - 0.01168 * Math.cos(6 * Math.PI * x),
  halfWidth: 4,
};

// 창을 씌운 진폭 스펙트럼. 창 길이의 pad배로 0을 채워 주파수 칸을 촘촘히 한다.
function spectrum(frame, sampleRate, pad, window = HANN) {
  const size = nextPowerOfTwo(frame.length) * pad;
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  let windowSum = 0;
  for (let i = 0; i < frame.length; i++) {
    const w = window.shape(i / frame.length);
    re[i] = frame[i] * w;
    windowSum += w;
  }
  fft(re, im);
  const magnitude = new Float64Array(size / 2 + 1);
  for (let k = 0; k < magnitude.length; k++) magnitude[k] = (2 * Math.hypot(re[k], im[k])) / windowSum;
  return { magnitude, binHz: sampleRate / size };
}

// 칸 k 둘레를 로그 진폭 포물선으로 다듬은 봉우리의 주파수와 진폭
function refine({ magnitude, binHz }, k) {
  const log = (j) => Math.log((magnitude[j] ?? 0) + 1e-12);
  const [a, b, c] = [log(k - 1), log(k), log(k + 1)];
  const curve = a - 2 * b + c;
  // 진짜 봉우리라면 꼭짓점은 칸 반 개 안에 있다(거의 평평한 곳에서 값이 튀지 않게 막는다).
  const shift = curve < 0 ? Math.max(-0.5, Math.min(0.5, (a - c) / (2 * curve))) : 0;
  return { frequency: (k + shift) * binHz, amplitude: Math.exp(b - ((a - c) * shift) / 4) };
}

// 배음 n·f0 둘레(±f0/4)에서 가장 큰 칸을 그 배음으로 본다.
function harmonics(spec, f0, limit) {
  const { magnitude, binHz } = spec;
  const list = [];
  for (let n = 1; n * f0 <= limit; n++) {
    const from = Math.max(1, Math.round(((n - 0.25) * f0) / binHz));
    const to = Math.min(magnitude.length - 2, Math.round(((n + 0.25) * f0) / binHz));
    let k = from;
    for (let j = from; j <= to; j++) if (magnitude[j] > magnitude[k]) k = j;
    list.push({ n, amplitude: refine(spec, k).amplitude });
  }
  return list;
}

// 큰 봉우리부터 count개. 창의 주엽 폭(separation Hz)보다 가까운 봉우리는 같은 성분의 곁가지로 보고 뺀다.
function peaks(spec, limit, count, separation) {
  const { magnitude, binHz } = spec;
  const top = Math.min(magnitude.length - 2, Math.floor(limit / binHz));
  const found = [];
  for (let k = 2; k <= top; k++) {
    if (magnitude[k] > magnitude[k - 1] && magnitude[k] >= magnitude[k + 1]) found.push(refine(spec, k));
  }
  found.sort((a, b) => b.amplitude - a.amplitude);
  const kept = [];
  for (const peak of found) {
    if (kept.length >= count) break;
    if (kept.every((other) => Math.abs(other.frequency - peak.frequency) >= separation)) kept.push(peak);
  }
  return kept;
}

const strongest = (list, count) => [...list].sort((a, b) => b.amplitude - a.amplitude).slice(0, count);
const meanSquare = (frame) => frame.reduce((sum, value) => sum + value * value, 0) / frame.length;

// 한 프레임의 성분. 진폭은 실제 크기, 주파수는 실수 Hz다.
function analyzeFrame(frame, sampleRate, count, { pitch, pad }) {
  const spec = spectrum(frame, sampleRate, pad);
  const limit = Math.min(MAX_FREQUENCY, 0.95 * (sampleRate / 2));
  const { f0, aperiodicity } = detectPitch(frame, sampleRate, pitch);
  const separation = (window) => (window.halfWidth * sampleRate) / frame.length;
  const onHarmonic = ({ frequency }) =>
    Math.abs(frequency - Math.max(1, Math.round(frequency / f0)) * f0) <= HARMONIC_TOLERANCE * f0;
  const strong = peaks(spec, limit, CHECKED, separation(HANN));
  const energy = (list) => list.reduce((sum, peak) => sum + peak.amplitude ** 2, 0);
  const periodic =
    aperiodicity < PERIODIC && f0 > 0 && energy(strong) > 0 && energy(strong.filter(onHarmonic)) >= HARMONIC_SHARE * energy(strong);
  const picked = periodic
    ? strongest(harmonics(spec, f0, limit), count).map(({ n, amplitude }) => ({ n, frequency: n * f0, amplitude }))
    : peaks(spectrum(frame, sampleRate, pad, BLACKMAN_HARRIS), limit, count, separation(BLACKMAN_HARRIS));
  const loudest = Math.max(0, ...picked.map((item) => item.amplitude));
  const components = picked.filter((item) => item.amplitude >= Math.max(SILENCE, loudest * MIN_LEVEL));
  return { periodic, f0, components, spec };
}

// 가장 큰 소리가 나는 구간의 시작 시각(초)
export function loudestStart(samples, sampleRate) {
  const length = Math.round(SEGMENT_SECONDS * sampleRate);
  const step = Math.round(HOP_SECONDS * sampleRate);
  let [best, bestEnergy] = [0, -1];
  for (let from = 0; from + length <= samples.length; from += step) {
    const energy = meanSquare(samples.subarray(from, from + length));
    if (energy > bestEnergy) [best, bestEnergy] = [from, energy];
  }
  return best / sampleRate;
}

// 한 구간(start초부터 SEGMENT_SECONDS) → 「파형 만들기」에 넣을 수 있는 코사인파 목록.
// 결과 { periodic, f0, fundamental, components: [{ frequency: 자연수 Hz, amplitude: 가장 강한 것 = 1 }],
//        reference: 가장 강한 성분의 실제 진폭, captured: 구간 에너지 중 담은 비율,
//        spectrum: { levels: dB(가장 강한 성분 = 0), binHz } }
export function analyzeSegment(samples, sampleRate, start, count) {
  const length = Math.min(samples.length, Math.round(SEGMENT_SECONDS * sampleRate));
  const from = Math.max(0, Math.min(samples.length - length, Math.round(start * sampleRate)));
  const frame = samples.subarray(from, from + length);
  const { periodic, f0, components, spec } = analyzeFrame(frame, sampleRate, count, SEGMENT);

  // 배음이면 기본 주파수를 자연수 F로 맞춰 n·F, 아니면 봉우리 주파수를 반올림한다(같아지면 큰 쪽만).
  const fundamental = periodic ? Math.max(1, Math.round(f0)) : 0;
  const rounded = new Map();
  for (const item of components) {
    const frequency = periodic ? item.n * fundamental : Math.max(1, Math.round(item.frequency));
    if ((rounded.get(frequency) ?? 0) < item.amplitude) rounded.set(frequency, item.amplitude);
  }
  const reference = Math.max(SILENCE, ...rounded.values());
  const energy = meanSquare(frame);
  const captured = energy ? [...rounded.values()].reduce((sum, a) => sum + (a * a) / 2, 0) / energy : 0;
  return {
    periodic,
    f0,
    fundamental,
    components: [...rounded]
      .map(([frequency, amplitude]) => ({ frequency, amplitude: amplitude / reference }))
      .sort((a, b) => a.frequency - b.frequency),
    reference,
    captured: Math.min(1, captured),
    spectrum: { levels: spec.magnitude.map((value) => 20 * Math.log10(value / reference + 1e-12)), binHz: spec.binHz },
  };
}

// 파일 전체를 HOP_SECONDS마다 FRAME_SECONDS 창으로 분석한다. 성분 주파수는 실수 Hz, 진폭은 실제 크기다.
// 결과 { start: 첫 프레임 가운데 시각, hop, frames: [{ components }] }. onProgress(0~1)로 진행을 알리고,
// 화면이 멈추지 않도록 프레임 몇십 개마다 쉰다.
export async function analyzeFrames(samples, sampleRate, count, onProgress = () => {}) {
  const length = Math.round(FRAME_SECONDS * sampleRate);
  const hop = Math.round(HOP_SECONDS * sampleRate);
  const total = Math.max(1, Math.floor((samples.length - length) / hop) + 1);
  const frames = [];
  for (let k = 0; k < total; k++) {
    const frame = samples.subarray(k * hop, k * hop + length);
    frames.push({ components: analyzeFrame(frame, sampleRate, count, FRAME).components });
    if (k % 40 === 39) {
      onProgress(k / total);
      await new Promise((resolve) => setTimeout(resolve));
    }
  }
  onProgress(1);
  return { start: length / 2 / sampleRate, hop: hop / sampleRate, frames };
}

// 두 소리의 진폭 스펙트럼 차이(spectral convergence): ‖|A|−|B|‖ / ‖|A|‖. 0이면 같고 클수록 다르다.
export function spectralDistance(original, other, sampleRate) {
  const length = Math.round(FRAME_SECONDS * sampleRate);
  const step = length;
  let [difference, total] = [0, 0];
  for (let from = 0; from + length <= Math.min(original.length, other.length); from += step) {
    const a = spectrum(original.subarray(from, from + length), sampleRate, 1).magnitude;
    const b = spectrum(other.subarray(from, from + length), sampleRate, 1).magnitude;
    for (let k = 0; k < a.length; k++) {
      difference += (a[k] - b[k]) ** 2;
      total += a[k] ** 2;
    }
  }
  return total ? Math.sqrt(difference / total) : 0;
}
