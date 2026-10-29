// 페이지 진입점. 상태(state)·계산(synth)·샘플(samples)·말하기(speech)·분석(analysis)·소리(audio)·화면(view) 모듈을 조립한다.
// 하위 모듈끼리는 서로 import하지 않는다(main → 각 모듈의 트리 구조).
import { createHistory } from './state/history.js';
import {
  addWave,
  createWaves,
  removeWave,
  parseFrequency,
  parseAmplitude,
  MIN_FREQUENCY,
  MAX_FREQUENCY,
  MIN_AMPLITUDE,
  MAX_AMPLITUDE,
} from './state/waves.js';
import { fundamentalOf, mixAt, retune } from './synth/mixer.js';
import { NOTES } from './synth/notes.js';
import { ARTICULATIONS, articulate } from './synth/articulation.js';
import { renderSound } from './synth/render.js';
import { renderPartials } from './synth/partials.js';
import { SAMPLE_GROUPS, SYLLABLE_OPTIONS, composeSyllable, composeSentence } from './samples/index.js';
import { SENTENCES, planSentence } from './speech/index.js';
import {
  MAX_SECONDS,
  SEGMENT_SECONDS,
  analyzeSegment,
  analyzeFrames,
  loudestStart,
  spectralDistance,
} from './analysis/index.js';
import * as player from './audio/player.js';
import { drawScope } from './view/scope.js';
import { createWaveList } from './view/waveList.js';
import { createNotePad } from './view/notePad.js';
import { createSamplePicker } from './view/samplePicker.js';
import { createTabs } from './view/tabs.js';
import { createChoiceRow } from './view/choiceRow.js';
import { renderTimeline } from './view/timeline.js';
import { drawOverview } from './view/overview.js';
import { drawSpectrum } from './view/spectrumView.js';

const SHOWN_PERIODS = 2;
const NOTE_SECONDS = 2;
const SPEECH_SAMPLE_RATE = 44100;
// 음계·음절·문장 재생에는 잔향을 건다(머리글의 잔향 스위치로 끔). 합성음 재생은 순수한 코사인 합으로 둔다.
const ROOM = { room: true };

const $ = (id) => document.getElementById(id);
const form = $('wave-form');
const input = $('frequency');
const amplitudeInput = $('amplitude');
const error = $('frequency-error');
const undoButton = $('undo');
const redoButton = $('redo');
const mixButton = $('mix-toggle');
const canvas = $('scope');
const noteFixedToggle = $('note-fixed');

const history = createHistory([]);
let mixPlaying = false;
let articulation = 0;

const frequencies = () => history.present.map((wave) => wave.frequency);

const renderList = createWaveList($('wave-list'), (id) => commit(removeWave(history.present, id)));
const notePad = createNotePad($('notes'), NOTES, {
  onPress(note, duration) {
    setMixPlaying(false);
    const waves = retune(history.present, note.frequency);
    const { name, vibrato } = ARTICULATIONS[articulation];
    player.play(articulate(waves, name, note.frequency), duration, vibrato, ROOM);
  },
  onRelease() {
    player.stop();
  },
});

// 음계로 들을 때의 울림. 목록(실행 취소 대상)이 아니라 듣는 방식이라 따로 둔다.
const articulationRow = createChoiceRow(
  $('articulation'),
  ARTICULATIONS.map((item) => item.name),
  articulation,
  (index) => setArticulation(index),
);

function setArticulation(index) {
  articulation = index;
  articulationRow.select(index);
  $('articulation-hint').textContent = ARTICULATIONS[index].detail;
}

// 샘플을 고르면 목록 전체를 그 샘플의 코사인파로 바꾼다(실행 취소 한 번으로 되돌릴 수 있음).
// 악기 샘플은 그 악기의 울림도 함께 고른다.
createSamplePicker({ tabs: $('sample-groups'), grid: $('sample-buttons') }, SAMPLE_GROUPS, (sample) => {
  $('sample-hint').textContent = `${sample.name} (${sample.detail.join(', ')}): ${sample.basis}`;
  if (sample.articulation) setArticulation(ARTICULATIONS.findIndex((item) => item.name === sample.articulation));
  commit(createWaves(sample.components));
});

