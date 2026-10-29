// 시간에 따라 바뀌는 코사인파 묶음을 소리로 만든다(McAulay–Quatieri 방식의 사인파 합성).
// track: { start: 첫 프레임 시각(초), hop: 프레임 간격(초), frames: [{ components: [{ frequency, amplitude }] }] }
// - 이웃 프레임에서 주파수 차이가 MATCH 비율 안인 성분끼리 이어, 진폭·주파수를 선형으로 옮기고 위상은 적분해 잇는다.
// - 이어지지 않는 성분은 한 hop 동안 0에서 커지거나 0으로 줄어든다.
const MATCH = 0.03;
const TWO_PI = 2 * Math.PI;

// 앞 프레임의 성분(위상 포함)과 다음 프레임 성분을 짝지어 [{ from, to, phase }] 구간 목록을 만든다.
function connect(previous, next) {
  const claimed = new Set();
  const pieces = [];
  for (const p of [...previous].sort((a, b) => b.amplitude - a.amplitude)) {
    let best = -1;
    next.forEach((q, j) => {
      const gap = Math.abs(q.frequency - p.frequency);
      if (claimed.has(j) || gap > MATCH * p.frequency) return;
      if (best < 0 || gap < Math.abs(next[best].frequency - p.frequency)) best = j;
    });
    if (best >= 0) claimed.add(best);
    const target = best >= 0 ? next[best] : { frequency: p.frequency, amplitude: 0 };
    pieces.push({ from: p, to: target, phase: p.phase, next: best });
  }
  next.forEach((q, j) => {
    if (!claimed.has(j)) pieces.push({ from: { frequency: q.frequency, amplitude: 0 }, to: q, phase: 0, next: j });
  });
  return pieces;
}

export function renderPartials({ start, hop, frames }, length, sampleRate) {
  const out = new Float32Array(length);
  let previous = [];
  // 처음과 끝에 빈 프레임을 두어 성분이 한 hop 동안 커지고 줄어들게 한다.
  for (let k = 0; k <= frames.length; k++) {
    const next = (frames[k]?.components ?? []).map((item) => ({ ...item, phase: 0 }));
    const pieces = connect(previous, next);
    const begin = start + (k - 1) * hop;
    const from = Math.max(0, Math.round(begin * sampleRate));
    const to = Math.min(length, Math.round((begin + hop) * sampleRate));
    for (const piece of pieces) {
      let phase = piece.phase;
      for (let i = from; i < to; i++) {
        const x = (i / sampleRate - begin) / hop;
        const frequency = piece.from.frequency + (piece.to.frequency - piece.from.frequency) * x;
        phase += (TWO_PI * frequency) / sampleRate;
        out[i] += (piece.from.amplitude + (piece.to.amplitude - piece.from.amplitude) * x) * Math.cos(phase);
      }
      if (piece.next >= 0) next[piece.next].phase = phase % TWO_PI;
    }
    previous = next;
  }
  return out;
}
