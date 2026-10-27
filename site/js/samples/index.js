// 샘플 패키지 진입점. 각 데이터 모듈을 화면에 쓰는 공통 형태로 바꿔 그룹별로 내보낸다.
// 샘플: { name, detail: [버튼 보조 문구 줄], basis: 근거 설명, frequencies: 코사인파 주파수 목록 }
import { INSTRUMENTS } from './instruments.js';
import { SPEAKERS, VOWEL_SAMPLES, SYLLABLE_VOWELS } from './vowels.js';
import { ONSETS, CODAS, ONSET_TIMING, CODA_TIMING } from './consonants.js';
import { harmonicSeries, formantSeries, noiseSeries } from './spectrum.js';
import { layoutSyllable, hangulSyllable } from './syllable.js';

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

// 숨소리: 뒤 모음 포먼트(F1·F2) ±150 Hz 대역마다 잡음 코사인파를 count개씩 넣는다.
const ASPIRATION_HALF_WIDTH = 150;
const aspirationBands = (formants, count) =>
  formants.map((center) => [center - ASPIRATION_HALF_WIDTH, center + ASPIRATION_HALF_WIDTH, count]);

const voicedSpectrum = (f0, spec, speaker) => formantSeries(f0, { ...spec, formants: withUpper(spec.formants, speaker) });

// 자음 샘플은 성인 여성 목소리를 기준으로 하고, 숨소리는 뒤 모음 '아'의 포먼트 근처에 둔다.
const voice = SPEAKERS[0];
const consonant = ({ name, kind, detail, basis, ...spec }) => {
  let frequencies;
  if (kind === 'noise') frequencies = noiseSeries([...spec.bands, ...aspirationBands(voice.formants.a, spec.aspiration ?? 0)]);
  else if (kind === 'same') frequencies = voicedSpectrum(voice.f0, { formants: voice.formants[spec.vowel] }, voice);
  else frequencies = voicedSpectrum(voice.f0, spec, voice);
  return { name, detail, basis, frequencies };
};

export const SAMPLE_GROUPS = [
  { name: '악기', samples: instruments },
  ...SPEAKERS.map(vowelGroup),
  { name: '초성', samples: ONSETS.map(consonant) },
  { name: '종성', samples: CODAS.map(consonant) },
];

// ── 음절 합성 ──
// 목소리·초성·중성·종성을 고르면 위 샘플들을 시간 순서로 이어 붙인 음절을 만든다.
// 길이·세기는 docs/korean-speech-sounds.md의 측정값과 추정값을 따른다.
export const SYLLABLE_OPTIONS = {
  speakers: SPEAKERS.map((speaker) => `${speaker.label} · ${speaker.f0} Hz`),
  onsets: ONSETS.map((onset) => onset.name),
  vowels: SYLLABLE_VOWELS.map((vowel) => vowel.name),
  codas: ['없음', ...CODAS.map((coda) => coda.name)],
};

const PITCH_FACTOR = { low: 0.89, high: 1.125 }; // 예사소리 뒤 110 Hz : 거센소리 뒤 139 Hz
const LEVEL = { vowel: 1, voiced: 0.5, noise: 0.6, aspiration: 0.3, closure: 0.7 };
const VOWEL_MS = { open: 280, closed: 200 };
const GLIDE_MS = 30;
const GLIDE_FADE_MS = 90;
const CODA_FADE_MS = 40;
const ASPIRATION_COUNT = 8;
const CLOSURE_F1_MAX = 600;

export function composeSyllable({ speaker: speakerIndex, onset: onsetIndex, vowel: vowelIndex, coda: codaIndex }) {
  const speaker = SPEAKERS[speakerIndex];
  const onset = ONSETS[onsetIndex];
  const onsetTiming = ONSET_TIMING[onset.name];
  const vowel = SYLLABLE_VOWELS[vowelIndex];
  const coda = codaIndex > 0 ? CODAS[codaIndex - 1] : null;
  const codaTiming = coda && CODA_TIMING[coda.name];

  const f0 = Math.round(speaker.f0 * (PITCH_FACTOR[onsetTiming.pitch] ?? 1));
  const firstVowel = speaker.formants[vowel.start ?? vowel.end];
  const lastVowel = speaker.formants[vowel.end];
  const phases = [];
  const add = (kind, label, ms, frequencies, extra) => phases.push({ kind, label, ms, frequencies, level: LEVEL[kind], ...extra });

  if (onsetTiming.noise) add('noise', `${onset.name} ${onset.detail[0]}`, onsetTiming.noise, noiseSeries(onset.bands), { fade: 4 });
  if (onsetTiming.aspiration) {
    add('aspiration', '숨소리', onsetTiming.aspiration, noiseSeries(aspirationBands(firstVowel, ASPIRATION_COUNT)), { fade: 4 });
  }
  if (onsetTiming.voiced) add('voiced', `${onset.name} ${onset.detail[0]}`, onsetTiming.voiced, voicedSpectrum(f0, onset, speaker));

  const vowelSpectrum = (formants) => voicedSpectrum(f0, { formants }, speaker);
  if (vowel.start) add('vowel', '활음', GLIDE_MS, vowelSpectrum(firstVowel));
  add('vowel', vowel.name, coda ? VOWEL_MS.closed : VOWEL_MS.open, vowelSpectrum(lastVowel), vowel.start ? { fade: GLIDE_FADE_MS } : {});

  if (codaTiming?.voiced) {
    add('voiced', `받침 ${coda.name} ${coda.detail[0]}`, codaTiming.voiced, voicedSpectrum(f0, coda, speaker), { fade: CODA_FADE_MS });
  }
  if (codaTiming?.closure) {
    // 막히는 쪽으로 F2(F3)가 옮겨 가고 F1은 낮아진다. 모음 F1이 이미 낮으면 그대로 둔다.
    const formants = [Math.min(lastVowel[0], CLOSURE_F1_MAX), ...coda.formants.slice(1)];
    add('closure', `받침 ${coda.name} 막힘`, codaTiming.closure, vowelSpectrum(formants), { fade: CODA_FADE_MS, cut: true });
  }

  return {
    text: hangulSyllable(onsetTiming.cho, vowel.jung, codaTiming?.jong ?? 0),
    f0,
    pitch: onsetTiming.pitch ?? null,
    ...layoutSyllable(phases),
  };
}
