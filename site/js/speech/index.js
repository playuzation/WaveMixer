// 말하기 패키지 진입점. 한글 문장을 발음 규칙과 억양을 적용한 음절 목록으로 바꾼다.
import { pronounce } from './pronounce.js';
import { planProsody } from './prosody.js';
export { SENTENCES } from './sentences.js';

const PUNCTUATION = { question: '?', comma: ',', statement: '' };

// 결과: { units: 음절·쉼 목록, pronunciation: '[반갑씀니다]' 같은 발음 표기, skipped: 읽지 않은 글자 }
export function planSentence(text) {
  const { phrases, skipped } = pronounce(text);
  const pronunciation = phrases
    .map(({ words, end }) => words.map((word) => word.map((syllable) => syllable.sound).join('')).join(' ') + PUNCTUATION[end])
    .join(' ');
  return { units: planProsody(phrases), pronunciation, skipped };
}
