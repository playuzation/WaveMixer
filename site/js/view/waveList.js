// 추가된 파동 목록. 항목의 삭제 버튼을 누르면 onRemove(id)를 호출한다.
// 반환하는 render(waves)로 목록을 다시 그린다. 진폭은 수식의 배율과, 가장 큰 진폭 대비 dB로 보여준다.
const formatAmplitude = (amplitude) => String(Number(amplitude.toPrecision(3)));
const formatDecibel = (db) => (db > -0.05 ? '0 dB' : `−${(-db).toFixed(1)} dB`);

export function createWaveList(listElement, onRemove) {
  let focusIndex = -1;

  listElement.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button) return;
    focusIndex = [...listElement.querySelectorAll('button[data-id]')].indexOf(button);
    onRemove(Number(button.dataset.id));
  });

  return function render(waves) {
    const peak = Math.max(...waves.map((wave) => wave.amplitude));
    listElement.replaceChildren(
      ...waves.map(({ id, frequency, amplitude }, index) => {
        // 좁은 화면에서는 진폭 배율 뒤에서 줄을 바꿀 수 있게 한다.
        const gain = amplitude === 1 ? '' : `${formatAmplitude(amplitude)}·<wbr />`;
        const item = document.createElement('li');
        item.className = 'wave';
        item.innerHTML = `
          <span class="wave-index">${index + 1}</span>
          <span class="wave-formula">${gain}cos(2π·${frequency}·t)</span>
          <span class="wave-hz">${frequency} Hz<span class="wave-db">${formatDecibel(20 * Math.log10(amplitude / peak))}</span></span>
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
