// 여러 개 중 하나를 고르는 버튼 줄. 누르면 그 버튼을 고른 상태로 표시하고 onSelect(index)를 호출한다.
export function createChoiceRow(container, labels, selected, onSelect) {
  const buttons = labels.map((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.textContent = label;
    button.setAttribute('aria-pressed', String(index === selected));
    button.addEventListener('click', () => {
      buttons.forEach((other) => other.setAttribute('aria-pressed', String(other === button)));
      onSelect(index);
    });
    return button;
  });
  container.replaceChildren(...buttons);
}
