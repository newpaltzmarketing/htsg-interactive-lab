// Original synthesized effects; quiet by default and activated only by a user action.
export function createGameAudio() {
  let context, enabled = false, paused = true;
  const voices = new Set();
  async function toggle() {
    try {
      if (!context) { const Audio = globalThis.AudioContext || globalThis.webkitAudioContext; if (!Audio) return false; context = new Audio(); }
      enabled = !enabled;
      await (enabled && !paused ? context.resume() : context.suspend());
    } catch { enabled = false; }
    return enabled;
  }
  function setPaused(value) {
    paused = value;
    if (!context) return;
    for (const voice of voices) { try { voice.stop(); } catch {} }
    voices.clear();
    void (enabled && !paused ? context.resume() : context.suspend()).catch(() => {});
  }
  function play(kind) {
    if (!enabled || paused || !context || voices.size >= 8) return;
    const sounds = { fire: [380, 150, 0.045, 0.025], pickup: [520, 880, 0.15, 0.07], upgrade: [420, 1050, 0.22, 0.08], impact: [110, 45, 0.2, 0.08], warning: [250, 320, 0.22, 0.06] };
    const [from, to, duration, volume] = sounds[kind] || sounds.pickup;
    try {
      const oscillator = context.createOscillator(), gain = context.createGain(), now = context.currentTime;
      oscillator.type = kind === 'impact' ? 'triangle' : 'sine';
      oscillator.frequency.setValueAtTime(from, now); oscillator.frequency.exponentialRampToValueAtTime(to, now + duration);
      gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      oscillator.connect(gain); gain.connect(context.destination); voices.add(oscillator);
      oscillator.onended = () => { voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
      oscillator.start(); oscillator.stop(now + duration);
    } catch { /* Sound must never interrupt play. */ }
  }
  return { toggle, setPaused, play, get enabled() { return enabled; } };
}
