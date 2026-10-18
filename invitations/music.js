// ===== מנגינות רקע: נוצרות בדפדפן (Web Audio), בלי קבצים ובלי זכויות יוצרים =====
// לחנים קלאסיים ועממיים שנמצאים בנחלת הכלל, ושני לחנים מקוריים.
// תווים: "C5:1" = דו באוקטבה 5 למשך פעמה; "R:2" = הפסקה; "C4+E4+G4:4" = אקורד.

const repeatBars = (bars, n) => Array(n).fill(bars).join(' ');

// ארפג'ו של אקורד בשמיניות: שורש-טרצה-קווינטה-טרצה, פעמיים
const arp = (notes, beats) => {
  const seq = [notes[0], notes[1], notes[2], notes[1]];
  return Array.from({ length: beats * 2 }, (_, i) => `${seq[i % 4]}:.5`).join(' ');
};

const CANON_CHORDS = [
  ['D4', 'F#4', 'A4'], ['A3', 'C#4', 'E4'], ['B3', 'D4', 'F#4'], ['F#3', 'A3', 'C#4'],
  ['G3', 'B3', 'D4'], ['D4', 'F#4', 'A4'], ['G3', 'B3', 'D4'], ['A3', 'C#4', 'E4']
];
const PARTY_CHORDS = [['A4', 'C5', 'E5'], ['F4', 'A4', 'C5'], ['E4', 'G4', 'C5'], ['D4', 'G4', 'B4']];
const ROMANTIC_CHORDS = [['C3', 'G3', 'E4'], ['A2', 'E3', 'C4'], ['F2', 'C3', 'A3'], ['G2', 'D3', 'B3']];

