// 악기 샘플 버튼. 누르면 onPick(sample)을 호출한다.
export function createSamplePicker(container, samples, onPick) {
  container.replaceChildren(
    ...samples.map((sample) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'sample';
      button.innerHTML = `
        <span class="sample-name">${sample.name}</span>
        <span class="sample-pitch">${sample.pitch}<br />${sample.f0} Hz</span>`;
      button.addEventListener('click', () => onPick(sample));
      return button;
    }),
  );
}
