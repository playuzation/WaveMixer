// Web Audio로 코사인파 묶음이나 미리 계산한 소리를 재생한다. 한 번에 하나의 소리(voice)만 낸다.
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

// 주어진 파동들({ frequency, amplitude, envelope? })의 진폭 × cos 합을 같은 위상(동시 시작)으로 재생한다.
// envelope { attack, stages: [{ level, timeConstant }] }이 있으면 파동마다 그 모양으로 커지고 줄어든다.
// 나이퀴스트 주파수 이상은 재생할 수 없으므로 제외한다.
// duration(초)을 주면 그 길이만큼만 재생하고 스스로 끝난다. 없으면 stop()까지 계속된다.
// vibrato { rate: Hz, depth: 센트 }를 주면 모든 파동의 높이를 같은 비율로 함께 흔든다.
export function play(waves, duration, vibrato) {
  stop();
  const ac = ensureContext();
  const playable = waves.filter(({ frequency }) => frequency < ac.sampleRate / 2);
  if (!playable.length) return;

  const now = ac.currentTime;
  const level = LEVEL / waves.reduce((sum, { amplitude }) => sum + amplitude, 0);
  // 파동마다 시작 모양이 있으면 전체 시작은 바로 하고 그 모양을 따른다.
  const attack = playable.some((wave) => wave.envelope) ? 0 : ATTACK;
  const output = ac.createGain();
  output.gain.setValueAtTime(0, now);
  output.gain.linearRampToValueAtTime(level, now + attack);
  output.connect(ac.destination);

  const oscillators = playable.map(({ frequency, amplitude, envelope }) => {
    const oscillator = ac.createOscillator();
    oscillator.setPeriodicWave(cosine);
    oscillator.frequency.value = frequency;
    for (const gain of waveGains(ac, now, amplitude, envelope)) oscillator.connect(gain).connect(output);
    oscillator.start(now);
    return oscillator;
  });

  const sources = [...oscillators];
  if (vibrato) {
    const lfo = ac.createOscillator();
    lfo.frequency.value = vibrato.rate;
    const depth = ac.createGain();
    depth.gain.value = vibrato.depth;
    lfo.connect(depth);
    oscillators.forEach((oscillator) => depth.connect(oscillator.detune));
    lfo.start(now);
    sources.push(lfo);
  }

  track(output, sources);

  if (duration) {
    const end = now + duration;
    output.gain.setValueAtTime(level, end - RELEASE);
    output.gain.linearRampToValueAtTime(0, end);
    sources.forEach((source) => source.stop(end));
  }
}

// 파동 하나의 세기. envelope이 있으면 단계마다 attack 동안 커진 뒤 timeConstant로 줄어든다.
function waveGains(ac, now, amplitude, envelope) {
  if (!envelope) {
    const gain = ac.createGain();
    gain.gain.value = amplitude;
    return [gain];
  }
  return envelope.stages.map(({ level, timeConstant }) => {
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(level, now + envelope.attack);
    if (timeConstant) gain.gain.setTargetAtTime(0, now + envelope.attack, timeConstant);
    return gain;
  });
}

// 미리 계산한 소리(진폭 −1~1 배열)를 처음부터 끝까지 한 번 재생한다.
export function playBuffer(samples, sampleRate) {
  stop();
  const ac = ensureContext();
  const buffer = ac.createBuffer(1, samples.length, sampleRate);
  buffer.copyToChannel(samples, 0);

  const output = ac.createGain();
  output.gain.value = LEVEL;
  output.connect(ac.destination);

  const source = ac.createBufferSource();
  source.buffer = buffer;
  source.connect(output);
  source.start();
  track(output, [source]);
}

// 재생 중인 소리를 기억하고, 스스로 끝나면 연결을 정리한다.
function track(output, sources) {
  const current = { output, sources };
  sources[0].onended = () => {
    output.disconnect();
    if (voice === current) voice = null;
  };
  voice = current;
}

export function stop() {
  if (!voice) return;
  const { output, sources } = voice;
  voice = null;

  const now = context.currentTime;
  output.gain.cancelScheduledValues(now);
  output.gain.setValueAtTime(output.gain.value, now);
  output.gain.linearRampToValueAtTime(0, now + RELEASE);
  sources.forEach((source) => source.stop(now + RELEASE));
}
