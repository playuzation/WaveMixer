// 샘플 패키지 진입점. 각 데이터 모듈을 화면에 쓰는 공통 형태로 바꿔 그룹별로 내보낸다.
// 샘플: { name, detail: [버튼 보조 문구 줄], basis: 근거 설명, frequencies: 코사인파 주파수 목록 }
import { INSTRUMENTS } from './instruments.js';
import { SPEAKERS, VOWEL_SAMPLES, SYLLABLE_VOWELS, JAMO_VOWELS } from './vowels.js';
import { ONSETS, CODAS, ONSET_TIMING, CODA_TIMING, TENSE_ONSETS } from './consonants.js';
import { harmonicSeries, formantSeries, noiseSeries } from './spectrum.js';
import { layoutPhases, hangulSyllable } from './syllable.js';

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

// ── 음절·문장 합성 ──
// 위 샘플들을 시간 순서로 이어 붙여 음절과 문장을 만든다.
// 길이·세기는 docs/korean-speech-sounds.md의 측정값과 추정값을 따른다.
export const SYLLABLE_OPTIONS = {
  speakers: SPEAKERS.map((speaker) => `${speaker.label} · ${speaker.f0} Hz`),
  onsets: ONSETS.map((onset) => onset.name),
  vowels: SYLLABLE_VOWELS.map((vowel) => vowel.name),
  codas: ['없음', ...CODAS.map((coda) => coda.name)],
};

const PITCH_FACTOR = { low: 0.89, high: 1.125 }; // 예사소리 뒤 110 Hz : 거센소리 뒤 139 Hz
const LEVEL = { vowel: 1, voiced: 0.5, noise: 0.6, aspiration: 0.3, closure: 0.7 };
const ASPIRATION_COUNT = 8;
const CLOSURE_F1_MAX = 600;
// 구간 길이(ms). 음절 탭은 낱말 하나를 또박또박, 문장은 이어 말하는 빠르기다. coda: 받침 길이 배율
const SYLLABLE_TIMING = { vowel: { open: 280, closed: 200 }, glide: 30, glideFade: 90, codaFade: 40, coda: 1 };
const SENTENCE_TIMING = { vowel: { open: 140, closed: 110 }, glide: 25, glideFade: 50, codaFade: 30, coda: 0.7 };
// 문장에서 모음 뒤 파열음·파찰음 앞의 막힘(무음) 길이(ms)와, 강세구 안의 약해진 ㅎ 길이(ms)
const STOP_GAP_MS = { lenis: 40, aspirated: 70, tense: 90 };
const LENIS = new Set([...'ㄱㄷㅂㅈ']);
const STOPS = new Set([...'ㄱㄷㅂㅈㅊㅋㅌㅍㄲㄸㅃㅉ']);
const MEDIAL_H_MS = 40;

// 초성 이름 → { sample, timing }. 된소리는 같은 자리 예사소리 샘플의 잡음 대역을 옮겨 쓴다.
function onsetSound(name) {
  const tense = TENSE_ONSETS[name];
  const sample = ONSETS.find((onset) => onset.name === (tense?.base ?? name));
  if (!tense) return { sample, timing: ONSET_TIMING[name] };
  const shift = tense.shift ?? 0;
  const bands = sample.bands.map(([low, high, count]) => [low + shift, high + shift, count]);
  return { sample: { ...sample, name, bands }, timing: tense };
}

// 한 음절의 소리 구간 목록. vowel: { name, start?, end }(모음 키), codaName: 받침 이름 또는 null
// - f0End가 있으면 모음 뒤쪽 절반을 그 높이로 옮긴다(문장 끝 억양).
// - medial: 강세구 안(모음·유성음 뒤)의 초성. 예사소리는 유성음이 되어 숨소리가 없고 ㅎ은 약해진다.
function syllablePhases(speaker, onsetName, vowel, codaName, { f0, f0End, timing, length = 1, medial = false }) {
  const { sample: onset, timing: onsetTiming } = onsetSound(onsetName);
  const coda = codaName ? CODAS.find((item) => item.name === codaName) : null;
  const codaTiming = coda && CODA_TIMING[coda.name];
  const firstVowel = speaker.formants[vowel.start ?? vowel.end];
  const lastVowel = speaker.formants[vowel.end];
  const phases = [];
  const add = (kind, label, ms, frequencies, extra) => phases.push({ kind, label, ms, frequencies, level: LEVEL[kind], ...extra });

  let aspiration = onsetTiming.aspiration;
  if (medial && LENIS.has(onsetName)) aspiration = 0;
  if (medial && onsetName === 'ㅎ') aspiration = MEDIAL_H_MS;

  if (onsetTiming.noise) add('noise', `${onset.name} ${onset.detail[0]}`, onsetTiming.noise, noiseSeries(onset.bands), { fade: 4 });
  if (aspiration) {
    add('aspiration', '숨소리', aspiration, noiseSeries(aspirationBands(firstVowel, ASPIRATION_COUNT)), { fade: 4 });
  }
  if (onsetTiming.voiced) add('voiced', `${onset.name} ${onset.detail[0]}`, onsetTiming.voiced, voicedSpectrum(f0, onset, speaker));

  const vowelSpectrum = (formants, pitch = f0) => voicedSpectrum(pitch, { formants }, speaker);
  if (vowel.start) add('vowel', '활음', timing.glide, vowelSpectrum(firstVowel));
  const vowelMs = (coda ? timing.vowel.closed : timing.vowel.open) * length;
  const glideFade = vowel.start ? { fade: timing.glideFade } : {};
  if (f0End) {
    add('vowel', vowel.name, vowelMs / 2, vowelSpectrum(lastVowel), glideFade);
    add('vowel', vowel.name, vowelMs / 2, vowelSpectrum(lastVowel, f0End), { fade: vowelMs / 2 });
  } else {
    add('vowel', vowel.name, vowelMs, vowelSpectrum(lastVowel), glideFade);
  }

  const codaF0 = f0End ?? f0;
  if (codaTiming?.voiced) {
    const label = `받침 ${coda.name} ${coda.detail[0]}`;
    add('voiced', label, codaTiming.voiced * timing.coda, voicedSpectrum(codaF0, coda, speaker), { fade: timing.codaFade });
  }
  if (codaTiming?.closure) {
    // 막히는 쪽으로 F2(F3)가 옮겨 가고 F1은 낮아진다. 모음 F1이 이미 낮으면 그대로 둔다.
    const formants = [Math.min(lastVowel[0], CLOSURE_F1_MAX), ...coda.formants.slice(1)];
    const label = `받침 ${coda.name} 막힘`;
    add('closure', label, codaTiming.closure * timing.coda, vowelSpectrum(formants, codaF0), { fade: timing.codaFade, cut: true });
  }
  return phases;
}

