// 코사인파 합성 계산. 파동은 { frequency, amplitude }이며 위상 0인 amplitude·cos(2π·f·t)이다.

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// 자연수 주파수들의 최대공약수 = 합성 파형이 반복되는 기본 주파수(Hz). 비어 있으면 0.
export function fundamentalOf(frequencies) {
  return frequencies.reduce(gcd, 0);
}

// 시각 t(초)에서의 합성 값. 진폭의 합으로 나눠 [-1, 1]로 정규화한다(t=0에서 최대 1).
export function mixAt(waves, t) {
  let sum = 0;
  let total = 0;
  for (const { frequency, amplitude } of waves) {
    sum += amplitude * Math.cos(2 * Math.PI * frequency * t);
    total += amplitude;
  }
  return sum / total;
}

// 파형 모양은 유지한 채 한 주기가 pitch(Hz)로 반복되도록 모든 주파수를 같은 비율로 옮긴다.
export function retune(waves, pitch) {
  const fundamental = fundamentalOf(waves.map((wave) => wave.frequency));
  return waves.map(({ frequency, amplitude }) => ({ frequency: (frequency / fundamental) * pitch, amplitude }));
}
