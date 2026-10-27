// 시간에 따라 바뀌는 소리를 진폭 배열로 계산한다. 결과는 가장 큰 진폭이 1이 되도록 정규화한다.
// sound: { duration, segments, track? } (시간 단위: 초)
// - segments: 잡음 구간 { noise: 공진기 목록, level, start, duration, fadeIn, fadeOut }.
//   걸러진 잡음(synth/noise.js)의 실효값(RMS)을 level에 맞추고,
//   시작·끝은 fadeIn·fadeOut 동안 선형으로 키우고 줄인다.
// - track: 성대가 울리는 소리 { start, hop, frames: [{ f0, amplitudes }] }. 프레임(hop초 간격) 사이의
//   높이와 배음 진폭을 샘플마다 선형 보간하고, 위상은 높이를 적분해 끊김 없이 이어 간다.
import { filteredNoise } from './noise.js';

const ramp = (x, width) => (width > 0 ? Math.min(1, Math.max(0, x / width)) : 1);
const TWO_PI = 2 * Math.PI;

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

function addTrack(out, { start, hop, frames }, sampleRate) {
  if (frames.length < 2) return;
  const from = Math.max(0, Math.ceil(start * sampleRate));
  const to = Math.min(out.length, Math.floor((start + hop * (frames.length - 1)) * sampleRate));
  let phase = 0;
  for (let i = from; i < to; i++) {
    const position = (i / sampleRate - start) / hop;
    const k = Math.min(frames.length - 2, Math.floor(position));
    const x = position - k;
    const a = frames[k];
    const b = frames[k + 1];
    phase = (phase + (TWO_PI * (a.f0 + (b.f0 - a.f0) * x)) / sampleRate) % TWO_PI;
    const count = Math.max(a.amplitudes.length, b.amplitudes.length);
    if (!count) continue;

    // cos(nθ)를 cos((n−1)θ)·cos(θ) 점화식으로 구해 배음마다 cos를 새로 부르지 않는다.
    const c1 = Math.cos(phase);
    let previous = 1;
    let current = c1;
    let sum = 0;
    for (let n = 0; n < count; n++) {
      const p = a.amplitudes[n] ?? 0;
      sum += (p + ((b.amplitudes[n] ?? 0) - p) * x) * current;
      const next = 2 * c1 * current - previous;
      previous = current;
      current = next;
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