function commit(waves) {
  history.push(waves);
  render();
}

function undo() {
  history.undo();
  render();
}

function redo() {
  history.redo();
  render();
}

function setMixPlaying(playing) {
  mixPlaying = playing;
  mixButton.setAttribute('aria-pressed', String(playing));
  mixButton.textContent = playing ? '합성음 정지' : '합성음 재생';
}

// 음계 버튼 재생 방식: 누르는 동안 재생 ↔ 누르는 길이와 무관하게 NOTE_SECONDS초 재생
function updateNoteMode() {
  const fixed = noteFixedToggle.checked;
  notePad.setDuration(fixed ? NOTE_SECONDS : null);
  $('notes-hint').textContent = fixed
    ? `길게 누르든 짧게 누르든 합성 파형의 한 주기가 해당 음 높이로 ${NOTE_SECONDS}초 동안 반복되어 소리 납니다.`
    : '누르고 있는 동안 합성 파형의 한 주기가 해당 음 높이로 반복되어 소리 납니다.';
}

function formatPeriod(seconds) {
  return seconds >= 1 ? `${+seconds.toFixed(3)} s` : `${+(seconds * 1000).toPrecision(3)} ms`;
}

function drawWave() {
  const list = frequencies();
  if (!list.length) {
    drawScope(canvas, null);
    return;
  }
  const duration = SHOWN_PERIODS / fundamentalOf(list);
  drawScope(canvas, (t) => mixAt(history.present, t), {
    duration,
    cycles: Math.max(...list) * duration,
    divisions: SHOWN_PERIODS,
  });
}

function render() {
  const list = frequencies();
  const hasWaves = list.length > 0;

  renderList(history.present);
  $('wave-count').textContent = `${list.length}개의 파동`;
  $('list-empty').hidden = hasWaves;
  $('scope-empty').hidden = hasWaves;
  undoButton.disabled = !history.canUndo;
  redoButton.disabled = !history.canRedo;
  mixButton.disabled = !hasWaves;
  notePad.setEnabled(hasWaves);

  if (hasWaves) {
    const fundamental = fundamentalOf(list);
    // 같은 배음이 여러 개면 "번호(×개수)"로 묶어 보여준다.
    const counts = new Map();
    for (const frequency of list) {
      const harmonic = frequency / fundamental;
      counts.set(harmonic, (counts.get(harmonic) ?? 0) + 1);
    }
    const harmonics = [...counts].map(([harmonic, count]) => (count > 1 ? `${harmonic}(×${count})` : harmonic)).join(', ');
    $('scope-info').textContent =
      `기본 주파수 ${fundamental} Hz (주파수들의 최대공약수) · 한 주기 ${formatPeriod(1 / fundamental)} · ` +
      `${SHOWN_PERIODS}주기 표시 · 배음 ${harmonics}`;
  } else {
    $('scope-info').textContent = '';
  }

  if (mixPlaying) {
    if (hasWaves) player.play(history.present);
    else {
      player.stop();
      setMixPlaying(false);
    }
  }
  drawWave();
}

// field: 잘못 입력된 칸(없으면 오류 표시를 지운다)
function showError(message, field) {
  error.textContent = message;
  error.hidden = !message;
  for (const element of [input, amplitudeInput]) {
    if (element === field) element.setAttribute('aria-invalid', 'true');
    else element.removeAttribute('aria-invalid');
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const frequency = parseFrequency(input.value);
  const amplitude = parseAmplitude(amplitudeInput.value);
  const invalid =
    frequency === null
      ? [input, `${MIN_FREQUENCY} ~ ${MAX_FREQUENCY} 사이의 자연수를 입력하세요.`]
      : amplitude === null && [amplitudeInput, `진폭은 ${MIN_AMPLITUDE} ~ ${MAX_AMPLITUDE} 사이의 수를 입력하세요.`];
  if (invalid) {
    const [field, message] = invalid;
    showError(message, field);
    field.select();
    field.focus();
    return;
  }
  showError('');
  input.value = '';
  amplitudeInput.value = '';
  input.focus();
  commit(addWave(history.present, frequency, amplitude));
});

