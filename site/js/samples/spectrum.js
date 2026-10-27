// 샘플 데이터를 코사인파 주파수 목록으로 바꾸는 함수들.
// 같은 주파수가 여러 번 들어가면 그 개수만큼 그 성분의 진폭이 커진다.

// 배음 번호 n(1부터)마다 counts[n-1]개씩 n·f0를 넣는다. 예: (100, [2, 1]) → [100, 100, 200]
export function harmonicSeries(f0, counts) {
  return counts.flatMap((count, index) => Array(count).fill(f0 * (index + 1)));
}

const MAX_COUNT = 6;
const RANGE_DB = 36;
const DEFAULT_BANDWIDTHS = [80, 100, 150];

// 2차 공명(포먼트)의 크기. 0 Hz에서 1이 되도록 정규화했다.
const resonance = (f, center, bandwidth) =>
  center ** 2 / Math.hypot(center ** 2 - f ** 2, bandwidth * f);

// 음원-필터 모델로 배음 개수를 정한다.
// - 음원(성대 −12 dB/oct)과 입술 방사(+6 dB/oct)를 합친 1/n 기울기에
// - formants(공명)를 곱하고, zeros(코 공명 때문에 생기는 골)로 나눈다.
// 개수는 정수라 작은 진폭이 사라지므로, 가장 강한 배음 대비 dB를 개수에 비례시킨다
// (6 dB마다 1개: 0 dB → 6개, −18 dB → 3개, −36 dB 이하 → 0개). 진폭 차이를 줄이는 대신 포먼트 모양이 남는다.
export function formantSeries(f0, { formants, bandwidths = DEFAULT_BANDWIDTHS, zeros = [], maxFrequency }) {
  const top = maxFrequency ?? formants[formants.length - 1] + 500;
  const amplitudes = [];
  for (let n = 1; n * f0 <= top; n++) {
    const f = n * f0;
    let amplitude = 1 / n;
    formants.forEach((center, i) => {
      amplitude *= resonance(f, center, bandwidths[i] ?? bandwidths[bandwidths.length - 1]);
    });
    zeros.forEach((center) => {
      amplitude /= resonance(f, center, DEFAULT_BANDWIDTHS[1]);
    });
    amplitudes.push(amplitude);
  }
  const peak = Math.max(...amplitudes);
  return harmonicSeries(
    f0,
    amplitudes.map((amplitude) => {
      const db = 20 * Math.log10(amplitude / peak);
      return Math.max(0, Math.round(MAX_COUNT * (1 + db / RANGE_DB)));
    }),
  );
}

// ── 포먼트 이동 합성용 ──
// 한 시점의 배음 진폭(개수가 아닌 실제 값). 실효값(RMS)이 level이 되도록 맞춘다.
// formants·bandwidths는 같은 길이, zero는 [중심 Hz, 깊이 0~1](코 공명의 골) 또는 null.
export function harmonicAmplitudes(f0, { formants, bandwidths, zero, level }, maxFrequency) {
  const amplitudes = [];
  for (let n = 1; n * f0 <= maxFrequency; n++) {
    const f = n * f0;
    let amplitude = 1 / n;
    formants.forEach((center, i) => {
      amplitude *= resonance(f, center, bandwidths[i]);
    });
    if (zero) amplitude /= resonance(f, zero[0], DEFAULT_BANDWIDTHS[1]) ** zero[1];
    amplitudes.push(amplitude);
  }
  const rms = Math.sqrt(amplitudes.reduce((sum, amplitude) => sum + amplitude ** 2 / 2, 0));
  return amplitudes.map((amplitude) => (rms ? (amplitude / rms) * level : 0));
}

// 키프레임 사이를 hop(초)마다 선형 보간해, 프레임마다 높이(f0)와 배음 진폭을 구한다.
// key: { time, f0, formants, bandwidths?, zero?, level } — formants 개수는 모든 키에서 같아야 한다.
// 결과: { start, hop, frames: [{ f0, amplitudes }] } (소리가 없는 프레임은 amplitudes가 빈 배열)
export function trackFrames(keys, { hop, maxFrequency }) {
  const widths = (key) => key.formants.map((_, i) => key.bandwidths?.[i] ?? DEFAULT_BANDWIDTHS[Math.min(i, DEFAULT_BANDWIDTHS.length - 1)]);
  const frames = [];
  const start = keys[0]?.time ?? 0;
  const count = keys.length ? Math.floor((keys[keys.length - 1].time - start) / hop) + 1 : 0;
  let k = 0;
  for (let j = 0; j < count; j++) {
    const t = start + j * hop;
    while (k < keys.length - 2 && keys[k + 1].time <= t) k++;
    const a = keys[k];
    const b = keys[k + 1] ?? a;
    const x = b.time > a.time ? Math.min(1, Math.max(0, (t - a.time) / (b.time - a.time))) : 1;
    const mix = (p, q) => p + (q - p) * x;
    const level = mix(a.level, b.level);
    const f0 = mix(a.f0, b.f0);
    if (level <= 0) {
      frames.push({ f0, amplitudes: [] });
      continue;
    }
    const [widthsA, widthsB] = [widths(a), widths(b)];
    const zero = a.zero || b.zero ? [mix(a.zero?.[0] ?? b.zero[0], b.zero?.[0] ?? a.zero[0]), mix(a.zero?.[1] ?? 0, b.zero?.[1] ?? 0)] : null;
    const params = {
      formants: a.formants.map((value, i) => mix(value, b.formants[i])),
      bandwidths: widthsA.map((value, i) => mix(value, widthsB[i])),
      zero,
      level,
    };
    frames.push({ f0, amplitudes: harmonicAmplitudes(f0, params, maxFrequency) });
  }
  return { start, hop, frames };
}

// 잡음 근사: [하한 Hz, 상한 Hz, 개수] 대역마다 간격이 불규칙한 자연수 주파수를 고르게 흩뿌린다.
// 황금비의 소수부를 이용해 매번 같은 결과가 나오면서도 배음 관계가 생기지 않게 한다.
const GOLDEN = (Math.sqrt(5) - 1) / 2;
export function noiseSeries(bands) {
  return bands.flatMap(([low, high, count]) =>
    Array.from({ length: count }, (_, k) => Math.round(low + (high - low) * (((k + 1) * GOLDEN) % 1))),
  );
}
