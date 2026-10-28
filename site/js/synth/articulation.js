// 울림: 음계 버튼으로 소리 낼 때 배음마다 커지고 줄어드는 모양(docs/realistic-sound-research.md 4번).
// articulate()는 파동 { frequency, amplitude }에 envelope { attack, stages: [{ level, timeConstant }] }를 붙인다.
// - 단계마다 attack(초) 동안 0에서 level까지 커지고, timeConstant(초)가 있으면 e^(−t/τ)로 줄어든다(null이면 유지).
// - 모양 함수 shape(n, f): n = 기본 주파수에 대한 배음 번호, f = 주파수(Hz).
//   반환 { attack, stages: [{ share: 세기 몫, rate: 줄어드는 빠르기 dB/s(없으면 유지) }] }
// '지속'은 envelope 없이 지금처럼 모든 배음이 함께 울린다. 값은 docs에 근거와 추정 여부를 적었다.
// vibrato { rate: Hz, depth: 센트 }가 있는 울림은 모든 배음의 높이를 함께 흔든다(audio/player).
// strings { inharmonicity: B, detune: [센트] }가 있는 울림은 피아노 현처럼 n번째 부분음을 n·f·√(1 + B·n²)로
// 조금씩 높이고, 한 음을 detune만큼 어긋난 줄 여러 개(세기는 나눠 가짐)로 낸다.

const DB_PER_NEPER = 20 / Math.LN10;

// 튕기거나 친 현: 1배음 13 dB/s, 2배음 24 dB/s로 줄어든 사례를 배음 번호의 거듭제곱으로 이었다.
const STRING_POWER = Math.log2(24 / 13);
const stringRate = (rate, n) => rate * n ** STRING_POWER;

// 실로폰 막대: 저음 약 1초 ~ 고음 약 1/50초 만에 사라진다(음역 F4~C8, 60 dB 줄어드는 시간으로 봄).
const BAR = { low: 349, high: 4186, longest: 1, shortest: 0.02 };
const BAR_POWER = Math.log(BAR.longest / BAR.shortest) / Math.log(BAR.high / BAR.low);
const barRate = (f) => 60 / (BAR.longest * (f / BAR.low) ** -BAR_POWER);

// 활·관: attack 동안 커진 뒤 유지된다. 높은 배음일수록 배음 하나마다 attack의 ONSET_SPREAD만큼 늦게 다 커진다.
const ONSET_SPREAD = 0.1;
const sustained = (attack) => (n) => ({ attack: attack * (1 + ONSET_SPREAD * (n - 1)), stages: [{ share: 1 }] });

export const ARTICULATIONS = [
  {
    name: '지속',
    detail: '모든 배음이 함께 커지고 누르는 동안 그대로 울립니다(합성음 재생과 같은 소리).',
    shape: null,
  },
  {
    name: '튕김',
    detail: '기타·베이스처럼 바로 울린 뒤 저절로 줄어들고, 높은 배음일수록 빨리 사라집니다.',
    shape: (n) => ({ attack: 0.003, stages: [{ share: 1, rate: stringRate(13, n) }] }),
  },
  {
    name: '타격',
    detail:
      '피아노처럼 바로 울린 뒤 빨리 줄다가, 남은 소리가 4배 느리게 줄어듭니다. 높은 배음일수록 빨리 사라지고 ' +
      '조금씩 높으며(비조화성), 줄 세 개가 1센트씩 어긋나 있습니다.',
    // 중음역 비조화성 계수 약 10⁻⁴. 줄은 −1·0·+1센트(추정, C4에서 바깥 두 줄 차이 약 0.3 Hz)
    strings: { inharmonicity: 1e-4, detune: [-1, 0, 1] },
    shape: (n) => ({
      attack: 0.005,
      stages: [
        { share: 0.8, rate: stringRate(8, n) },
        { share: 0.2, rate: stringRate(2, n) },
      ],
    }),
  },
  {
    name: '막대',
    detail: '실로폰처럼 바로 울리고, 높은 소리일수록 짧게 사라집니다.',
    shape: (n, f) => ({ attack: 0.001, stages: [{ share: 1, rate: barRate(f) }] }),
  },
  {
    name: '활',
    detail: '바이올린처럼 약 40 ms에 걸쳐 커지고, 높은 배음이 조금씩 늦게 따라옵니다. 1초에 6.6번, ±32센트로 떨립니다(비브라토).',
    shape: sustained(0.04),
    // 전문 연주자 측정값 6.63 Hz, 폭 63센트(위아래 합으로 봄)
    vibrato: { rate: 6.63, depth: 31.5 },
  },
  {
    name: '관',
    detail: '트럼펫·리코더처럼 약 20 ms에 걸쳐 커지고, 높은 배음이 조금씩 늦게 따라옵니다.',
    shape: sustained(0.02),
  },
];

// fundamental: 배음 번호를 셀 기본 주파수(Hz). 음계로 옮긴 파동이면 그 음의 주파수다.
export function articulate(waves, name, fundamental) {
  const { shape, strings } = ARTICULATIONS.find((articulation) => articulation.name === name) ?? {};
  if (!shape) return waves;
  const detunes = strings?.detune ?? [0];
  return waves.flatMap((wave) => {
    const n = wave.frequency / fundamental;
    const { attack, stages } = shape(n, wave.frequency);
    const stretch = strings ? Math.sqrt(1 + strings.inharmonicity * n ** 2) : 1;
    const amplitude = wave.amplitude / detunes.length;
    return detunes.map((cents) => ({
      ...wave,
      frequency: wave.frequency * stretch * 2 ** (cents / 1200),
      amplitude,
      envelope: {
        attack,
        stages: stages.map(({ share, rate }) => ({
          level: amplitude * share,
          timeConstant: rate ? DB_PER_NEPER / rate : null,
        })),
      },
    }));
  });
}