const MUSIC = {
  wagner: {
    label: 'מארש החתונה – ואגנר',
    tempo: 72,
    tracks: [
      { inst: 'bell', notes: 'C5:1 F5:.75 F5:.25 F5:2 C5:1 G5:.75 E5:.25 F5:2 C5:1 F5:.75 Bb5:.25 Bb5:1 A5:.75 G5:.25 F5:1 E5:.75 F5:.25 G5:2 ' +
        'C5:1 F5:.75 F5:.25 F5:2 C5:1 G5:.75 E5:.25 F5:2 C5:1 F5:.75 Bb5:.25 Bb5:1 A5:.75 G5:.25 F5:1 E5:.75 G5:.25 F5:2 R:2' },
      { inst: 'pad', notes: 'F3+A3+C4:4 C3+E3+G3:2 F3+A3+C4:2 F3+A3+C4:2 Bb2+D3+F3:2 F3+A3+C4:2 C3+E3+G3:2 ' +
        'F3+A3+C4:4 C3+E3+G3:2 F3+A3+C4:2 F3+A3+C4:2 Bb2+D3+F3:2 C3+E3+G3:2 F3+A3+C4:2 R:2' },
      { inst: 'bass', notes: 'F2:4 C3:2 F2:2 F2:2 Bb2:2 F2:2 C3:2 F2:4 C3:2 F2:2 F2:2 Bb2:2 C3:2 F2:2 R:2' }
    ]
  },
  canon: {
    label: 'הקאנון של פכלבל',
    tempo: 66,
    tracks: [
      { inst: 'bell', notes: 'F#5:2 E5:2 D5:2 C#5:2 B4:2 A4:2 B4:2 C#5:2 '.repeat(2) },
      { inst: 'bell', gain: .6, notes: 'R:16 D5:2 C#5:2 B4:2 A4:2 G4:2 F#4:2 G4:2 E4:2' },
      { inst: 'pluck', notes: 'R:16 ' + CANON_CHORDS.map((c) => arp(c, 2)).join(' ') },
      { inst: 'pad', notes: repeatBars(CANON_CHORDS.map((c) => `${c.join('+')}:2`).join(' '), 2) },
      { inst: 'bass', notes: 'D3:2 A2:2 B2:2 F#2:2 G2:2 D2:2 G2:2 A2:2 '.repeat(2) }
    ]
  },
  romantic: {
    label: 'פסנתר רומנטי (מקורי)',
    tempo: 76,
    tracks: [
      { inst: 'bell', notes: 'E5:3 G5:1 E5:2 C5:2 A5:3 G5:1 D5:4 E5:1 F5:1 G5:2 A5:2 C6:1 B5:1 A5:2 F5:2 G5:2 B4:2' },
      { inst: 'piano', notes: repeatBars(ROMANTIC_CHORDS.map((c) => arp(c, 4)).join(' '), 2) },
      { inst: 'bass', notes: 'C2:4 A1:4 F1:4 G1:4 '.repeat(2) }
    ]
  },
  joy: {
    label: 'אודה לשמחה – בטהובן',
    tempo: 104,
    tracks: [
      { inst: 'bell', notes: 'E5:1 E5:1 F5:1 G5:1 G5:1 F5:1 E5:1 D5:1 C5:1 C5:1 D5:1 E5:1 E5:1.5 D5:.5 D5:2 ' +
        'E5:1 E5:1 F5:1 G5:1 G5:1 F5:1 E5:1 D5:1 C5:1 C5:1 D5:1 E5:1 D5:1.5 C5:.5 C5:2' },
      { inst: 'pad', notes: 'C4+E4+G4:4 G3+B3+D4:4 C4+E4+G4:4 G3+B3+D4:4 C4+E4+G4:4 G3+B3+D4:4 C4+E4+G4:4 G3+B3+D4:2 C4+E4+G4:2' },
      { inst: 'bass', notes: 'C3:2 C3:2 G2:2 G2:2 C3:2 C3:2 G2:2 G2:2 C3:2 C3:2 G2:2 G2:2 C3:2 C3:2 G2:2 C3:2' }
    ]
  },
  birthday: {
    label: 'יום הולדת שמח',
    tempo: 100,
    tracks: [
      { inst: 'bell', notes: 'G4:.75 G4:.25 A4:1 G4:1 C5:1 B4:2 G4:.75 G4:.25 A4:1 G4:1 D5:1 C5:2 G4:.75 G4:.25 G5:1 E5:1 C5:1 B4:1 A4:1 F5:.75 F5:.25 E5:1 C5:1 D5:1 C5:3 R:2' },
      { inst: 'bass', notes: 'R:1 C3:3 G2:3 G2:3 C3:3 C3:3 F2:3 C3:1.5 G2:1.5 C3:3 R:2' },
      { inst: 'pluck', gain: .5, notes: 'R:1 E4+G4:3 D4+G4:3 D4+F4:3 E4+G4:3 E4+G4:3 F4+A4:3 E4+G4:3 E4+G4:3 R:2' }
    ]
  },
  lullaby: {
    label: 'שיר ערש – ברהמס',
    tempo: 60,
    tracks: [
      { inst: 'bell', notes: 'E4:.5 E4:.5 G4:2 E4:.5 E4:.5 G4:2 E4:.5 G4:.5 C5:1 B4:1.5 A4:.5 A4:1 G4:1 D4:.5 E4:.5 F4:1 D4:1 D4:.5 E4:.5 F4:2 D4:.5 F4:.5 B4:.5 A4:.5 G4:1 B4:1 C5:3 R:1' },
      { inst: 'pad', notes: 'R:1 C3+G3+E4:3 C3+G3+E4:3 F3+A3+C4:3 C3+G3+E4:3 G2+F3+B3:3 G2+F3+B3:3 G2+F3+D4:3 C3+G3+E4:3 R:1' }
    ]
  },
  party: {
    label: 'מקצב מסיבה (מקורי)',
    tempo: 120,
    tracks: [
      { inst: 'pluck', notes: repeatBars(PARTY_CHORDS.map((c) => arp(c, 4)).join(' '), 2) },
      { inst: 'bass', notes: repeatBars('A2:.5 A3:.5 '.repeat(4) + 'F2:.5 F3:.5 '.repeat(4) + 'C3:.5 C4:.5 '.repeat(4) + 'G2:.5 G3:.5 '.repeat(4), 2) },
      { inst: 'kick', notes: 'C2:1 '.repeat(32) },
      { inst: 'hat', notes: 'R:.5 C2:.5 '.repeat(32) }
    ]
  }
};

