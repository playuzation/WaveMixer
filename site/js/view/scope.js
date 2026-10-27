// 신호를 오실로스코프처럼 캔버스에 그린다.
// 색은 캔버스에 지정된 CSS 변수(--scope-line, --scope-grid)를 따른다.
const PADDING = 10;

// signal: t(초) → [-1, 1] 함수, 없으면 기준선만 그린다.
// duration: 가로축 전체 시간(초), cycles: 화면 안 최고 주파수의 반복 수, divisions: 주기 경계 개수.
export function drawScope(canvas, signal, { duration = 1, cycles = 1, divisions = 1 } = {}) {
  const ratio = window.devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);

  const g = canvas.getContext('2d');
  g.setTransform(ratio, 0, 0, ratio, 0, 0);
  g.clearRect(0, 0, width, height);

  const style = getComputedStyle(canvas);
  const mid = height / 2;
  const amplitude = mid - PADDING;

  // 0 기준선과 주기 경계선
  g.lineWidth = 1;
  g.strokeStyle = style.getPropertyValue('--scope-grid').trim();
  g.beginPath();
  g.moveTo(0, mid);
  g.lineTo(width, mid);
  g.stroke();
  g.setLineDash([4, 4]);
  g.beginPath();
  for (let i = 1; i < divisions; i++) {
    const x = Math.round((width * i) / divisions) + 0.5;
    g.moveTo(x, 0);
    g.lineTo(x, height);
  }
  g.stroke();
  g.setLineDash([]);

  if (!signal) return;

  // 촘촘한 파형도 깨지지 않도록 한 번 반복에 충분한 샘플을 두되, 픽셀당 64개로 제한한다.
  const samples = Math.ceil(Math.min(Math.max(cycles * 24, width * 2), width * 64));
  g.lineWidth = 2;
  g.lineJoin = 'round';
  g.strokeStyle = style.getPropertyValue('--scope-line').trim();
  g.beginPath();
  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * width;
    const y = mid - signal((i / samples) * duration) * amplitude;
    if (i) g.lineTo(x, y);
    else g.moveTo(x, y);
  }
  g.stroke();
}
