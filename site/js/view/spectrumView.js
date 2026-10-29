// 스펙트럼(dB, 가장 강한 성분 = 0)을 선으로, 고른 코사인파를 막대로 겹쳐 그린다.
// 가로 0 ~ maxFrequency Hz, 세로 0 ~ −RANGE_DB. 색은 캔버스의 CSS 변수를 따른다.
const RANGE_DB = 70;
const PADDING = 8;

export function drawSpectrum(canvas, spectrum, components, maxFrequency) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const g = canvas.getContext('2d');
  g.setTransform(ratio, 0, 0, ratio, 0, 0);
  g.clearRect(0, 0, width, height);
  if (!spectrum) return;

  const style = getComputedStyle(canvas);
  const x = (frequency) => (frequency / maxFrequency) * width;
  const y = (db) => PADDING + (Math.min(0, Math.max(-RANGE_DB, db)) / -RANGE_DB) * (height - 2 * PADDING);

  // 20 dB마다 기준선
  g.strokeStyle = style.getPropertyValue('--scope-grid').trim();
  g.lineWidth = 1;
  g.beginPath();
  for (let db = 0; db >= -RANGE_DB; db -= 20) {
    g.moveTo(0, Math.round(y(db)) + 0.5);
    g.lineTo(width, Math.round(y(db)) + 0.5);
  }
  g.stroke();

  // 원음 스펙트럼
  const { levels, binHz } = spectrum;
  const last = Math.min(levels.length - 1, Math.ceil(maxFrequency / binHz));
  const step = Math.max(1, Math.floor(last / (width * 2)));
  g.strokeStyle = style.getPropertyValue('--scope-grid-strong').trim();
  g.beginPath();
  for (let k = 0; k <= last; k += step) {
    let level = -Infinity;
    for (let j = k; j < Math.min(k + step, last + 1); j++) level = Math.max(level, levels[j]);
    if (k) g.lineTo(x(k * binHz), y(level));
    else g.moveTo(0, y(level));
  }
  g.stroke();

  // 고른 코사인파
  g.strokeStyle = style.getPropertyValue('--scope-line').trim();
  g.lineWidth = 2;
  g.beginPath();
  for (const { frequency, amplitude } of components) {
    g.moveTo(x(frequency), height - PADDING);
    g.lineTo(x(frequency), y(20 * Math.log10(amplitude)));
  }
  g.stroke();
}
