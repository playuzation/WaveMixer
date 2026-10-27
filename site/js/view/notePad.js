// 음계 버튼. 마우스·터치(pointer)와 키보드(Space/Enter) 모두 같은 방식으로 동작한다.
// - 누르는 동안 모드(duration = null): 누르면 onPress(note, null), 떼면 onRelease()
// - 고정 길이 모드(duration = 초): 누르면 onPress(note, duration), 떼는 것과 무관하게
//   소리는 duration 뒤 스스로 끝나므로 버튼 강조만 그때 해제한다.
export function createNotePad(container, notes, { onPress, onRelease }) {
  let active = null;
  let duration = null;
  let timer = 0;

  const clear = () => {
    clearTimeout(timer);
    active?.classList.remove('is-active');
    active = null;
  };

  const release = () => {
    if (!active) return;
    clear();
    onRelease();
  };

  const press = (button) => {
    if (button.disabled || (active === button && !duration)) return;
    release();
    active = button;
    button.classList.add('is-active');
    onPress(notes[Number(button.dataset.index)], duration);
    if (duration) timer = setTimeout(clear, duration * 1000);
  };

  const end = () => {
    if (!duration) release();
  };

  const isPressKey = (event) => event.key === ' ' || event.key === 'Enter';

  container.replaceChildren(
    ...notes.map((note, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'note';
      button.dataset.index = index;
      button.innerHTML = `
        <span class="note-name">${note.name}</span>
        <span class="note-pitch">${note.pitch}<br />${note.frequency.toFixed(1)} Hz</span>`;

      button.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        button.setPointerCapture(event.pointerId);
        press(button);
      });
      button.addEventListener('pointerup', end);
      button.addEventListener('pointercancel', end);
      button.addEventListener('keydown', (event) => {
        if (!isPressKey(event) || event.repeat) return;
        event.preventDefault();
        press(button);
      });
      button.addEventListener('keyup', (event) => {
        if (isPressKey(event)) end();
      });
      button.addEventListener('blur', end);
      button.addEventListener('contextmenu', (event) => event.preventDefault());
      return button;
    }),
  );

  return {
    setEnabled(enabled) {
      if (!enabled) release();
      container.querySelectorAll('button').forEach((button) => {
        button.disabled = !enabled;
      });
    },
    // seconds: 고정 재생 길이(초), null이면 누르는 동안 재생
    setDuration(seconds) {
      release();
      duration = seconds;
    },
  };
}
