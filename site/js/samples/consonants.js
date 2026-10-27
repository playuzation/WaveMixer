// 한국어 자음 샘플(성인 여성 기준). 근거는 docs/korean-speech-sounds.md 참고.
// 자음 하나를 정지된 스펙트럼 하나로 근사한다. 종류(kind)마다 쓰는 값이 다르다.
// - noise: 잡음 대역 [하한 Hz, 상한 Hz, 개수] 목록. aspiration이 있으면 뒤 모음 '아'의
//   포먼트(F1·F2) 근처에 숨소리 잡음을 포먼트마다 그 개수만큼 더한다.
//   배음 관계가 없어서 「음계로 듣기」로는 소리 나지 않고 「합성음 재생」으로 들어야 한다.
// - voiced: 성대 진동이 있는 소리. 포먼트(공명)와 반포먼트(골)로 배음 세기를 정한다.
// - same: 다른 샘플과 같은 소리(초성 ㅇ → 모음 '아').
// 파열음의 터짐처럼 짧게 지나가는 소리는 계속 이어지는 잡음으로만 표현된다.

const NASAL_FORMANTS = [250, 1000, 2200];
const NASAL_BANDWIDTHS = [60, 300, 300];

export const ONSETS = [
  {
    name: 'ㄱ',
    kind: 'noise',
    detail: ['파열 잡음', '0.6~3.5 kHz'],
    bands: [[1200, 2400, 14], [600, 3500, 6]],
    aspiration: 3,
    basis: '연구개 파열음의 터짐 잡음은 약 600~3500 Hz(뒤 모음에 따라 이동), 평균 약 1.6 kHz입니다. 예사소리라 숨소리는 약하게 넣었습니다.',
  },
  {
    name: 'ㄴ',
    kind: 'voiced',
    detail: ['비음', '여성'],
    formants: NASAL_FORMANTS,
    bandwidths: NASAL_BANDWIDTHS,
    zeros: [1800],
    basis: '비음 웅얼거림(murmur)은 약 240~250 Hz에 에너지가 모이고 1~2.5 kHz는 약합니다. 치조 비음의 반포먼트(골)를 약 1.8 kHz에 두었습니다.',
  },
  {
    name: 'ㄷ',
    kind: 'noise',
    detail: ['파열 잡음', '3.7~5.2 kHz'],
    bands: [[3700, 5200, 14]],
    aspiration: 3,
    basis: '치조 파열음의 터짐 잡음은 약 3.7~5.2 kHz(4 kHz 이상)입니다. 예사소리라 숨소리는 약하게 넣었습니다.',
  },
  {
    name: 'ㄹ',
    kind: 'voiced',
    detail: ['탄설음', '여성'],
    formants: [547, 1868],
    basis: '초성 ㄹ은 혀끝으로 한 번 치는 탄설음 [ɾ](약 24 ms)으로, F1 약 547 Hz, F2 약 1868 Hz입니다(F3는 자료를 찾지 못했습니다).',
  },
  {
    name: 'ㅁ',
    kind: 'voiced',
    detail: ['비음', '여성'],
    formants: NASAL_FORMANTS,
    bandwidths: NASAL_BANDWIDTHS,
    zeros: [1100],
    basis: '비음 웅얼거림은 약 245 Hz에 에너지가 모입니다. 양순 비음의 반포먼트(골)를 약 1.1 kHz에 두었습니다.',
  },
  {
    name: 'ㅂ',
    kind: 'noise',
    detail: ['파열 잡음', '1.0~2.5 kHz'],
    bands: [[1000, 2500, 14]],
    aspiration: 3,
    basis: '양순 파열음의 터짐 잡음은 약 1~2.5 kHz로 낮은 쪽에 모입니다. 예사소리라 숨소리는 약하게 넣었습니다.',
  },
  {
    name: 'ㅅ',
    kind: 'noise',
    detail: ['마찰 잡음', '4.0~6.5 kHz'],
    bands: [[4000, 6500, 24]],
    aspiration: 2,
    basis: '치조 마찰음의 잡음은 약 4.0~6.5 kHz(무게중심 약 5~6.2 kHz)입니다. 뒤에 짧은 숨소리가 따라옵니다.',
  },
  {
    name: 'ㅇ',
    kind: 'same',
    detail: ['소리 없음', '= 아'],
    vowel: 'a',
    basis: "초성 ㅇ은 소리가 없는 자리 표시라서 '아'는 모음 '아'와 같은 소리입니다.",
  },
  {
    name: 'ㅈ',
    kind: 'noise',
    detail: ['파찰 잡음', '3.7~5.4 kHz'],
    bands: [[3670, 5380, 18]],
    aspiration: 3,
    basis: '치조경구개 파찰음의 마찰 잡음은 약 3.7~5.4 kHz로 ㅅ보다 조금 낮습니다. 예사소리라 숨소리는 약하게 넣었습니다.',
  },
  {
    name: 'ㅊ',
    kind: 'noise',
    detail: ['파찰 잡음', '3.4~5.4 kHz'],
    bands: [[3360, 5410, 18]],
    aspiration: 7,
    basis: '거센 파찰음으로 마찰 잡음은 약 3.4~5.4 kHz이고, 뒤 모음 포먼트 모양의 숨소리가 강하게 이어집니다.',
  },
  {
    name: 'ㅋ',
    kind: 'noise',
    detail: ['파열 잡음', '+ 숨소리'],
    bands: [[1200, 2400, 16], [600, 3500, 6]],
    aspiration: 7,
    basis: 'ㄱ과 같은 자리(연구개)의 터짐 잡음에, 거센소리라 뒤 모음 포먼트 모양의 숨소리를 강하게 더했습니다.',
  },
  {
    name: 'ㅌ',
    kind: 'noise',
    detail: ['파열 잡음', '+ 숨소리'],
    bands: [[3700, 5200, 16]],
    aspiration: 7,
    basis: 'ㄷ과 같은 자리(치조)의 터짐 잡음에, 거센소리라 뒤 모음 포먼트 모양의 숨소리를 강하게 더했습니다.',
  },
  {
    name: 'ㅍ',
    kind: 'noise',
    detail: ['파열 잡음', '+ 숨소리'],
    bands: [[1000, 2500, 16]],
    aspiration: 7,
    basis: 'ㅂ과 같은 자리(양순)의 터짐 잡음에, 거센소리라 뒤 모음 포먼트 모양의 숨소리를 강하게 더했습니다.',
  },
  {
    name: 'ㅎ',
    kind: 'noise',
    detail: ['마찰 잡음', '1.0~2.5 kHz'],
    bands: [[1000, 2500, 10]],
    aspiration: 5,
    basis: "성문 마찰음은 뒤 모음의 포먼트 모양을 띤 숨소리로, 초성에서 약 1~2.5 kHz에 모입니다. 뒤 모음이 '아'일 때의 포먼트 근처 숨소리를 더했습니다.",
  },
];

