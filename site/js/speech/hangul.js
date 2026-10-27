// 한글 음절 ↔ 자모(초성·중성·종성) 변환. 자모는 호환용 자모 글자(ㄱ, ㅏ …)로 다루고, 받침이 없으면 ''이다.
const CHO = [...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'];
const JUNG = [...'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'];
const JONG = ['', ...'ㄱㄲㄳㄴㄵㄶㄷㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅄㅅㅆㅇㅈㅊㅋㅌㅍㅎ'];
const FIRST = 0xac00; // '가'
const COUNT = CHO.length * JUNG.length * JONG.length;

// 한글 음절 글자 하나를 자모로 나눈다. 한글 음절이 아니면 null.
export function decompose(char) {
  const code = char.codePointAt(0) - FIRST;
  if (!(code >= 0 && code < COUNT)) return null;
  return {
    cho: CHO[Math.floor(code / (JUNG.length * JONG.length))],
    jung: JUNG[Math.floor(code / JONG.length) % JUNG.length],
    jong: JONG[code % JONG.length],
  };
}

export function compose({ cho, jung, jong }) {
  return String.fromCharCode(FIRST + (CHO.indexOf(cho) * JUNG.length + JUNG.indexOf(jung)) * JONG.length + JONG.indexOf(jong));
}
