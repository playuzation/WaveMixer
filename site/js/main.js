// 페이지 진입점. 상태(state)·계산(synth)·샘플(samples)·소리(audio)·화면(view) 모듈을 조립한다.
// 하위 모듈끼리는 서로 import하지 않는다(main → 각 모듈의 트리 구조).
import { createHistory } from './state/history.js';
import { addWave, createWaves, removeWave, parseFrequency, MIN_FREQUENCY, MAX_FREQUENCY } from './state/waves.js';
import { fundamentalOf, mixAt, retune } from './synth/mixer.js';
import { NOTES } from './synth/notes.js';
import { renderSegments } from './synth/render.js';
import { SAMPLE_GROUPS, SYLLABLE_OPTIONS, composeSyllable } from './samples/index.js';
import * as player from './audio/player.js';
import { drawScope } from './view/scope.js';
import { createWaveList } from './view/waveList.js';
import { createNotePad } from './view/notePad.js';
import { createSamplePicker } from './view/samplePicker.js';
import { createTabs } from './view/tabs.js';
import { createChoiceRow } from './view/choiceRow.js';
import { renderTimeline } from './view/timeline.js';

const SHOWN_PERIODS = 2;
const NOTE_SECONDS = 2;
const SYLLABLE_SAMPLE_RATE = 44100;

const $ = (id) => document.getElementById(id);
const form = $('wave-form');
const input = $('frequency');
const error = $('frequency-error');
const undoButton = $('undo');
const redoButton = $('redo');
const mixButton = $('mix-toggle');
const canvas = $('scope');
const noteFixedToggle = $('note-fixed');

const history = createHistory([]);
let mixPlaying = false;

const frequencies = () => history.present.map((wave) => wave.frequency);

const renderList = createWaveList($('wave-list'), (id) => commit(removeWave(history.present, id)));
const notePad = createNotePad($('notes'), NOTES, {
  onPress(note, duration) {
    setMixPlaying(false);
    player.play(retune(frequencies(), note.frequency), duration);
  },
  onRelease() {
    player.stop();
  },
});

// 샘플을 고르면 목록 전체를 그 샘플의 코사인파로 바꾼다(실행 취소 한 번으로 되돌릴 수 있음).
createSamplePicker({ tabs: $('sample-groups'), grid: $('sample-buttons') }, SAMPLE_GROUPS, (sample) => {
  $('sample-hint').textContent = `${sample.name} (${sample.detail.join(', ')}): ${sample.basis}`;
  commit(createWaves(sample.frequencies));
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
  drawScope(canvas, (t) => mixAt(list, t), {
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
    if (hasWaves) player.play(list);
    else {
      player.stop();
      setMixPlaying(false);
    }
  }
  drawWave();
}

function showError(message) {
  error.textContent = message;
  error.hidden = !message;
  if (message) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const frequency = parseFrequency(input.value);
  if (frequency === null) {
    showError(`${MIN_FREQUENCY} ~ ${MAX_FREQUENCY} 사이의 자연수를 입력하세요.`);
    input.select();
    input.focus();
    return;
  }
  showError('');
  input.value = '';
  input.focus();
  commit(addWave(history.present, frequency));
});

input.addEventListener('input', () => showError(''));
noteFixedToggle.addEventListener('change', updateNoteMode);
undoButton.addEventListener('click', undo);
redoButton.addEventListener('click', redo);

mixButton.addEventListener('click', () => {
  if (mixPlaying) player.stop();
  else player.play(frequencies());
  setMixPlaying(!mixPlaying);
});

// Ctrl/Cmd+Z: 실행 취소, Ctrl/Cmd+Shift+Z 또는 Ctrl+Y: 다시 실행.
// 입력창에 글자가 있을 때는 브라우저 기본 텍스트 undo를 그대로 둔다.
document.addEventListener('keydown', (event) => {
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
  if (event.target === input && input.value) return;
  const key = event.key.toLowerCase();
  if (key === 'z' && !event.shiftKey) {
    event.preventDefault();
    undo();
  } else if ((key === 'z' && event.shiftKey) || key === 'y') {
    event.preventDefault();
    redo();
  }
});

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
  syllableSound = renderSegments(syllable.segments, syllable.duration, SYLLABLE_SAMPLE_RATE);
  $('syllable-text').textContent = syllable.text;
  renderTimeline($('syllable-timeline'), syllable.phases, syllable.duration);
  const pitch = PITCH_NOTE[syllable.pitch] ? ` (${PITCH_NOTE[syllable.pitch]})` : '';
  $('syllable-info').textContent = `목소리 높이 ${syllable.f0} Hz${pitch} · 길이 ${Math.round(syllable.duration * 1000)} ms`;
  drawSyllable();
  if (play) player.playBuffer(syllableSound, SYLLABLE_SAMPLE_RATE);
}

function drawSyllable() {
  if (!syllableSound) return;
  const last = syllableSound.length - 1;
  drawScope(syllableCanvas, (t) => syllableSound[Math.min(last, Math.round(t * SYLLABLE_SAMPLE_RATE))], {
    duration: syllable.duration,
    cycles: syllableSound.length,
  });
}

for (const key of ['speaker', 'onset', 'vowel', 'coda']) {
  createChoiceRow($(`choice-${key}`), SYLLABLE_OPTIONS[`${key}s`], syllableChoice[key], (index) => {
    syllableChoice[key] = index;
    updateSyllable(true);
  });
}
$('syllable-play').addEventListener('click', () => player.playBuffer(syllableSound, SYLLABLE_SAMPLE_RATE));

// 탭을 바꾸면 재생 중인 소리를 멈춘다.
createTabs($('tab-wave').parentElement, () => {
  player.stop();
  setMixPlaying(false);
});

new ResizeObserver(drawWave).observe(canvas);
new ResizeObserver(drawSyllable).observe(syllableCanvas);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  drawWave();
  drawSyllable();
});

$('frequency-help').textContent = `${MIN_FREQUENCY} ~ ${MAX_FREQUENCY} 사이의 자연수를 입력하고 Enter 또는 추가를 누르세요.`;
updateNoteMode();
render();
updateSyllable(false);
