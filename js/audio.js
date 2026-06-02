/* ============================================================
   audio.js — SesMotoru: Web Audio ile tamamen sentezlenen,
   telifsiz ve offline çalışan spiritüel ses motoru.
   Türler:
     ton     → saf frekans (432/528 Hz…) + hafif sıcaklık
     gurultu → yağmur / orman / gece ambience (filtreli gürültü)
     can     → Tibet çanı (periyodik vuruş)
     pad     → lo-fi / derin / dişil ambient akor drone
   Aynı anda tek parça çalar. Volume + yumuşak fade.
   Global: window.SesMotoru (ayrıca eski FrekansCalar alias'ı)
   ============================================================ */

const SesMotoru = window.SesMotoru = (() => {
  let ctx = null, master = null, aktif = null, baslangic = 0;

  function ac() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = parseFloat(localStorage.getItem("kdm_muzik-vol-raw") || "0.6");
      master.connect(ctx.destination);
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function noiseBuffer(type) {
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    if (type === "brown") {
      let last = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    } else if (type === "pink") {
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = 0.99765 * b0 + w * 0.0990460; b1 = 0.96300 * b1 + w * 0.2965164; b2 = 0.57000 * b2 + w * 1.0526913; d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2; }
    } else {
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  function fadeIn(g, hedef, sure) {
    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(hedef, t + sure);
  }

  /* ---- tür kurucuları → { gain, stop() } ---- */
  function kurTon(hz) {
    const g = ctx.createGain(); fadeIn(g, 0.5, 0.8); g.connect(master);
    const o1 = ctx.createOscillator(); o1.type = "sine"; o1.frequency.value = hz; o1.connect(g);
    const o2 = ctx.createOscillator(); o2.type = "sine"; o2.frequency.value = hz * 1.004;
    const g2 = ctx.createGain(); g2.gain.value = 0.5; o2.connect(g2).connect(g);
    o1.start(); o2.start();
    return { gain: g, stop: () => { try { o1.stop(); o2.stop(); } catch (e) {} } };
  }
  function kurGurultu(alt) {
    const g = ctx.createGain(); g.connect(master);
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(alt === "gece" ? "brown" : alt === "orman" ? "pink" : "white");
    src.loop = true;
    let son = src, hedef = 0.4;
    if (alt === "yagmur") {
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 7000;
      src.connect(hp).connect(lp); son = lp; hedef = 0.5;
    } else if (alt === "orman") {
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1500; bp.Q.value = 0.7;
      src.connect(bp); son = bp; hedef = 0.45;
    } else { // gece
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 420;
      src.connect(lp); son = lp; hedef = 0.5;
    }
    son.connect(g); fadeIn(g, hedef, 1.2);
    // hafif rüzgâr/dalga hareketi
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;
    const lg = ctx.createGain(); lg.gain.value = hedef * 0.25; lfo.connect(lg).connect(g.gain); lfo.start();
    src.start();
    return { gain: g, stop: () => { try { src.stop(); lfo.stop(); } catch (e) {} } };
  }
  function kurCan() {
    const g = ctx.createGain(); g.gain.value = 1; g.connect(master);
    const vur = () => {
      const t = ctx.currentTime, base = 210, par = [1, 2.76, 5.4, 8.9], amp = [1, 0.6, 0.4, 0.25];
      par.forEach((p, i) => {
        const o = ctx.createOscillator(); o.type = "sine"; o.frequency.value = base * p;
        const e = ctx.createGain();
        e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(amp[i] * 0.4, t + 0.012);
        e.gain.exponentialRampToValueAtTime(0.0001, t + 4);
        o.connect(e).connect(g); o.start(t); o.stop(t + 4.3);
      });
    };
    vur();
    const timer = setInterval(vur, 7000);
    return { gain: g, stop: () => clearInterval(timer) };
  }
  function kurPad(alt) {
    const akorlar = { lofi: [220, 277.18, 329.63], derin: [110, 164.81, 220], disil: [261.63, 392, 523.25] };
    const akor = akorlar[alt] || akorlar.lofi;
    const g = ctx.createGain(); fadeIn(g, 0.4, 1.4); g.connect(master);
    const lp = ctx.createBiquadFilter(); lp.type = "lowpass";
    lp.frequency.value = alt === "derin" ? 600 : alt === "lofi" ? 1200 : 1500;
    lp.connect(g);
    const osc = [];
    akor.forEach(f => {
      const o = ctx.createOscillator(); o.type = alt === "derin" ? "sine" : "triangle"; o.frequency.value = f;
      const og = ctx.createGain(); og.gain.value = 0.3; o.connect(og).connect(lp); o.start(); osc.push(o);
    });
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
    const lg = ctx.createGain(); lg.gain.value = 0.12; lfo.connect(lg).connect(g.gain); lfo.start(); osc.push(lfo);
    return { gain: g, stop: () => osc.forEach(o => { try { o.stop(); } catch (e) {} }) };
  }

  function durdur() {
    if (!aktif) return;
    const a = aktif; aktif = null;
    try {
      const t = ctx.currentTime;
      a.gain.gain.cancelScheduledValues(t);
      a.gain.gain.setValueAtTime(a.gain.gain.value, t);
      a.gain.gain.linearRampToValueAtTime(0, t + 0.4);
    } catch (e) {}
    setTimeout(() => { try { a.stop(); } catch (e) {} }, 450);
  }

  function cal(track) {
    ac(); durdur();
    let s;
    if (track.tip === "ton") s = kurTon(track.hz);
    else if (track.tip === "gurultu") s = kurGurultu(track.alt);
    else if (track.tip === "can") s = kurCan();
    else if (track.tip === "pad") s = kurPad(track.alt);
    else s = kurTon(432);
    aktif = s; baslangic = ctx.currentTime;
    return true;
  }

  function setVolume(v) { if (!master) ac(); master.gain.value = v; try { localStorage.setItem("kdm_muzik-vol-raw", String(v)); } catch (e) {} }
  function gecen() { return ctx ? Math.max(0, ctx.currentTime - baslangic) : 0; }
  function caliyor() { return !!aktif; }

  return { cal, durdur, setVolume, gecen, caliyor };
})();

/* Geriye dönük uyum: tek frekans çalan eski API */
const FrekansCalar = window.FrekansCalar = {
  cal(hz) { return SesMotoru.cal({ tip: "ton", hz }); },
  durdur() { SesMotoru.durdur(); },
  calanHz() { return null; }
};
