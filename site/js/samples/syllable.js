// 음절의 시간 배치. 소리 구간(phase)을 순서대로 이어 붙이고, 이웃 구간은 겹쳐서 서서히 바뀌게 한다.
// 입력 phase: { label, kind, frequencies, ms, level, fade?: 앞 구간과 겹치는 ms, cut?: 끝을 짧게 끊음 }
// 출력: { duration, phases: 화면용 [{ label, kind, start, end }], segments: 소리 계산용 구간 } (단위: 초)
const LEAD_MS = 20;
const TAIL_MS = 30;
const DEFAULT_FADE_MS = 20;
const ATTACK_MS = 5;
const RELEASE_MS = 50;
const CUT_MS = 8;

export function layoutSyllable(phases) {
  const sec = (ms) => ms / 1000;
  let cursor = sec(LEAD_MS);
  const placed = phases.map((phase) => {
    const start = cursor;
    cursor += sec(phase.ms);
    return { ...phase, start, end: cursor };
  });

  const segments = placed.map((phase, i) => {
    const previous = placed[i - 1];
    const next = placed[i + 1];
    const fadeIn = previous ? sec(phase.fade ?? DEFAULT_FADE_MS) : sec(ATTACK_MS);
    const fadeOut = next ? sec(next.fade ?? DEFAULT_FADE_MS) : sec(phase.cut ? CUT_MS : RELEASE_MS);
    // 경계를 중심으로 앞뒤 구간이 겹치도록 늘린다. 마지막 구간은 경계 뒤로 끝맺음만큼 이어진다.
    const start = phase.start - (previous ? fadeIn / 2 : 0);
    const end = phase.end + (next ? fadeOut / 2 : fadeOut);
    return { frequencies: phase.frequencies, level: phase.level, start, duration: end - start, fadeIn, fadeOut };
  });

  const last = segments[segments.length - 1];
  return {
    duration: last.start + last.duration + sec(TAIL_MS),
    phases: placed.map(({ label, kind, start, end }) => ({ label, kind, start, end })),
    segments,
  };
}

// 초성·중성·종성 번호로 한글 음절 한 글자를 만든다(유니코드 '가'부터 순서대로 배열됨).
export function hangulSyllable(cho, jung, jong = 0) {
  return String.fromCharCode(0xac00 + (cho * 21 + jung) * 28 + jong);
}
