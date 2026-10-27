// 파동 목록 모델. 목록은 { id, frequency, amplitude } 배열이며 항상 새 배열을 반환한다.
export const MIN_FREQUENCY = 1;
export const MAX_FREQUENCY = 20000;
export const MIN_AMPLITUDE = 0.001;
export const MAX_AMPLITUDE = 10;
const DEFAULT_AMPLITUDE = 1;

let nextId = 1;

// 키보드 입력 문자열을 자연수 주파수(Hz)로 변환한다. 유효하지 않으면 null.
export function parseFrequency(text) {
  const value = text.trim();
  if (!/^\d+$/.test(value)) return null;
  const frequency = Number(value);
  return frequency >= MIN_FREQUENCY && frequency <= MAX_FREQUENCY ? frequency : null;
}

// 진폭 입력 문자열을 배율로 변환한다. 비어 있으면 1, 유효하지 않으면 null.
export function parseAmplitude(text) {
  const value = text.trim();
  if (!value) return DEFAULT_AMPLITUDE;
  if (!/^(\d+\.?\d*|\.\d+)$/.test(value)) return null;
  const amplitude = Number(value);
  return amplitude >= MIN_AMPLITUDE && amplitude <= MAX_AMPLITUDE ? amplitude : null;
}

export function addWave(waves, frequency, amplitude = DEFAULT_AMPLITUDE) {
  return [...waves, { id: nextId++, frequency, amplitude }];
}

// 성분 목록 [{ frequency, amplitude }]으로 새 파동 목록을 만든다(샘플 불러오기 등 목록 교체용).
export function createWaves(components) {
  return components.map(({ frequency, amplitude }) => ({ id: nextId++, frequency, amplitude }));
}

export function removeWave(waves, id) {
  return waves.filter((wave) => wave.id !== id);
}