// 종성 ㄱ·ㄷ·ㅂ은 터뜨리지 않고 막으며 끝나므로 고유한 잡음이 거의 없다.
// 대신 막히기 직전 모음('아')의 포먼트가 조음 위치 쪽으로 옮겨 간 상태로 근사한다.
export const CODAS = [
  {
    name: 'ㄱ',
    kind: 'voiced',
    detail: ['아 → 막힘', '연구개'],
    formants: [600, 2100, 2400],
    basis: "불파음이라 터짐이 없습니다. '아'가 연구개 쪽으로 막히기 직전처럼 F1을 낮추고, F2는 연구개 위치(약 2.1 kHz)로 올리고 F3는 내려 서로 가깝게 했습니다.",
  },
  {
    name: 'ㄴ',
    kind: 'voiced',
    detail: ['비음', '여성'],
    formants: NASAL_FORMANTS,
    bandwidths: NASAL_BANDWIDTHS,
    zeros: [1800],
    basis: '초성 ㄴ과 같은 비음 웅얼거림(약 250 Hz 중심, 반포먼트 약 1.8 kHz)입니다.',
  },
  {
    name: 'ㄷ',
    kind: 'voiced',
    detail: ['아 → 막힘', '치조'],
    formants: [600, 1800],
    basis: "불파음이라 터짐이 없습니다. '아'가 치조 쪽으로 막히기 직전처럼 F1을 낮추고 F2를 치조 위치(locus, 약 1.8 kHz)로 옮겼습니다.",
  },
  {
    name: 'ㄹ',
    kind: 'voiced',
    detail: ['설측음', '여성'],
    formants: [470, 1638, 2413],
    basis: '종성 ㄹ은 혀 옆으로 소리가 흐르는 설측음 [l](약 100 ms)으로, F1 약 470, F2 약 1638, F3 약 2413 Hz입니다.',
  },
  {
    name: 'ㅁ',
    kind: 'voiced',
    detail: ['비음', '여성'],
    formants: NASAL_FORMANTS,
    bandwidths: NASAL_BANDWIDTHS,
    zeros: [1100],
    basis: '초성 ㅁ과 같은 비음 웅얼거림(약 250 Hz 중심, 반포먼트 약 1.1 kHz)입니다.',
  },
  {
    name: 'ㅂ',
    kind: 'voiced',
    detail: ['아 → 막힘', '양순'],
    formants: [600, 1200],
    basis: "불파음이라 터짐이 없습니다. '아'가 입술로 막히기 직전처럼 F1을 낮추고 F2를 양순 위치(locus, 약 0.7~1.2 kHz) 쪽으로 낮췄습니다.",
  },
  {
    name: 'ㅇ',
    kind: 'voiced',
    detail: ['비음', '여성'],
    formants: NASAL_FORMANTS,
    bandwidths: NASAL_BANDWIDTHS,
    zeros: [3000],
    basis: '연구개 비음 [ŋ]의 웅얼거림입니다. 조음 위치가 뒤일수록 반포먼트가 높아져 약 3 kHz에 두었습니다.',
  },
];
