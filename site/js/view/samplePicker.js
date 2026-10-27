// 샘플 그룹 전환 버튼과 그룹별 샘플 버튼. 샘플을 누르면 onPick(sample)을 호출한다.
// groups: [{ name, samples: [{ name, detail: [줄, …] }] }]
export function createSamplePicker({ tabs, grid }, groups, onPick) {
  const showGroup = (index) => {
    tabs.querySelectorAll('button').forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === index));
    });
    grid.replaceChildren(
      ...groups[index].samples.map((sample) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'sample';
        button.innerHTML = `
          <span class="sample-name">${sample.name}</span>
          <span class="sample-pitch">${sample.detail.join('<br />')}</span>`;
        button.addEventListener('click', () => onPick(sample));
        return button;
      }),
    );
  };

  tabs.replaceChildren(
    ...groups.map((group, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sample-group';
      button.textContent = group.name;
      button.addEventListener('click', () => showGroup(index));
      return button;
    }),
  );
  showGroup(0);
}
