// 음절 구간 타임라인. 위쪽 막대는 전체 길이 대비 각 구간의 위치·길이를, 아래 목록은 이름과 길이(ms)를 보여 준다.
// phases: [{ label, kind, start, end }] (초), duration: 전체 길이(초)
export function renderTimeline(container, phases, duration) {
  const percent = (seconds) => `${(seconds / duration) * 100}%`;
  const ms = (phase) => Math.round((phase.end - phase.start) * 1000);

  const bar = document.createElement('div');
  bar.className = 'timeline-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.replaceChildren(
    ...phases.map((phase) => {
      const block = document.createElement('span');
      block.className = `timeline-block is-${phase.kind}`;
      block.style.left = percent(phase.start);
      block.style.width = percent(phase.end - phase.start);
      return block;
    }),
  );

  const list = document.createElement('ol');
  list.className = 'timeline-list';
  list.replaceChildren(
    ...phases.map((phase) => {
      const item = document.createElement('li');
      item.innerHTML = `<span class="timeline-swatch is-${phase.kind}"></span>${phase.label} <span class="timeline-ms">${ms(phase)} ms</span>`;
      return item;
    }),
  );

  container.replaceChildren(bar, list);
}