// ---------- המנוע ----------
const NOTE_INDEX = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteFreq(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return 0;
  const midi = 12 * (Number(m[3]) + 1) + NOTE_INDEX[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function parseTrack(str) {
  let beat = 0;
  const events = [];
  str.trim().split(/\s+/).forEach((token) => {
    const [notes, len] = token.split(':');
    const dur = Number(len);
    if (notes !== 'R') notes.split('+').forEach((n) => events.push({ beat, dur, freq: noteFreq(n) }));
    beat += dur;
  });
  return { events, length: beat };
}

class MusicPlayer {
  constructor() {
    this.ctx = null;
    this.audio = null;
    this.timer = null;
    this.playing = false;
  }

  setup() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.32;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(this.ctx.destination);

    // הד קטן – נותן לצליל תחושת אולם
    const reverb = this.ctx.createConvolver();
    const len = this.ctx.sampleRate * 2.2;
    const impulse = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    reverb.buffer = impulse;
    this.wet = this.ctx.createGain();
    this.wet.gain.value = 0.28;
    this.wet.connect(reverb).connect(comp);

    const noiseLen = this.ctx.sampleRate * 0.1;
    this.noise = this.ctx.createBuffer(1, noiseLen, this.ctx.sampleRate);
    const nd = this.noise.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
  }

  out(node) {
    node.connect(this.master);
    node.connect(this.wet);
  }

  voice(inst, freq, t, dur, gainScale) {
    const ctx = this.ctx;
    const g = ctx.createGain();
    const peak = { bell: .22, piano: .14, pluck: .12, pad: .05, bass: .2, kick: .9, hat: .08 }[inst] * gainScale;

    if (inst === 'kick') {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(40, t + .12);
      g.gain.setValueAtTime(peak, t);
      g.gain.exponentialRampToValueAtTime(.001, t + .25);
      o.connect(g).connect(this.master);
      o.start(t); o.stop(t + .3);
      return;
    }
    if (inst === 'hat') {
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 7000;
      g.gain.setValueAtTime(peak, t);
      g.gain.exponentialRampToValueAtTime(.001, t + .05);
      src.connect(hp).connect(g).connect(this.master);
      src.start(t); src.stop(t + .06);
      return;
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    const oscs = [];
    const add = (type, mult, level, detune = 0) => {
      const o = ctx.createOscillator();
      const og = ctx.createGain();
      o.type = type; o.frequency.value = freq * mult; o.detune.value = detune;
      og.gain.value = level;
      o.connect(og).connect(filter);
      oscs.push(o);
    };

    let release;
    if (inst === 'pad') {
      add('sawtooth', 1, .5, -7); add('sawtooth', 1, .5, 7);
      filter.frequency.value = 900;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + .4);
      g.gain.setValueAtTime(peak, t + Math.max(.4, dur - .1));
      g.gain.linearRampToValueAtTime(0, t + dur + .6);
      release = dur + .7;
    } else {
      if (inst === 'bell') { add('triangle', 1, 1); add('sine', 2, .25); add('sine', 3, .08); filter.frequency.value = 4000; }
      if (inst === 'piano') { add('triangle', 1, 1); add('sine', 2, .2); filter.frequency.value = 2500; }
      if (inst === 'pluck') { add('square', 1, .5); add('triangle', 1, .6); filter.frequency.value = 1800; }
      if (inst === 'bass') { add('triangle', 1, 1); add('sine', .5, .5); filter.frequency.value = 600; }
      const decay = inst === 'pluck' ? .35 : inst === 'bass' ? dur + .2 : dur + 1.2;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(peak, t + .01);
      g.gain.exponentialRampToValueAtTime(.001, t + decay);
      release = decay + .05;
    }
    filter.connect(g);
    this.out(g);
    oscs.forEach((o) => { o.start(t); o.stop(t + release); });
  }

  scheduleLoop(song, start) {
    const spb = 60 / song.tempo;
    let length = 0;
    song.parsed.forEach(({ track, parsed }) => {
      length = Math.max(length, parsed.length);
      parsed.events.forEach((e) => {
        if (e.freq) this.voice(track.inst, e.freq, start + e.beat * spb, e.dur * spb, track.gain || 1);
      });
    });
    const end = start + length * spb;
    // מתזמנים את הסיבוב הבא קצת לפני שהנוכחי נגמר
    this.timer = setTimeout(() => { if (this.playing) this.scheduleLoop(song, end); }, Math.max(0, (end - this.ctx.currentTime - 1) * 1000));
  }

  play(id, customUrl) {
    this.stop();
    if (customUrl) {
      this.audio = new Audio(customUrl);
      this.audio.loop = true;
      this.audio.volume = 0.6;
      this.playing = true;
      return this.audio.play().catch(() => { this.playing = false; });
    }
    const song = MUSIC[id];
    if (!song) return Promise.resolve();
    this.setup();
    if (!song.parsed) song.parsed = song.tracks.map((track) => ({ track, parsed: parseTrack(track.notes) }));
    this.playing = true;
    this.master.gain.cancelScheduledValues(this.ctx.currentTime);
    this.master.gain.setValueAtTime(.32, this.ctx.currentTime);
    return this.ctx.resume().then(() => this.scheduleLoop(song, this.ctx.currentTime + .1));
  }

  stop() {
    this.playing = false;
    clearTimeout(this.timer);
    if (this.audio) { this.audio.pause(); this.audio = null; }
    if (this.ctx) {
      // השתקה מהירה של צלילים שכבר תוזמנו, ואז הקשר נסגר ונפתח מחדש בהשמעה הבאה
      const old = this.ctx;
      this.master.gain.setTargetAtTime(0, old.currentTime, .05);
      setTimeout(() => old.close(), 300);
      this.ctx = null;
    }
  }
}
