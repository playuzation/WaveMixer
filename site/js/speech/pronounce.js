// 한글 문장을 소리 나는 대로 바꾼다(표준 발음법의 기본 규칙만, 어절 안에서만 적용).
// 결과: { phrases: [{ words: [[{ text, cho, jung, jong }, …], …], end }], skipped }
// - end: 'statement'(. ! 또는 끝) | 'question'(?) | 'comma'(,)
// - skipped: 한글 음절이 아니어서 읽지 않은 글자들
import { decompose, compose } from './hangul.js';

// 받침 7대표음
const NEUTRAL = {
  ㄲ: 'ㄱ', ㅋ: 'ㄱ', ㄳ: 'ㄱ', ㄺ: 'ㄱ',
  ㅅ: 'ㄷ', ㅆ: 'ㄷ', ㅈ: 'ㄷ', ㅊ: 'ㄷ', ㅌ: 'ㄷ', ㅎ: 'ㄷ',
  ㅍ: 'ㅂ', ㅄ: 'ㅂ', ㄿ: 'ㅂ',
  ㄵ: 'ㄴ', ㄶ: 'ㄴ', ㄼ: 'ㄹ', ㄽ: 'ㄹ', ㄾ: 'ㄹ', ㅀ: 'ㄹ', ㄻ: 'ㅁ',
};
// 겹받침: [남는 받침, 뒤로 넘어가는 받침]
const SPLIT = {
  ㄳ: ['ㄱ', 'ㅅ'], ㄵ: ['ㄴ', 'ㅈ'], ㄶ: ['ㄴ', 'ㅎ'], ㄺ: ['ㄹ', 'ㄱ'], ㄻ: ['ㄹ', 'ㅁ'], ㄼ: ['ㄹ', 'ㅂ'],
  ㄽ: ['ㄹ', 'ㅅ'], ㄾ: ['ㄹ', 'ㅌ'], ㄿ: ['ㄹ', 'ㅍ'], ㅀ: ['ㄹ', 'ㅎ'], ㅄ: ['ㅂ', 'ㅅ'],
};
const H_CODA = { ㅎ: '', ㄶ: 'ㄴ', ㅀ: 'ㄹ' }; // ㅎ이 든 받침과, ㅎ이 빠지고 남는 받침
const ASPIRATE = { ㄱ: 'ㅋ', ㄲ: 'ㅋ', ㅋ: 'ㅋ', ㄷ: 'ㅌ', ㅅ: 'ㅌ', ㅆ: 'ㅌ', ㅌ: 'ㅌ', ㅈ: 'ㅊ', ㅊ: 'ㅊ', ㅂ: 'ㅍ', ㅍ: 'ㅍ' };
const TENSE = { ㄱ: 'ㄲ', ㄷ: 'ㄸ', ㅂ: 'ㅃ', ㅅ: 'ㅆ', ㅈ: 'ㅉ' };
const NASAL = { ㄱ: 'ㅇ', ㄷ: 'ㄴ', ㅂ: 'ㅁ' };

