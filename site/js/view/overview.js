// 긴 소리의 모양을 그린다. 픽셀 열마다 그 구간의 최솟값~최댓값을 세로선으로 잇는다.
// selection [시작, 끝](초)을 주면 그 구간을 강조색으로 덮는다. 색은 캔버스의 CSS 변수를 따른다.
export function drawOverview(canvas, samples, sampleRate, selection = null) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const g = canvas.getContext('2d');
  g.setTransform(ratio, 0, 0, ratio, 0, 0);
  g.clearRect(0, 0, width, height);
  if (!samples?.length) return;

  const style = getComputedStyle(canvas);
  const duration = samples.length / sampleRate;
  if (selection) {
    const [from, to] = selection.map((time) => (time / duration) * width);
    g.fillStyle = style.getPropertyValue('--scope-selection').trim();
    g.fillRect(from, 0, Math.max(2, to - from), height);
  }

  const mid = height / 2;
  const scale = mid - 6;
  g.strokeStyle = style.getPropertyValue('--scope-line').trim();
  g.lineWidth = 1;
  g.beginPath();
  for (let x = 0; x < width; x++) {
    const from = Math.floor((x / width) * samples.length);
    const to = Math.max(from + 1, Math.floor(((x + 1) / width) * samples.length));
    let [low, high] = [Infinity, -Infinity];
    for (let i = from; i < to; i++) {
      low = Math.min(low, samples[i]);
      high = Math.max(high, samples[i]);
    }
    g.moveTo(x + 0.5, mid - high * scale);
    g.lineTo(x + 0.5, mid - low * scale + 1);
  }
  g.stroke();
}
