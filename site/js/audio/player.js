// Web Audio로 코사인파 묶음을 재생한다. 한 번에 하나의 소리(voice)만 낸다.
const LEVEL = 0.25;
const ATTACK = 0.01;
const RELEASE = 0.04;

let context = null;
let cosine = null;
let voice = null;

function ensureContext() {
  if (!context) {
    context = new (window.AudioContext || window.webkitAudioContext)();
    // real[1] = 1 → 위상 0의 cos 파형
    cosine = context.createPeriodicWave(new Float32Array([0, 1]), new Float32Array([0, 0]));
  }
  if (context.state === 'suspended') context.resume();
  return context;
}

// 모바일 브라우저는 사용자 동작 안에서만 오디오를 허용하므로, 첫 상호작용 때 미리 깨워 둔다.
export function unlock() {
  ensureContext();
}

// 주어진 주파수들의 cos 합을 같은 위상(동시 시작)으로 재생한다.
// 나이퀴스트 주파수 이상은 재생할 수 없으므로 제외한다.
export function play(frequencies) {
  stop();
  const ac = ensureContext();
  const playable = frequencies.filter((frequency) => frequency < ac.sampleRate / 2);
  if (!playable.length) return;

  const now = ac.currentTime;
  const output = ac.createGain();
  output.gain.setValueAtTime(0, now);
  output.gain.linearRampToValueAtTime(LEVEL / frequencies.length, now + ATTACK);
  output.connect(ac.destination);

  const oscillators = playable.map((frequency) => {
    const oscillator = ac.createOscillator();
    oscillator.setPeriodicWave(cosine);
    oscillator.frequency.value = frequency;
    oscillator.connect(output);
    oscillator.start(now);
    return oscillator;
  });
  voice = { output, oscillators };
}

export function stop() {
  if (!voice) return;
  const { output, oscillators } = voice;
  voice = null;

  const now = context.currentTime;
  output.gain.cancelScheduledValues(now);
  output.gain.setValueAtTime(output.gain.value, now);
  output.gain.linearRampToValueAtTime(0, now + RELEASE);
  oscillators.forEach((oscillator) => oscillator.stop(now + RELEASE));
  oscillators[0].onended = () => output.disconnect();
}
