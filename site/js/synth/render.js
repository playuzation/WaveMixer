// 시간에 따라 바뀌는 소리를 진폭 배열로 계산한다. 결과는 가장 큰 진폭이 1이 되도록 정규화한다.
// sound: { duration, segments, track? } (시간 단위: 초)
// - segments: 정지된 코사인파 묶음 { frequencies, level, start, duration, fadeIn, fadeOut }.
//   같은 주파수가 n개면 진폭 n인 cos 하나로 보고, 구간마다 실효값(RMS)을 level에 맞추며,
//   시작·끝은 fadeIn·fadeOut 동안 선형으로 키우고 줄인다. 위상은 전체 시간 t = 0 기준이다.
// - track: 성대가 울리는 소리 { start, hop, frames: [{ f0, amplitudes }] }. 프레임(hop초 간격) 사이의
//   높이와 배음 진폭을 샘플마다 선형 보간하고, 위상은 높이를 적분해 끊김 없이 이어 간다.
const ramp = (x, width) => (width > 0 ? Math.min(1, Math.max(0, x / width)) : 1);
const TWO_PI = 2 * Math.PI;

function addSegments(out, segments, sampleRate) {
  for (const { frequencies, level, start, duration: length, fadeIn, fadeOut } of segments) {
    const amplitudes = new Map();
    frequencies.forEach((frequency) => amplitudes.set(frequency, (amplitudes.get(frequency) ?? 0) + 1));
    const components = [...amplitudes];
    const rms = Math.sqrt(components.reduce((sum, [, amplitude]) => sum + amplitude ** 2 / 2, 0));
    const gain = level / rms;

    const from = Math.max(0, Math.floor(start * sampleRate));
    const to = Math.min(out.length, Math.ceil((start + length) * sampleRate));
    for (let i = from; i < to; i++) {
      const t = i / sampleRate;
      const envelope = ramp(t - start, fadeIn) * ramp(start + length - t, fadeOut);
      if (!envelope) continue;
      let sum = 0;
      for (const [frequency, amplitude] of components) sum += amplitude * Math.cos(TWO_PI * frequency * t);
      out[i] += gain * envelope * sum;
    }
  }
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
