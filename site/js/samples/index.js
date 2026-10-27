// 샘플 패키지 진입점. 각 데이터 모듈을 화면에 쓰는 공통 형태로 바꿔 그룹별로 내보낸다.
// 샘플: { name, detail: [버튼 보조 문구 줄], basis: 근거 설명, frequencies: 코사인파 주파수 목록 }
import { INSTRUMENTS } from './instruments.js';
import { harmonicSeries } from './spectrum.js';

const instruments = INSTRUMENTS.map(({ name, pitch, f0, counts, basis }) => ({
  name,
  detail: [pitch, `${f0} Hz`],
  basis,
  frequencies: harmonicSeries(f0, counts),
}));

export const SAMPLE_GROUPS = [{ name: '악기', samples: instruments }];
