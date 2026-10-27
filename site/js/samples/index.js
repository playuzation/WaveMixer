// 샘플 패키지 진입점. 각 데이터 모듈을 화면에 쓰는 공통 형태로 바꿔 그룹별로 내보낸다.
// 샘플: { name, detail: [버튼 보조 문구 줄], basis: 근거 설명, frequencies: 코사인파 주파수 목록 }
import { INSTRUMENTS } from './instruments.js';
import { SPEAKERS, VOWEL_SAMPLES } from './vowels.js';
import { ONSETS, CODAS } from './consonants.js';
import { harmonicSeries, formantSeries, noiseSeries } from './spectrum.js';

const instruments = INSTRUMENTS.map(({ name, pitch, f0, counts, basis }) => ({
  name,
  detail: [pitch, `${f0} Hz`],
  basis,
  frequencies: harmonicSeries(f0, counts),
}));

// 주어진 포먼트 위에 화자의 높은 공명(upper)을 이어 붙여 높은 배음이 지나치게 약해지지 않게 한다.
// 앞 공명과 겹치지 않도록 각 공명을 바로 아래 공명보다 최소 300 Hz 위에 둔다.
const withUpper = (formants, speaker) =>
  speaker.upper.reduce((result, center) => [...result, Math.max(center, result[result.length - 1] + 300)], formants);

const vowelGroup = (speaker) => ({
  name: `모음 · ${speaker.label}`,
  samples: VOWEL_SAMPLES.map(({ name, ipa, vowel, note }) => {
    const formants = speaker.formants[vowel];
    return {
      name,
      detail: [`[${ipa}]`, `${speaker.f0} Hz`],
      basis:
        (note ? `${note}. ` : '') +
        `성인 ${speaker.label}의 F1 ${formants[0]} Hz, F2 ${formants[1]} Hz 포먼트로 배음 세기를 정했습니다.`,
      frequencies: formantSeries(speaker.f0, { formants: withUpper(formants, speaker) }),
    };
  }),
});

// 자음은 성인 여성 목소리를 기준으로 하고, 숨소리는 뒤 모음 '아'의 포먼트 근처에 둔다.
const voice = SPEAKERS[0];
const ASPIRATION_HALF_WIDTH = 150;
const aspirationBands = (count) =>
  voice.formants.a.map((center) => [center - ASPIRATION_HALF_WIDTH, center + ASPIRATION_HALF_WIDTH, count]);

const consonant = ({ name, kind, detail, basis, ...spec }) => {
  let frequencies;
  if (kind === 'noise') frequencies = noiseSeries([...spec.bands, ...aspirationBands(spec.aspiration ?? 0)]);
  else if (kind === 'same') frequencies = formantSeries(voice.f0, { formants: withUpper(voice.formants[spec.vowel], voice) });
  else frequencies = formantSeries(voice.f0, { ...spec, formants: withUpper(spec.formants, voice) });
  return { name, detail, basis, frequencies };
};

export const SAMPLE_GROUPS = [
  { name: '악기', samples: instruments },
  ...SPEAKERS.map(vowelGroup),
  { name: '초성', samples: ONSETS.map(consonant) },
  { name: '종성', samples: CODAS.map(consonant) },
];