input.addEventListener('input', () => showError(''));
amplitudeInput.addEventListener('input', () => showError(''));
noteFixedToggle.addEventListener('change', updateNoteMode);
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

mixButton.addEventListener('click', () => {
  if (mixPlaying) player.stop();
  else player.play(history.present);
  setMixPlaying(!mixPlaying);
});

// Ctrl/Cmd+Z: 실행 취소, Ctrl/Cmd+Shift+Z 또는 Ctrl+Y: 다시 실행.
// 입력창에 글자가 있을 때는 브라우저 기본 텍스트 undo를 그대로 둔다.
document.addEventListener('keydown', (event) => {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
  if ((event.target === input || event.target === amplitudeInput) && event.target.value) return;
  const key = event.key.toLowerCase();
  if (key === 'z' && !event.shiftKey) {
    event.preventDefault();
    undo();
  } else if ((key === 'z' && event.shiftKey) || key === 'y') {
    event.preventDefault();
    redo();
  }
});

const reverbToggle = $('reverb');
reverbToggle.addEventListener('change', () => player.setReverb(reverbToggle.checked));
player.setReverb(reverbToggle.checked);

for (const type of ['pointerup', 'keydown']) {
  document.addEventListener(type, player.unlock, { once: true });
}

// ── 음절 만들기 탭 ──
// 고른 목소리·초성·중성·종성으로 음절을 합성하고, 파형·구간을 그린 뒤 들려준다.
const syllableCanvas = $('syllable-scope');
const syllableChoice = {
  speaker: 0,
  onset: SYLLABLE_OPTIONS.onsets.indexOf('ㅇ'),
  vowel: 0,
  coda: 0,
};
let syllable = null;
let syllableSound = null;

const PITCH_NOTE = { low: '예사소리 뒤라 낮아짐', high: '거센소리 뒤라 높아짐' };

function updateSyllable(play) {
  syllable = composeSyllable(syllableChoice);
  syllableSound = renderSound(syllable, SPEECH_SAMPLE_RATE);
  $('syllable-text').textContent = syllable.text;
  renderTimeline($('syllable-timeline'), syllable.phases, syllable.duration);
  const pitch = PITCH_NOTE[syllable.pitch] ? ` (${PITCH_NOTE[syllable.pitch]})` : '';
  $('syllable-info').textContent = `목소리 높이 ${syllable.f0} Hz${pitch} · 길이 ${Math.round(syllable.duration * 1000)} ms`;
  drawSyllable();
  if (play) player.playBuffer(syllableSound, SPEECH_SAMPLE_RATE, ROOM);
}

// 미리 계산한 소리(진폭 배열) 전체를 캔버스에 그린다.
function drawSound(target, sound, duration) {
  const last = sound.length - 1;
  drawScope(target, (t) => sound[Math.min(last, Math.round(t * SPEECH_SAMPLE_RATE))], { duration, cycles: sound.length });
}

function drawSyllable() {
  if (syllableSound) drawSound(syllableCanvas, syllableSound, syllable.duration);
}

for (const key of ['speaker', 'onset', 'vowel', 'coda']) {
  createChoiceRow($(`choice-${key}`), SYLLABLE_OPTIONS[`${key}s`], syllableChoice[key], (index) => {
    syllableChoice[key] = index;
    updateSyllable(true);
  });
}
$('syllable-play').addEventListener('click', () => player.playBuffer(syllableSound, SPEECH_SAMPLE_RATE, ROOM));

