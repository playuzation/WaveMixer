// 샘플 데이터를 코사인파 주파수 목록으로 바꾸는 함수들.
// 같은 주파수가 여러 번 들어가면 그 개수만큼 그 성분의 진폭이 커진다.

// 배음 번호 n(1부터)마다 counts[n-1]개씩 n·f0를 넣는다. 예: (100, [2, 1]) → [100, 100, 200]
export function harmonicSeries(f0, counts) {
  return counts.flatMap((count, index) => Array(count).fill(f0 * (index + 1)));
}

const MAX_COUNT = 8;
const RANGE_DB = 42;
const DEFAULT_BANDWIDTHS = [80, 100, 150];

// 2차 공명(포먼트)의 크기. 0 Hz에서 1이 되도록 정규화했다.
const resonance = (f, center, bandwidth) =>
  center ** 2 / Math.hypot(center ** 2 - f ** 2, bandwidth * f);

// 음원-필터 모델로 배음 개수를 정한다.
// - 음원(성대 −12 dB/oct)과 입술 방사(+6 dB/oct)를 합친 1/n 기울기에
// - formants(공명)를 곱하고, zeros(코 공명 때문에 생기는 골)로 나눈다.
// 개수는 정수라 작은 진폭이 사라지므로, 가장 강한 배음 대비 dB를 개수에 비례시킨다
// (0 dB → 8개, −21 dB → 4개, −42 dB 이하 → 0개). 진폭 차이를 줄이는 대신 포먼트 모양이 남는다.
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

// 잡음 근사: [하한 Hz, 상한 Hz, 개수] 대역마다 간격이 불규칙한 자연수 주파수를 고르게 흩뿌린다.
// 황금비의 소수부를 이용해 매번 같은 결과가 나오면서도 배음 관계가 생기지 않게 한다.
const GOLDEN = (Math.sqrt(5) - 1) / 2;
export function noiseSeries(bands) {
  return bands.flatMap(([low, high, count]) =>
    Array.from({ length: count }, (_, k) => Math.round(low + (high - low) * (((k + 1) * GOLDEN) % 1))),
  );
}
