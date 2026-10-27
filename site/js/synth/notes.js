// C4 ~ C5 다장조 음계. 12평균율, A4 = 440 Hz 기준.
const A4 = 440;

const SCALE = [
  ['C', 'C4', -9],
  ['D', 'D4', -7],
  ['E', 'E4', -5],
  ['F', 'F4', -4],
  ['G', 'G4', -2],
  ['A', 'A4', 0],
  ['B', 'B4', 2],
  ['hiC', 'C5', 3],
];

export const NOTES = SCALE.map(([name, pitch, semitones]) => ({
  name,
  pitch,
  frequency: A4 * 2 ** (semitones / 12),
}));