// ── 문장 말하기 탭 ──
// 문장을 발음 규칙·억양을 적용한 음절 목록으로 바꾸고(speech), 음절 소리를 이어 합성해(samples) 들려준다.
const sentenceCanvas = $('sentence-scope');
const sentenceInput = $('sentence-input');
const sentenceError = $('sentence-error');
let sentenceSpeaker = 0;
let sentence = null;
let sentenceSound = null;

function showSentenceError(message) {
  sentenceError.textContent = message;
  sentenceError.hidden = !message;
  if (message) sentenceInput.setAttribute('aria-invalid', 'true');
  else sentenceInput.removeAttribute('aria-invalid');
}

function speakSentence(text) {
  const plan = planSentence(text);
  if (!plan.units.length) {
    showSentenceError(text.trim() ? '읽을 수 있는 한글이 없습니다. 한글 문장을 입력하세요.' : '문장을 입력하세요.');
    return;
  }
  showSentenceError('');
  sentence = { text: text.trim(), ...composeSentence(sentenceSpeaker, plan.units) };
  sentenceSound = renderSound(sentence, SPEECH_SAMPLE_RATE);

  $('sentence-text').textContent = sentence.text;
  $('sentence-pronunciation').textContent =
    `발음 [${plan.pronunciation}]` + (plan.skipped ? ` · 읽지 않은 글자: ${plan.skipped}` : '');
  renderTimeline($('sentence-timeline'), sentence.spans, sentence.duration);
  const [low, high] = sentence.f0Range;
  $('sentence-info').textContent =
    `목소리 높이 ${low}~${high} Hz · 길이 ${sentence.duration.toFixed(2)} s · ${sentence.spans.length}음절`;
  $('sentence-empty').hidden = true;
  $('sentence-play').disabled = false;
  drawSentence();
  player.playBuffer(sentenceSound, SPEECH_SAMPLE_RATE, ROOM);
}

function drawSentence() {
  if (sentenceSound) drawSound(sentenceCanvas, sentenceSound, sentence.duration);
}

createChoiceRow($('sentence-speaker'), SYLLABLE_OPTIONS.speakers, sentenceSpeaker, (index) => {
  sentenceSpeaker = index;
  if (sentence) speakSentence(sentence.text);
});
const sentenceSamples = createChoiceRow($('sentence-samples'), SENTENCES, -1, (index) => {
  sentenceInput.value = SENTENCES[index];
  speakSentence(SENTENCES[index]);
});
sentenceInput.addEventListener('input', () => {
  showSentenceError('');
  sentenceSamples.select(SENTENCES.indexOf(sentenceInput.value));
});
$('sentence-form').addEventListener('submit', (event) => {
  event.preventDefault();
  speakSentence(sentenceInput.value);
});
$('sentence-play').addEventListener('click', () => player.playBuffer(sentenceSound, SPEECH_SAMPLE_RATE, ROOM));

// ── 소리 닮기 탭 ──
// 고른 소리 파일(처음 MAX_SECONDS초)의 한 구간을 코사인파 목록으로, 파일 전체를 시간에 따라 바뀌는 코사인파로 닮게 만든다.
const MATCH_COUNTS = [8, 16, 32, 64];
const COMPARE_SECONDS = 1;
const matchCanvases = [$('match-overview'), $('match-spectrum'), $('match-resynth-overview')];
const matchPosition = $('match-position');
let matchCount = 2;
let source = null; // { name, samples, sampleRate, total }
let match = null; // analyzeSegment 결과
let resynthesis = null;
let busy = false;
let fileJob = 0;
let wholeJob = 0;

const matchStart = () => Number(matchPosition.value);
const seconds = (value) => `${value.toFixed(2)}초`;

function showMatchError(message) {
  $('match-error').textContent = message;
  $('match-error').hidden = !message;
}

function updateMatchButtons() {
  const found = Boolean(match?.components.length);
  $('match-play-segment').disabled = !source;
  $('match-play-cosines').disabled = !found;
  $('match-send').disabled = !found;
  $('match-resynth').disabled = !source || busy;
  $('match-play-file').disabled = !source;
  $('match-play-resynth').disabled = !resynthesis;
}

