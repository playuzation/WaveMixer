// 시간에 따라 바뀌는 소리를 진폭 배열로 계산한다. 결과는 가장 큰 진폭이 1이 되도록 정규화한다.
// sound: { duration, segments, track? } (시간 단위: 초)
// - segments: 잡음 구간 { noise: 공진기 목록, level, start, duration, fadeIn, fadeOut }.
//   걸러진 잡음(synth/noise.js)의 실효값(RMS)을 level에 맞추고,
//   시작·끝은 fadeIn·fadeOut 동안 선형으로 키우고 줄인다.
// - track: 성대가 울리는 소리 { start, hop, frames: [{ f0, amplitudes, phases?, formants? }], flutter?, breath? }.
//   프레임(hop초 간격) 사이의 높이와 배음(진폭·위상)을 샘플마다 선형 보간하고, 위상은 높이를 적분해 끊김 없이 이어 간다.
//   flutter(비율)가 있으면 Klatt 합성기처럼 느린 사인파 세 개로 높이를 그 실효값만큼 흔든다.
//   breath { ratio, bandwidths, open }가 있으면 숨소리를 섞는다: 백색 잡음을 프레임 포먼트의 공명기(Klatt 디지털
//   공명기, 대역폭 bandwidths)에 차례로 통과시켜 실효값을 목소리 실효값 × ratio로 맞추고,
//   성문이 열린 동안(θ < 2π·open)은 그대로, 닫힌 동안은 CLOSED_BREATH배로 낸다.
import { filteredNoise, whiteNoise } from './noise.js';

const ramp = (x, width) => (width > 0 ? Math.min(1, Math.max(0, x / width)) : 1);
const TWO_PI = 2 * Math.PI;
const FLUTTER_HZ = [12.7, 7.1, 4.7];
const CLOSED_BREATH = 0.5;
const BREATH_SEED = 101;
const GAIN_POINTS = 128;

function addSegments(out, segments, sampleRate) {
  segments.forEach(({ noise, level, start, duration: length, fadeIn, fadeOut }, index) => {
    const from = Math.max(0, Math.floor(start * sampleRate));
    const to = Math.min(out.length, Math.ceil((start + length) * sampleRate));
    if (to <= from) return;
    const samples = filteredNoise(noise, to - from, sampleRate, index + 1);
    for (let i = from; i < to; i++) {
      const t = i / sampleRate;
      out[i] += level * ramp(t - start, fadeIn) * ramp(start + length - t, fadeOut) * samples[i - from];
    }
  });
}

// Klatt 디지털 공명기 y = a·x + b·y₁ + c·y₂ (0 Hz 이득 1)
function resonator(center, bandwidth, sampleRate) {
  const c = -Math.exp((-2 * Math.PI * bandwidth) / sampleRate);
  const b = 2 * Math.exp((-Math.PI * bandwidth) / sampleRate) * Math.cos((2 * Math.PI * center) / sampleRate);
  return { a: 1 - b - c, b, c };
}

// 백색 잡음(분산 1/3)이 공명기들을 차례로 지난 뒤 실효값이 1이 되게 하는 배율
function noiseGain(resonators) {
  let power = 0;
  for (let k = 0; k < GAIN_POINTS; k++) {
    const w = (Math.PI * (k + 0.5)) / GAIN_POINTS;
    let response = 1;
    for (const { a, b, c } of resonators) {
      const re = 1 - b * Math.cos(w) - c * Math.cos(2 * w);
      const im = b * Math.sin(w) + c * Math.sin(2 * w);
      response *= a ** 2 / (re ** 2 + im ** 2);
    }
    power += response;
  }
  return 1 / Math.sqrt(power / GAIN_POINTS / 3);
}

// 프레임마다 숨소리 공명기와 잡음 배율(목소리 실효값 × ratio, 열림·닫힘을 섞어도 평균이 ratio가 되게)
function breathFrames(frames, { ratio, bandwidths, open }, sampleRate) {
  const balance = 1 / Math.sqrt(open + (1 - open) * CLOSED_BREATH ** 2);
  return frames.map(({ amplitudes, formants }) => {
    const resonators = formants.map((center, j) => resonator(center, bandwidths[j], sampleRate));
    const level = Math.sqrt(amplitudes.reduce((sum, amplitude) => sum + amplitude ** 2 / 2, 0));
    return { resonators, scale: level * ratio * balance * noiseGain(resonators) };
  });
}

