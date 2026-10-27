// 발음된 문장에 억양(높이)과 길이를 정해, 음절과 쉼(pause)이 이어진 목록으로 만든다.
// 높이·길이는 목소리 기준값에 곱하는 비율이다. 근거·추정 여부는 docs/korean-speech-sounds.md 참고.
// - 어절 하나를 강세구 하나로 보고 서울말 강세구 성조 THLH를 준다.
//   T는 강세구 첫 소리가 거센소리·된소리(·ㅅ·ㅎ)이면 H, 아니면 L이다.
// - 억양구(쉼표·문장 단위) 안에서 높이가 조금씩 낮아지고, 끝 음절은 경계 성조로 내리거나(평서문) 올린다(의문문).
// - 1음절 어절의 모음은 길고, 강세구·억양구 끝 음절도 길어진다.
const HIGH_ONSETS = new Set([...'ㅊㅋㅌㅍㄲㄸㅃㅆㅉㅅㅎ']);
const TONE = { L: 0.9, H: 1.1 };
const DECLINATION = 0.12;
const BOUNDARY = { statement: 0.78, question: 1.3, comma: 1.15 };
const LENGTH = { monosyllable: 2, phraseEnd: 1.15, utteranceEnd: 1.6, max: 2.5 };
const PAUSE_MS = { comma: 150, statement: 300, question: 300 };

// n음절 강세구의 k번째 음절 성조(THLH: 둘째 H, 끝에서 둘째 L, 끝 H, 사이는 H에서 L로 이어짐)
function phraseTone(k, n, initial) {
  if (k === 0) return initial;
  if (k === n - 1) return TONE.H;
  if (n >= 4 && k === n - 2) return TONE.L;
  if (k === 1) return TONE.H;
  return TONE.H + ((TONE.L - TONE.H) * (k - 1)) / (n - 3);
}

export function planProsody(phrases) {
  const units = [];
  phrases.forEach(({ words, end }, p) => {
    const count = words.reduce((sum, word) => sum + word.length, 0);
    let position = 0;
    words.forEach((word, w) => {
      const initial = HIGH_ONSETS.has(word[0].cho) ? TONE.H : TONE.L;
      word.forEach((syllable, k) => {
        const last = w === words.length - 1 && k === word.length - 1;
        const unit = {
          ...syllable,
          pitch: phraseTone(k, word.length, initial) * (1 - (DECLINATION * position) / Math.max(1, count - 1)),
          length: word.length === 1 ? LENGTH.monosyllable : 1,
          phraseInitial: k === 0,
          last,
        };
        if (k === word.length - 1) unit.length *= LENGTH.phraseEnd;
        if (last) {
          unit.length *= LENGTH.utteranceEnd;
          unit.pitchEnd = BOUNDARY[end];
          if (end !== 'statement') unit.pitch = Math.min(unit.pitch, TONE.L);
        }
        unit.length = Math.min(unit.length, LENGTH.max);
        units.push(unit);
        position++;
      });
    });
    if (p < phrases.length - 1) units.push({ pause: PAUSE_MS[end] });
  });
  return units;
}