function drawMatch() {
  const start = matchStart();
  drawOverview(matchCanvases[0], source?.samples, source?.sampleRate, [start, start + SEGMENT_SECONDS]);
  const top = Math.max(0, ...(match?.components ?? []).map((item) => item.frequency));
  const maxFrequency = source ? Math.min(source.sampleRate / 2, Math.max(1000, top * 1.2)) : 1;
  drawSpectrum(matchCanvases[1], match?.spectrum, match?.components ?? [], maxFrequency);
  drawOverview(matchCanvases[2], resynthesis, source?.sampleRate);
}

function updateMatchSegment() {
  const start = matchStart();
  match = analyzeSegment(source.samples, source.sampleRate, start, MATCH_COUNTS[matchCount]);
  const { periodic, f0, fundamental, components, captured } = match;
  const length = source.samples.length / source.sampleRate;
  $('match-file-info').textContent =
    `${source.name} · ${seconds(source.total)}` +
    (source.total > length ? ` 중 처음 ${MAX_SECONDS}초` : '') +
    ` · 고른 구간 ${seconds(start)} ~ ${seconds(Math.min(length, start + SEGMENT_SECONDS))}`;
  const summary = `코사인파 ${components.length}개 · 구간 에너지의 ${Math.round(captured * 100)} %를 담음`;
  const common = fundamentalOf(components.map((item) => item.frequency));
  if (!components.length) $('match-segment-info').textContent = '소리가 거의 없는 구간입니다. 구간 위치를 옮겨 보세요.';
  else if (periodic) {
    $('match-segment-info').textContent =
      `반복되는 소리: 기본 주파수 ${f0.toFixed(1)} Hz를 ${fundamental} Hz로 맞춘 배음 · ${summary}`;
  } else {
    $('match-segment-info').textContent =
      `반복되지 않는 소리: 스펙트럼 봉우리를 자연수 Hz로 반올림 · ${summary}` +
      (common < 20 ? ` · 최대공약수가 ${common} Hz라 「음계로 듣기」에서는 소리가 나지 않을 수 있습니다` : '');
  }
  updateMatchButtons();
  drawMatch();
}

function resetWhole(message) {
  wholeJob++;
  busy = false;
  resynthesis = null;
  $('match-whole-info').textContent = message;
  updateMatchButtons();
  drawMatch();
}

$('match-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const job = ++fileJob;
  showMatchError('');
  $('match-file-info').textContent = `${file.name} 읽는 중…`;
  let decoded;
  try {
    decoded = await player.decode(await file.arrayBuffer());
  } catch {
    if (job !== fileJob) return;
    $('match-file-info').textContent = '';
    showMatchError('소리 파일을 읽지 못했습니다. MP3·WAV처럼 브라우저가 재생할 수 있는 파일인지 확인하세요.');
    return;
  }
  if (job !== fileJob) return;
  if (!decoded.samples.length) {
    $('match-file-info').textContent = '';
    showMatchError('소리가 들어 있지 않은 파일입니다.');
    return;
  }
  player.stop();
  const { sampleRate } = decoded;
  const samples = decoded.samples.slice(0, Math.round(MAX_SECONDS * sampleRate));
  source = { name: file.name, samples, sampleRate, total: decoded.samples.length / sampleRate };
  matchPosition.max = Math.max(0, samples.length / sampleRate - SEGMENT_SECONDS).toFixed(2);
  matchPosition.value = loudestStart(samples, sampleRate).toFixed(2);
  matchPosition.disabled = false;
  $('match-empty').hidden = true;
  resetWhole('「다시 합성」을 누르면 파일 전체를 바뀌는 코사인파로 다시 만듭니다.');
  updateMatchSegment();
});

let segmentFrame = 0;
matchPosition.addEventListener('input', () => {
  cancelAnimationFrame(segmentFrame);
  segmentFrame = requestAnimationFrame(updateMatchSegment);
});

