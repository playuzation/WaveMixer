// 악기 샘플. docs/instrument-harmonics.md의 조사 내용을 코사인파 묶음으로 근사한다.
// - f0: 기본 주파수(Hz, 자연수)
// - amplitudes: 배음 번호 n(1부터)마다 n·f0 코사인파의 진폭(가장 강한 배음 = 1). 0이면 넣지 않는다.
// - articulation: 음계로 들을 때의 울림 이름(synth/articulation.js의 ARTICULATIONS)
// 정수배 배음과 정상 상태만 표현하므로 비조화성·감쇠 같은 특징은 담지 못한다.

// 줄 길이 1/5 지점을 튕긴 이상적인 줄의 배음 진폭 |sin(nπ/5)|/n²(기본음 = 1). 5·10배음은 0이다.
// 부호(위상)는 코사인파 진폭으로 나타낼 수 없어 크기만 쓴다.
const PLUCKED = Array.from({ length: 10 }, (_, i) => {
  const n = i + 1;
  return n % 5 ? Math.abs(Math.sin((n * Math.PI) / 5) / Math.sin(Math.PI / 5)) / n ** 2 : 0;
});

export const INSTRUMENTS = [
  {
    name: '피아노',
    pitch: 'C4',
    f0: 262,
    articulation: '타격',
    amplitudes: [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 0, 1 / 8, 1 / 9, 1 / 10],
    basis: '높은 배음일수록 약하게(진폭 1/n) 넣고, 해머가 현 길이 1/7 지점을 친 것으로 보고 7배음을 뺐습니다.',
  },
  {
    name: '기타',
    pitch: 'A2',
    f0: 110,
    articulation: '튕김',
    amplitudes: PLUCKED,
    basis: '줄 길이 1/5 지점을 튕긴 이상적인 줄의 배음 진폭 sin(nπ/5)/n²를 따랐습니다(5·10배음 없음).',
  },
  {
    name: '베이스',
    pitch: 'E1',
    f0: 41,
    articulation: '튕김',
    amplitudes: [0.25, 1, 0.75, 0.5, 0.5, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
    basis: '측정 사례처럼 2배음을 기본음의 4배(약 12 dB) 진폭으로 넣고, 17배음까지 이어지게 했습니다.',
  },
  {
    name: '바이올린',
    pitch: 'A4',
    f0: 440,
    articulation: '활',
    amplitudes: [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1.5 / 6, 1 / 7, 1 / 8, 1 / 9, 1 / 10],
    basis: '현의 톱니파 구동력(진폭 1/n)을 따르고, 브리지 공명(약 2.5 kHz)에 가까운 6배음(2640 Hz)을 1.5배로 키웠습니다.',
  },
  {
    name: "여성 '아'",
    pitch: 'A3',
    f0: 220,
    articulation: '지속',
    amplitudes: [1, 1 / 2, 1 / 3, 1, 1 / 2, 1 / 2, 1 / 6, 1 / 6, 0, 0, 0, 0, 1 / 3],
    basis: '약 1/n 기울기에 포먼트 F1≈850, F2≈1220, F3≈2810 Hz 근처의 4, 5·6, 13배음을 키웠습니다.',
  },
  {
    name: '트럼펫',
    pitch: 'B♭3',
    f0: 233,
    articulation: '관',
    amplitudes: [0.5, 0.75, 0.75, 0.75, 1, 1, 0.75, 0.5, 0.5, 0.25, 0.5, 0.25],
    basis: '홀수·짝수 배음을 고르게 넣고 포먼트(1200~1400 Hz, 약 2500 Hz) 근처의 5·6, 11배음을 키웠습니다.',
  },
  {
    name: '리코더',
    pitch: 'C5',
    f0: 523,
    articulation: '관',
    amplitudes: [1, 0.125, 0.25, 0, 0.125],
    basis: '기본음이 지배적이고 배음은 약하게, 짝수보다 홀수 배음을 조금 더 넣었습니다.',
  },
  {
    name: '실로폰',
    pitch: 'C5',
    f0: 523,
    articulation: '막대',
    amplitudes: [1, 0, 0.5],
    basis: '막대를 깎아 맞춘 1 : 3 부분음을 넣었습니다(깎지 않은 막대의 비정수 부분음은 표현할 수 없습니다).',
  },
];