export function composeSyllable({ speaker: speakerIndex, onset: onsetIndex, vowel: vowelIndex, coda: codaIndex }) {
  const speaker = SPEAKERS[speakerIndex];
  const onset = ONSETS[onsetIndex];
  const onsetTiming = ONSET_TIMING[onset.name];
  const vowel = SYLLABLE_VOWELS[vowelIndex];
  const coda = codaIndex > 0 ? CODAS[codaIndex - 1] : null;

  const f0 = Math.round(speaker.f0 * (PITCH_FACTOR[onsetTiming.pitch] ?? 1));
  const phases = syllablePhases(speaker, onset.name, vowel, coda?.name, { f0, timing: SYLLABLE_TIMING });
  return {
    text: hangulSyllable(onsetTiming.cho, vowel.jung, coda ? CODA_TIMING[coda.name].jong : 0),
    f0,
    pitch: onsetTiming.pitch ?? null,
    ...layoutPhases(phases),
  };
}

// 문장 합성. units: speech 패키지의 음절({ cho, jung, jong, sound, pitch, pitchEnd?, length, phraseInitial })과
// 쉼({ pause: ms }) 목록. 높이·길이는 목소리 기준값에 곱하는 비율이다.
// 결과: { duration, segments, spans: 음절별 [{ label, kind, start, end }], f0Range: [최저, 최고] Hz }
export function composeSentence(speakerIndex, units) {
  const speaker = SPEAKERS[speakerIndex];
  const phases = [];
  const owners = [];
  const push = (owner, list) =>
    list.forEach((phase) => {
      phases.push(phase);
      owners.push(owner);
    });
  const pitches = [];
  let afterSound = false;

  units.forEach((unit, index) => {
    if (unit.pause) {
      push(-1, [{ kind: 'pause', label: '쉼', ms: unit.pause, frequencies: [] }]);
      afterSound = false;
      return;
    }
    if (afterSound && STOPS.has(unit.cho)) {
      const type = TENSE_ONSETS[unit.cho] ? 'tense' : LENIS.has(unit.cho) ? 'lenis' : 'aspirated';
      push(index, [{ kind: 'pause', label: '막힘', ms: STOP_GAP_MS[type], frequencies: [], abrupt: true }]);
    }
    const f0 = Math.round(speaker.f0 * unit.pitch);
    const f0End = unit.pitchEnd && Math.round(speaker.f0 * unit.pitchEnd);
    pitches.push(f0, f0End || f0);
    const vowel = { name: unit.sound, ...JAMO_VOWELS[unit.jung] };
    const options = { f0, f0End, timing: SENTENCE_TIMING, length: unit.length, medial: !unit.phraseInitial };
    push(index, syllablePhases(speaker, unit.cho, vowel, unit.jong || null, options));
    afterSound = true;
  });

  const { duration, phases: placed, segments } = layoutPhases(phases);
  const spans = [];
  placed.forEach((phase, i) => {
    const owner = owners[i];
    if (owner < 0) return;
    const span = spans.find((item) => item.owner === owner);
    if (span) span.end = phase.end;
    else spans.push({ owner, label: units[owner].sound, kind: 'syllable', start: phase.start, end: phase.end });
  });
  return {
    duration,
    segments,
    spans: spans.map(({ label, kind, start, end }) => ({ label, kind, start, end })),
    f0Range: [Math.min(...pitches), Math.max(...pitches)],
  };
}
