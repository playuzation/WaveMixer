// 음계 버튼. 누르고 있는 동안 onPress(note), 떼면 onRelease()를 호출한다.
// 마우스·터치(pointer)와 키보드(Space/Enter) 모두 같은 방식으로 동작한다.
export function createNotePad(container, notes, { onPress, onRelease }) {
  let active = null;

  const release = () => {
    if (!active) return;
    active.classList.remove('is-active');
    active = null;
    onRelease();
  };

  const press = (button) => {
    if (active === button || button.disabled) return;
    release();
    active = button;
    button.classList.add('is-active');
    onPress(notes[Number(button.dataset.index)]);
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
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('keydown', (event) => {
        if (!isPressKey(event) || event.repeat) return;
        event.preventDefault();
        press(button);
      });
      button.addEventListener('keyup', (event) => {
        if (isPressKey(event)) release();
      });
      button.addEventListener('blur', release);
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
  };
}
