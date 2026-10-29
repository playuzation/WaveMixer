// 고속 푸리에 변환(FFT, 기수 2). re·im 배열을 그 자리에서 바꾼다. 길이는 2의 거듭제곱이어야 한다.
// 크기마다 회전 인자(cos·sin) 표를 한 번 만들어 둔다.
const tables = new Map();

function twiddles(n) {
  if (!tables.has(n)) {
    const cos = new Float64Array(n / 2);
    const sin = new Float64Array(n / 2);
    for (let k = 0; k < n / 2; k++) {
      cos[k] = Math.cos((-2 * Math.PI * k) / n);
      sin[k] = Math.sin((-2 * Math.PI * k) / n);
    }
    tables.set(n, { cos, sin });
  }
  return tables.get(n);
}

export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      const r = re[i];
      re[i] = re[j];
      re[j] = r;
      const m = im[i];
      im[i] = im[j];
      im[j] = m;
    }
  }
  const { cos, sin } = twiddles(n);
  for (let size = 2; size <= n; size <<= 1) {
    const half = size >> 1;
    const stride = n / size;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k++) {
        const wRe = cos[k * stride];
        const wIm = sin[k * stride];
        const a = start + k;
        const b = a + half;
        const tRe = re[b] * wRe - im[b] * wIm;
        const tIm = re[b] * wIm + im[b] * wRe;
        re[b] = re[a] - tRe;
        im[b] = im[a] - tIm;
        re[a] += tRe;
        im[a] += tIm;
      }
    }
  }
}

export const nextPowerOfTwo = (n) => 2 ** Math.ceil(Math.log2(Math.max(1, n)));
