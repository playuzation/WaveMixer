// 음절·문장의 시간 배치. 소리 구간(phase)을 순서대로 이어 붙이고, 이웃 구간과 서서히 바뀌게 한다.
// 입력 phase: { label, kind, ms, fade?: 앞 구간과 바뀌는 ms, cut?: 끝을 짧게 끊음 } 과 소리 하나:
// - frequencies + level: 잡음처럼 정지된 코사인파 묶음. 이웃과 겹쳐(crossfade) 바뀐다.
// - voice: { f0, formants, bandwidths?, zero?, level } 성대가 울리는 소리. 이웃 voice와는 겹치지 않고
//   포먼트·높이·세기가 이어서 움직이도록 키프레임(keys)을 만든다. from: { formants, ms }가 있으면
//   그 포먼트에서 시작해 ms 동안 목표로 옮겨 간다(자음에서 모음으로의 전이).
// - 둘 다 없으면 무음 구간이다. abrupt면(파열음 막힘) 앞 소리를 짧게 끊는다.
// 출력: { duration, phases: 화면용 [{ label, kind, start, end }], segments, keys } (단위: 초)
const LEAD_MS = 20;
const TAIL_MS = 30;
const DEFAULT_FADE_MS = 20;
const ATTACK_MS = 5;
const RELEASE_MS = 50;
const CUT_MS = 8;

export function layoutPhases(phases) {
  const sec = (ms) => ms / 1000;
  let cursor = sec(LEAD_MS);
  const placed = phases.map((phase) => {
    const start = cursor;
    cursor += sec(phase.ms);
    return { ...phase, start, end: cursor };
  });

  const sounding = (phase) => Boolean(phase?.frequencies?.length || phase?.voice);
  const segments = placed.flatMap((phase, i) => {
    if (!phase.frequencies?.length) return [];
    const previous = sounding(placed[i - 1]) ? placed[i - 1] : null;
    const next = sounding(placed[i + 1]) ? placed[i + 1] : null;
    const cut = phase.cut || placed[i + 1]?.abrupt;
    const fadeIn = previous ? sec(phase.fade ?? DEFAULT_FADE_MS) : sec(ATTACK_MS);
    const fadeOut = next ? sec(next.fade ?? DEFAULT_FADE_MS) : sec(cut ? CUT_MS : RELEASE_MS);
    // 경계를 중심으로 앞뒤 구간이 겹치도록 늘린다. 뒤에 소리가 없으면 경계 뒤로 끝맺음만큼 이어진다.
    const start = phase.start - (previous ? fadeIn / 2 : 0);
    const end = phase.end + (next ? fadeOut / 2 : fadeOut);
    return [{ frequencies: phase.frequencies, level: phase.level, start, duration: end - start, fadeIn, fadeOut }];
  });

  // 키프레임은 시간 순서여야 하므로, 구간이 짧아 앞 키보다 이르게 되면 앞 키 시간에 맞춘다.
  const keys = [];
  const key = (time, voice) => keys.push({ ...voice, time: Math.max(time, keys[keys.length - 1]?.time ?? time) });
  placed.forEach((phase, i) => {
    if (!phase.voice) return;
    const previous = placed[i - 1]?.voice;
    const next = placed[i + 1]?.voice ? placed[i + 1] : null;
    const cut = phase.cut || placed[i + 1]?.abrupt;
    const fadeIn = previous ? sec(phase.fade ?? DEFAULT_FADE_MS) : sec(ATTACK_MS);
    const fadeOut = next ? sec(next.fade ?? DEFAULT_FADE_MS) : sec(cut ? CUT_MS : RELEASE_MS);
    const target = phase.voice;
    const onset = phase.from ? { ...target, formants: phase.from.formants } : target;

    if (previous) key(phase.start + fadeIn / 2, onset);
    else {
      key(phase.start, { ...onset, level: 0 });
      key(phase.start + fadeIn, onset);
    }
    if (phase.from) key(phase.start + sec(phase.from.ms), target);
    if (next) key(phase.end - fadeOut / 2, target);
    else {
      key(phase.end, target);
      key(phase.end + fadeOut, { ...target, level: 0 });
    }
  });

  const ends = [cursor, keys[keys.length - 1]?.time ?? 0, ...segments.map((segment) => segment.start + segment.duration)];
  return {
    duration: Math.max(...ends) + sec(TAIL_MS),
    phases: placed.map(({ label, kind, start, end }) => ({ label, kind, start, end })),
    segments,
    keys,
  };
}

// 초성·중성·종성 번호로 한글 음절 한 글자를 만든다(유니코드 '가'부터 순서대로 배열됨).
export function hangulSyllable(cho, jung, jong = 0) {
  return String.fromCharCode(0xac00 + (cho * 21 + jung) * 28 + jong);
}