// 앞 음절 a의 받침과 뒤 음절 b의 초성이 만날 때의 변화
function link(a, b) {
  // 구개음화: ㄷ·ㅌ + 이 → 지·치, ㄷ + 히 → 치
  if (b.jung === 'ㅣ' && b.cho === 'ㅇ' && ['ㄷ', 'ㅌ', 'ㄾ'].includes(a.jong)) {
    b.cho = a.jong === 'ㄷ' ? 'ㅈ' : 'ㅊ';
    a.jong = a.jong === 'ㄾ' ? 'ㄹ' : '';
  } else if (b.jung === 'ㅣ' && b.cho === 'ㅎ' && a.jong === 'ㄷ') {
    b.cho = 'ㅊ';
    a.jong = '';
  }

  // ㅎ 받침: 뒤 ㄱ·ㄷ·ㅈ과 합쳐 거센소리, ㅅ은 된소리, 모음 앞에서는 탈락, ㄴ 앞에서는 [ㄴ]
  if (a.jong in H_CODA) {
    const rest = H_CODA[a.jong];
    if (['ㄱ', 'ㄷ', 'ㅈ'].includes(b.cho)) [b.cho, a.jong] = [ASPIRATE[b.cho], rest];
    else if (b.cho === 'ㅅ') [b.cho, a.jong] = ['ㅆ', rest];
    else if (b.cho === 'ㅇ') a.jong = rest;
    else if (b.cho === 'ㄴ') a.jong = rest || 'ㄴ';
  }

  // 받침 ㄱ·ㄷ·ㅂ·ㅈ 등 + ㅎ → 거센소리
  if (b.cho === 'ㅎ' && a.jong) {
    const [keep, move] = SPLIT[a.jong] ?? ['', a.jong];
    if (ASPIRATE[move]) [a.jong, b.cho] = [keep, ASPIRATE[move]];
  }

  // 연음: 받침이 뒤 음절의 빈 초성(ㅇ) 자리로 넘어간다. 겹받침은 뒤 받침만 넘어간다.
  if (b.cho === 'ㅇ' && a.jong && a.jong !== 'ㅇ') {
    const [keep, move] = SPLIT[a.jong] ?? ['', a.jong];
    [a.jong, b.cho] = [keep, keep && move === 'ㅅ' ? 'ㅆ' : move];
  }

  a.jong = NEUTRAL[a.jong] ?? a.jong;

  // 된소리되기: 받침 ㄱ·ㄷ·ㅂ 뒤의 ㄱ·ㄷ·ㅂ·ㅅ·ㅈ
  if (NASAL[a.jong] && TENSE[b.cho]) b.cho = TENSE[b.cho];
  // 비음화: 받침 ㄱ·ㄷ·ㅂ + ㄴ·ㅁ, 받침 ㅁ·ㅇ(·ㄱ·ㅂ) + ㄹ
  if (b.cho === 'ㄹ' && ['ㅁ', 'ㅇ', 'ㄱ', 'ㅂ'].includes(a.jong)) b.cho = 'ㄴ';
  if (NASAL[a.jong] && ['ㄴ', 'ㅁ'].includes(b.cho)) a.jong = NASAL[a.jong];
  // 유음화: ㄴ + ㄹ, ㄹ + ㄴ → ㄹㄹ
  if (a.jong === 'ㄴ' && b.cho === 'ㄹ') a.jong = 'ㄹ';
  if (a.jong === 'ㄹ' && b.cho === 'ㄴ') b.cho = 'ㄹ';
}

// 어절 하나(음절 목록)에 규칙을 적용한다.
function pronounceWord(syllables) {
  for (let i = 0; i + 1 < syllables.length; i++) link(syllables[i], syllables[i + 1]);
  const last = syllables[syllables.length - 1];
  last.jong = NEUTRAL[last.jong] ?? last.jong;

  syllables.forEach((syllable, i) => {
    // 의: 첫음절의 '의'만 [의], 자음 뒤나 둘째 음절 이하는 [이]
    if (syllable.jung === 'ㅢ' && (syllable.cho !== 'ㅇ' || i > 0)) syllable.jung = 'ㅣ';
    // 예·례 외의 'ㅖ'는 [ㅔ]
    if (syllable.jung === 'ㅖ' && !['ㅇ', 'ㄹ'].includes(syllable.cho)) syllable.jung = 'ㅔ';
    syllable.sound = compose(syllable);
  });
  return syllables;
}

const ENDS = { '?': 'question', ',': 'comma', '.': 'statement', '!': 'statement' };

export function pronounce(text) {
  const phrases = [];
  let words = [];
  let word = [];
  let skipped = '';
  const closeWord = () => {
    if (word.length) words.push(pronounceWord(word));
    word = [];
  };
  const closePhrase = (end) => {
    closeWord();
    if (words.length) phrases.push({ words, end });
    words = [];
  };

  for (const char of text) {
    const jamo = decompose(char);
    if (jamo) word.push({ text: char, ...jamo });
    else if (ENDS[char]) closePhrase(ENDS[char]);
    else if (/\s/.test(char)) closeWord();
    else skipped += char;
  }
  closePhrase('statement');
  return { phrases, skipped };
}
