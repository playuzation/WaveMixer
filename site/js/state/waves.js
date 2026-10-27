// 파동 목록 모델. 목록은 { id, frequency } 배열이며 항상 새 배열을 반환한다.
export const MIN_FREQUENCY = 1;
export const MAX_FREQUENCY = 20000;

let nextId = 1;

// 키보드 입력 문자열을 자연수 주파수(Hz)로 변환한다. 유효하지 않으면 null.
export function parseFrequency(text) {
  const value = text.trim();
  if (!/^\d+$/.test(value)) return null;
  const frequency = Number(value);
  return frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY ? frequency : null;
}

export function addWave(waves, frequency) {
  return [...waves, { id: nextId++, frequency }];
}

// 주파수 목록으로 새 파동 목록을 만든다(샘플 불러오기 등 목록 교체용).
export function createWaves(frequencies) {
  return frequencies.map((frequency) => ({ id: nextId++, frequency }));
}

export function removeWave(waves, id) {
  return waves.filter((wave) => wave.id !== id);
}
