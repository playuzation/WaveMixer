// 페이지 진입점. 상태(state)·계산(synth)·소리(audio)·화면(view) 모듈을 조립한다.
// 하위 모듈끼리는 서로 import하지 않는다(main → 각 모듈의 트리 구조).
import { createHistory } from './state/history.js';
import { addWave, removeWave, parseFrequency, MIN_FREQUENCY, MAX_FREQUENCY } from './state/waves.js';
import { fundamentalOf, mixAt, retune } from './synth/mixer.js';
import { NOTES } from './synth/notes.js';
import * as player from './audio/player.js';
import { drawScope } from './view/scope.js';
import { createWaveList } from './view/waveList.js';
import { createNotePad } from './view/notePad.js';

const SHOWN_PERIODS = 2;
const NOTE_SECONDS = 2;

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
    const harmonics = list.map((frequency) => frequency / fundamental).join(', ');
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

new ResizeObserver(drawWave).observe(canvas);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', drawWave);

$('frequency-help').textContent = `${MIN_FREQUENCY} ~ ${MAX_FREQUENCY} 사이의 자연수를 입력하고 Enter 또는 추가를 누르세요.`;
updateNoteMode();
render();
