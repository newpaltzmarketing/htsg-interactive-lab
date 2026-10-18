// Original synthesized effects; quiet by default and activated only by a user action.
export function createGameAudio() {
  let context, enabled = false, paused = true;
  const voices = new Set();
  const sounds = {
    fire: [['sine', 620, 170, 0.07, 0.025]],
    spread: [['triangle', 450, 120, 0.09, 0.025], ['sine', 820, 290, 0.065, 0.014]],
    lance: [['sine', 1100, 360, 0.12, 0.025], ['triangle', 220, 110, 0.09, 0.018]],
    missile: [['triangle', 130, 380, 0.23, 0.035], ['sine', 90, 45, 0.2, 0.025]],
    destroy: [['triangle', 190, 55, 0.11, 0.028]],
    pickup: [['sine', 520, 880, 0.13, 0.04], ['sine', 780, 1170, 0.12, 0.025, 0.07]],
    upgrade: [['sine', 440, 660, 0.15, 0.035], ['sine', 660, 990, 0.17, 0.035, 0.09], ['triangle', 880, 1320, 0.19, 0.025, 0.18]],
    impact: [['triangle', 110, 45, 0.2, 0.06]],
    warning: [['triangle', 220, 440, 0.2, 0.035], ['sine', 330, 660, 0.18, 0.022, 0.12]],
    revision: [['triangle', 320, 260, 0.07, 0.03], ['triangle', 360, 290, 0.07, 0.03, 0.1], ['triangle', 400, 320, 0.09, 0.03, 0.2]],
    bossEnter: [['triangle', 100, 160, 0.35, 0.035], ['sine', 200, 320, 0.25, 0.025, 0.15]],
    bossClear: [['triangle', 120, 50, 0.3, 0.04], ['sine', 523, 523, 0.19, 0.035, 0.12], ['sine', 659, 659, 0.2, 0.035, 0.25], ['sine', 784, 1046, 0.3, 0.035, 0.38]],
    waveClear: [['sine', 440, 660, 0.1, 0.025], ['sine', 660, 880, 0.16, 0.025, 0.1]],
  };
  function stopVoices() {
    for (const voice of voices) { try { voice.stop(); } catch {} }
    voices.clear();
  }
  async function toggle() {
    try {
      if (!context) { const Audio = globalThis.AudioContext || globalThis.webkitAudioContext; if (!Audio) return false; context = new Audio(); }
      enabled = !enabled;
      if (!enabled) stopVoices();
      await (enabled && !paused ? context.resume() : context.suspend());
    } catch { enabled = false; }
    return enabled;
  }
  function setPaused(value) {
    paused = value;
    if (!context) return;
    stopVoices();
    void (enabled && !paused ? context.resume() : context.suspend()).catch(() => {});
  }
  function play(kind) {
    if (!enabled || paused || !context || voices.size >= 8) return;
    for (const [wave, from, to, duration, volume, delay = 0] of sounds[kind] || sounds.pickup) {
      if (voices.size >= 8) break;
      try {
        const oscillator = context.createOscillator(), gain = context.createGain(), now = context.currentTime + delay;
        oscillator.type = wave;
        oscillator.frequency.setValueAtTime(from, now); oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
        gain.gain.setValueAtTime(0.001, now); gain.gain.linearRampToValueAtTime(volume, now + 0.006); gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        oscillator.connect(gain); gain.connect(context.destination); voices.add(oscillator);
        oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(now); oscillator.stop(now + duration);
      } catch { /* Sound must never interrupt play. */ }
    }
  }
  return { toggle, setPaused, play, get enabled() { return enabled; } };
}