createChoiceRow($('match-count'), MATCH_COUNTS.map((count) => `${count}개`), matchCount, (index) => {
  matchCount = index;
  if (!source) return;
  resetWhole('개수를 바꿨습니다. 「다시 합성」을 누르면 이 개수로 다시 만듭니다.');
  updateMatchSegment();
});

$('match-play-segment').addEventListener('click', () => {
  const from = Math.round(matchStart() * source.sampleRate);
  player.playBuffer(source.samples.subarray(from, from + COMPARE_SECONDS * source.sampleRate), source.sampleRate);
});
// 고른 코사인파를 원음과 같은 세기로 COMPARE_SECONDS초 동안 낸다(앞뒤 20 ms는 서서히).
$('match-play-cosines').addEventListener('click', () => {
  const components = match.components.map(({ frequency, amplitude }) => ({ frequency, amplitude: amplitude * match.reference }));
  const hop = 0.02;
  const frames = Array.from({ length: Math.round(COMPARE_SECONDS / hop) - 1 }, () => ({ components }));
  const length = Math.round(COMPARE_SECONDS * source.sampleRate);
  player.playBuffer(renderPartials({ start: hop, hop, frames }, length, source.sampleRate), source.sampleRate);
});
$('match-send').addEventListener('click', () => {
  const start = matchStart();
  commit(createWaves(match.components));
  $('sample-hint').textContent =
    `소리 닮기: ${source.name}의 ${seconds(start)} 구간을 코사인파 ${match.components.length}개로 바꿨습니다.`;
  $('tab-wave').click();
});
$('match-play-file').addEventListener('click', () => player.playBuffer(source.samples, source.sampleRate));
$('match-play-resynth').addEventListener('click', () => player.playBuffer(resynthesis, source.sampleRate));

$('match-resynth').addEventListener('click', async () => {
  resetWhole('분석 중… 0 %');
  const job = wholeJob;
  const current = source;
  busy = true;
  updateMatchButtons();
  const count = MATCH_COUNTS[matchCount];
  const track = await analyzeFrames(current.samples, current.sampleRate, count, (progress) => {
    if (job === wholeJob) $('match-whole-info').textContent = `분석 중… ${Math.round(progress * 100)} %`;
  });
  if (job !== wholeJob) return;
  busy = false;
  resynthesis = renderPartials(track, current.samples.length, current.sampleRate);
  const distance = spectralDistance(current.samples, resynthesis, current.sampleRate);
  const average = track.frames.reduce((sum, frame) => sum + frame.components.length, 0) / track.frames.length;
  $('match-whole-info').textContent =
    `${track.frames.length}개 프레임(10 ms 간격) · 프레임마다 코사인파 평균 ${average.toFixed(1)}개(최대 ${count}개) · ` +
    `원음과 스펙트럼 차이 ${Math.round(distance * 100)} %`;
  updateMatchButtons();
  drawMatch();
});

// 탭을 바꾸면 재생 중인 소리를 멈춘다.
createTabs($('tab-wave').parentElement, () => {
  player.stop();
  setMixPlaying(false);
});

new ResizeObserver(drawWave).observe(canvas);
new ResizeObserver(drawSyllable).observe(syllableCanvas);
new ResizeObserver(drawSentence).observe(sentenceCanvas);
matchCanvases.forEach((element) => new ResizeObserver(drawMatch).observe(element));
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  drawWave();
  drawSyllable();
  drawSentence();
  drawMatch();
});

$('frequency-help').textContent =
  `주파수는 ${MIN_FREQUENCY} ~ ${MAX_FREQUENCY} 사이의 자연수, 진폭은 ${MIN_AMPLITUDE} ~ ${MAX_AMPLITUDE} 사이의 배율(비우면 1)을 ` +
  '입력하고 Enter 또는 추가를 누르세요.';
updateNoteMode();
setArticulation(articulation);
render();
updateSyllable(false);
