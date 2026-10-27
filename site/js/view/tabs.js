// 페이지 탭. 고른 탭(role=tab)의 aria-controls가 가리키는 패널만 보이고, 바뀔 때 onChange(index)를 호출한다.
// 키보드: ←/→ 로 이웃 탭으로 옮긴다.
export function createTabs(tablist, onChange) {
  const tabs = [...tablist.querySelectorAll('[role="tab"]')];

  const select = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tabs[index].focus();
    onChange(index);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      select((index + step + tabs.length) % tabs.length, true);
    });
  });
  select(0);
}
