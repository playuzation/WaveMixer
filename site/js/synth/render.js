// 시간에 따라 바뀌는 소리를 진폭 배열로 계산한다.
// segment: { frequencies, level, start, duration, fadeIn, fadeOut } (시간 단위: 초)
// - 같은 주파수가 n개면 진폭 n인 cos 하나로 본다.
// - 구간마다 실효값(RMS)을 level에 맞추고, 시작·끝은 fadeIn·fadeOut 동안 선형으로 키우고 줄인다.
// - 모든 cos는 전체 시간 t = 0 기준 위상이라, 이웃 구간의 같은 주파수가 끊김 없이 이어진다.
// 결과는 가장 큰 진폭이 1이 되도록 정규화한다.
const ramp = (x, width) => (width > 0 ? Math.min(1, Math.max(0, x / width)) : 1);

export function renderSegments(segments, duration, sampleRate) {
  const out = new Float32Array(Math.ceil(duration * sampleRate));

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
      for (const [frequency, amplitude] of components) sum += amplitude * Math.cos(2 * Math.PI * frequency * t);
      out[i] += gain * envelope * sum;
    }
  }

  const peak = out.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  if (peak) for (let i = 0; i < out.length; i++) out[i] /= peak;
  return out;
}
