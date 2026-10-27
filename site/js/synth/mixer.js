// 코사인파 합성 계산. 모든 파동은 진폭 1, 위상 0인 cos(2π·f·t)이다.

const gcd = (a, b) => (b ? gcd(b, a % b) : a);

// 자연수 주파수들의 최대공약수 = 합성 파형이 반복되는 기본 주파수(Hz). 비어 있으면 0.
export function fundamentalOf(frequencies) {
  return frequencies.reduce(gcd, 0);
}

// 시각 t(초)에서의 합성 값. 파동 개수로 나눠 [-1, 1]로 정규화한다(t=0에서 최대 1).
export function mixAt(frequencies, t) {
  let sum = 0;
  for (const frequency of frequencies) sum += Math.cos(2 * Math.PI * frequency * t);
  return sum / frequencies.length;
}

// 파형 모양은 유지한 채 한 주기가 pitch(Hz)로 반복되도록 모든 주파수를 같은 비율로 옮긴다.
export function retune(frequencies, pitch) {
  const fundamental = fundamentalOf(frequencies);
  return frequencies.map((frequency) => (frequency / fundamental) * pitch);
}
