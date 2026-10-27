// 한국어 모음 샘플(성인 여성·남성). 근거와 추정 여부는 docs/korean-speech-sounds.md 참고.
// formants: 모음별 [F1, F2] (Hz). 한국어 성별 F3 자료를 찾지 못해,
// upper에 성도를 균일한 관(여성 약 14.6 cm, 남성 약 17.5 cm)으로 본 3·4번째 공명을 둔다.
// 에/애는 현대 서울말에서 합쳐져 '에' 하나로 둔다.
export const SPEAKERS = [
  {
    label: '여성',
    f0: 217,
    upper: [3000, 4200],
    formants: {
      a: [945, 1582],
      eo: [500, 1369],
      o: [350, 700],
      u: [350, 810],
      eu: [350, 1989],
      i: [273, 2864],
      e: [500, 2436],
    },
  },
  {
    label: '남성',
    f0: 121,
    upper: [2500, 3500],
    formants: {
      a: [788, 1407],
      eo: [560, 1045],
      o: [356, 795],
      u: [280, 858],
      eu: [334, 1518],
      i: [259, 2066],
      e: [490, 1828],
    },
  },
];

// 화면에 보일 순서. 이중모음은 활음에서 시작해 모음으로 움직이므로 시작·끝 두 샘플로 나눈다.
// 한국어 활음의 시작점 측정값을 찾지 못해 [j]는 '이', [w]는 '우'의 포먼트로 근사한다.
const J_START = "활음 [j]는 '이'에 가까운 자리에서 시작합니다(한국어 [j]는 '이'보다 조금 뒤쪽)";
const W_START = "활음 [w]는 '우'에 가까운 자리에서 시작합니다(한국어 [w]는 뒤 모음 쪽으로 많이 끌려감)";

export const VOWEL_SAMPLES = [
  { name: '아', ipa: 'a', vowel: 'a' },
  { name: '야 시작', ipa: 'j', vowel: 'i', note: J_START },
  { name: '야 끝', ipa: 'a', vowel: 'a', note: "끝은 목표 모음 '아'입니다" },
  { name: '어', ipa: 'ʌ', vowel: 'eo' },
  { name: '여 시작', ipa: 'j', vowel: 'i', note: J_START },
  { name: '여 끝', ipa: 'ʌ', vowel: 'eo', note: "끝은 목표 모음 '어'입니다" },
  { name: '오', ipa: 'o', vowel: 'o' },
  { name: '요 시작', ipa: 'j', vowel: 'i', note: J_START },
  { name: '요 끝', ipa: 'o', vowel: 'o', note: "끝은 목표 모음 '오'입니다" },
  { name: '우', ipa: 'u', vowel: 'u' },
  { name: '유 시작', ipa: 'j', vowel: 'i', note: J_START },
  { name: '유 끝', ipa: 'u', vowel: 'u', note: "끝은 목표 모음 '우'입니다" },
  { name: '으', ipa: 'ɨ', vowel: 'eu' },
  { name: '이', ipa: 'i', vowel: 'i' },
  { name: '에', ipa: 'e', vowel: 'e' },
  { name: '왜 시작', ipa: 'w', vowel: 'u', note: W_START },
  { name: '왜 끝', ipa: 'e', vowel: 'e', note: "끝은 목표 모음 '애'로, 현대 서울말에서 '에'와 같습니다" },
];