function addTrack(out, { start, hop, frames, flutter = 0, breath = null }, sampleRate) {
  if (frames.length < 2) return;
  const from = Math.max(0, Math.ceil(start * sampleRate));
  const to = Math.min(out.length, Math.floor((start + hop * (frames.length - 1)) * sampleRate));
  // 진폭이 같은 사인파 세 개 합의 실효값은 진폭의 √(3/2)배다.
  const wobble = flutter / Math.sqrt(1.5);
  // 배음 n의 a·cos(nθ + φ) = a·cos φ·cos nθ − a·sin φ·sin nθ 이므로 프레임마다 두 계수로 바꿔 둔다.
  const parts = frames.map(({ amplitudes, phases = [] }) => ({
    cos: amplitudes.map((amplitude, n) => amplitude * Math.cos(phases[n] ?? 0)),
    sin: amplitudes.map((amplitude, n) => amplitude * Math.sin(phases[n] ?? 0)),
  }));
  const breaths = breath && breathFrames(frames, breath, sampleRate);
  const noise = breath && whiteNoise(Math.max(0, to - from), BREATH_SEED);
  const [y1, y2] = [[0, 0, 0, 0], [0, 0, 0, 0]];
  let phase = 0;
  for (let i = from; i < to; i++) {
    const t = i / sampleRate;
    const position = (t - start) / hop;
    const k = Math.min(frames.length - 2, Math.floor(position));
    const x = position - k;
    const a = frames[k];
    const b = frames[k + 1];
    const shake = wobble ? wobble * FLUTTER_HZ.reduce((sum, rate) => sum + Math.sin(TWO_PI * rate * t), 0) : 0;
    phase = (phase + (TWO_PI * (a.f0 + (b.f0 - a.f0) * x) * (1 + shake)) / sampleRate) % TWO_PI;

    let sum = 0;
    if (breaths) {
      const p = breaths[k];
      const q = breaths[k + 1];
      const pulse = phase < TWO_PI * breath.open ? 1 : CLOSED_BREATH;
      let value = noise[i - from] * (p.scale + (q.scale - p.scale) * x) * pulse;
      for (let j = 0; j < p.resonators.length; j++) {
        const r = p.resonators[j];
        const y = r.a * value + r.b * y1[j] + r.c * y2[j];
        y2[j] = y1[j];
        y1[j] = y;
        value = y;
      }
      sum += value;
    }

    // cos(nθ)·sin(nθ)를 cos((n−1)θ)·cos(θ) 꼴 점화식으로 구해 배음마다 cos·sin을 새로 부르지 않는다.
    const count = Math.max(a.amplitudes.length, b.amplitudes.length);
    const pa = parts[k];
    const pb = parts[k + 1];
    const c1 = Math.cos(phase);
    let cosBefore = 1;
    let cosNow = c1;
    let sinBefore = 0;
    let sinNow = Math.sin(phase);
    for (let n = 0; n < count; n++) {
      const pc = pa.cos[n] ?? 0;
      const ps = pa.sin[n] ?? 0;
      sum += (pc + ((pb.cos[n] ?? 0) - pc) * x) * cosNow - (ps + ((pb.sin[n] ?? 0) - ps) * x) * sinNow;
      const cosNext = 2 * c1 * cosNow - cosBefore;
      const sinNext = 2 * c1 * sinNow - sinBefore;
      cosBefore = cosNow;
      cosNow = cosNext;
      sinBefore = sinNow;
      sinNow = sinNext;
    }
    out[i] += sum;
  }
}

export function renderSound({ duration, segments, track }, sampleRate) {
  const out = new Float32Array(Math.ceil(duration * sampleRate));
  addSegments(out, segments, sampleRate);
  if (track) addTrack(out, track, sampleRate);

  const peak = out.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  if (peak) for (let i = 0; i < out.length; i++) out[i] /= peak;
  return out;
}
