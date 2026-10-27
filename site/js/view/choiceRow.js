// 여러 개 중 하나를 고르는 버튼 줄. 누르면 그 버튼을 고른 상태로 표시하고 onSelect(index)를 호출한다.
// 반환하는 select(index)로 고른 상태만 바꿀 수 있다(−1이면 아무것도 고르지 않음).
export function createChoiceRow(container, labels, selected, onSelect) {
  const select = (index) => {
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  };
  const buttons = labels.map((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'choice';
    button.textContent = label;
    button.addEventListener('click', () => {
      select(index);
      onSelect(index);
    });
    return button;
  });
  container.replaceChildren(...buttons);
  select(selected);
  return { select };
}
