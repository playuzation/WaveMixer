// 추가된 파동 목록. 항목의 삭제 버튼을 누르면 onRemove(id)를 호출한다.
// 반환하는 render(waves)로 목록을 다시 그린다.
export function createWaveList(listElement, onRemove) {
  let focusIndex = -1;

  listElement.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    focusIndex = [...listElement.querySelectorAll('button[data-id]')].indexOf(button);
    onRemove(Number(button.dataset.id));
  });

  return function render(waves) {
    listElement.replaceChildren(
      ...waves.map(({ id, frequency }, index) => {
        const item = document.createElement('li');
        item.className = 'wave';
        item.innerHTML = `
          <span class="wave-index">${index + 1}</span>
          <span class="wave-formula">cos(2π·${frequency}·t)</span>
          <span class="wave-hz">${frequency} Hz</span>
          <button type="button" class="wave-remove" data-id="${id}" aria-label="${frequency} Hz 파동 삭제" title="삭제">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>`;
        return item;
      }),
    );

    // 삭제 후 키보드 포커스를 같은 자리의 다음 항목으로 옮긴다.
    if (focusIndex >= 0) {
      const buttons = listElement.querySelectorAll('button[data-id]');
      buttons[Math.min(focusIndex, buttons.length - 1)]?.focus();
      focusIndex = -1;
    }
  };
}
