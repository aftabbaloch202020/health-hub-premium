import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { askPharmacist } from "@/lib/pharmacist.functions";
import { Mic, MicOff, PhoneOff, Phone, Volume2, User, UserRound, Languages } from "lucide-react";

type Turn = { role: "user" | "assistant"; text: string };
type Gender = "auto" | "female" | "male";
type Lang = "en-US" | "ur-PK";

// Browser SpeechRecognition type
type SR = typeof window extends { SpeechRecognition: infer T } ? T : any;

function getRecognition(): any | null {
  if (typeof window === "undefined") return null;
  const W = window as any;
  const Ctor = W.SpeechRecognition || W.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function pickVoice(voices: SpeechSynthesisVoice[], gender: Exclude<Gender, "auto">, lang: Lang) {
  const langPrefix = lang.split("-")[0];
  const inLang = voices.filter((v) => v.lang?.toLowerCase().startsWith(langPrefix));
  const pool = inLang.length ? inLang : voices;
  const femaleHints = ["female", "samantha", "victoria", "zira", "aria", "google uk english female", "amelia", "joanna", "salma", "asma"];
  const maleHints = ["male", "daniel", "david", "alex", "google uk english male", "fred", "mark", "asad", "hamza"];
  const hints = gender === "female" ? femaleHints : maleHints;
  const other = gender === "female" ? maleHints : femaleHints;
  const match = pool.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)));
  if (match) return match;
  const notOther = pool.find((v) => !other.some((h) => v.name.toLowerCase().includes(h)));
  return notOther ?? pool[0] ?? voices[0] ?? null;
}

// Detect gender from average voice pitch (very rough heuristic)
async function detectGenderFromMic(stream: MediaStream): Promise<Exclude<Gender, "auto">> {
  try {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AC();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    src.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);
    const sampleRate = ctx.sampleRate;
    const samples: number[] = [];
    const start = performance.now();
    while (performance.now() - start < 1200) {
      analyser.getFloatTimeDomainData(buf);
      // autocorrelation
      let bestOffset = -1, bestCorr = 0;
      const SIZE = buf.length;
      let rms = 0;
      for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / SIZE);
      if (rms > 0.01) {
        for (let offset = 32; offset < 1000; offset++) {
          let corr = 0;
          for (let i = 0; i < SIZE - offset; i++) corr += buf[i] * buf[i + offset];
          corr /= SIZE - offset;
          if (corr > bestCorr) { bestCorr = corr; bestOffset = offset; }
        }
        if (bestOffset > 0) samples.push(sampleRate / bestOffset);
      }
      await new Promise((r) => setTimeout(r, 80));
    }
    ctx.close();
    if (!samples.length) return "female";
    samples.sort((a, b) => a - b);
    const median = samples[Math.floor(samples.length / 2)];
    return median < 165 ? "male" : "female";
  } catch {
    return "female";
  }
}

export default function VoiceCallAssistant() {
  const ask = useServerFn(askPharmacist);
  const [active, setActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [gender, setGender] = useState<Gender>("auto");
  const [detected, setDetected] = useState<Exclude<Gender, "auto"> | null>(null);
  const [lang, setLang] = useState<Lang>("en-US");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const [levels, setLevels] = useState<number[]>(Array(28).fill(0.1));

  const recogRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const turnsRef = useRef<Turn[]>([]);
  turnsRef.current = turns;

  // Load voices
  useEffect(() => {
    if (typeof window === "undefined") return;
    const load = () => { voicesRef.current = window.speechSynthesis?.getVoices?.() ?? []; };
    load();
    window.speechSynthesis?.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis?.removeEventListener?.("voiceschanged", load);
  }, []);

  // Call timer
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const speak = (text: string) =>
    new Promise<void>((resolve) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return resolve();
      const eff: Exclude<Gender, "auto"> = gender === "auto" ? detected ?? "female" : gender;
      const v = pickVoice(voicesRef.current, eff, lang);
      const u = new SpeechSynthesisUtterance(text);
      if (v) u.voice = v;
      u.lang = v?.lang || lang;
      u.rate = 1; u.pitch = eff === "male" ? 0.9 : 1.1;
      u.onstart = () => setSpeaking(true);
      u.onend = () => { setSpeaking(false); resolve(); };
      u.onerror = () => { setSpeaking(false); resolve(); };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    });

  const startWaveform = (stream: MediaStream) => {
    const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new AC();
    audioCtxRef.current = ctx;
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(data);
      const next: number[] = [];
      const step = Math.max(1, Math.floor(data.length / 28));
      for (let i = 0; i < 28; i++) {
        const v = data[i * step] ?? 0;
        next.push(Math.max(0.08, Math.min(1, v / 220)));
      }
      setLevels(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const stopWaveform = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevels(Array(28).fill(0.1));
  };

  const listenOnce = (): Promise<string> =>
    new Promise((resolve) => {
      const r = getRecognition();
      if (!r) { setSupported(false); return resolve(""); }
      recogRef.current = r;
      r.lang = lang;
      r.interimResults = false;
      r.maxAlternatives = 1;
      r.continuous = false;
      let finalText = "";
      r.onresult = (e: any) => {
        for (let i = e.resultIndex; i < e.results.length; i++) {
          if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        }
      };
      r.onerror = () => resolve(finalText);
      r.onend = () => { setListening(false); resolve(finalText.trim()); };
      try { setListening(true); r.start(); } catch { setListening(false); resolve(""); }
    });

  const loop = async () => {
    while (active && !muted) {
      const heard = await listenOnce();
      if (!active) break;
      if (!heard) continue;
      const userTurn: Turn = { role: "user", text: heard };
      const nextTurns = [...turnsRef.current, userTurn];
      setTurns(nextTurns);
      try {
        const { reply } = await ask({ data: { messages: nextTurns.map((t) => ({ role: t.role, content: t.text })) } });
        const aTurn: Turn = { role: "assistant", text: reply };
        setTurns((cur) => [...cur, aTurn]);
        await speak(reply);
      } catch (e: any) {
        setError(e?.message || "Voice service failed");
        break;
      }
    }
  };

  const startCall = async () => {
    setError(null); setTurns([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setActive(true);
      startWaveform(stream);
      if (gender === "auto") {
        const g = await detectGenderFromMic(stream);
        setDetected(g);
      }
      const greeting = lang === "ur-PK"
        ? "السلام علیکم! میں Darman کا AI صحت اسسٹنٹ ہوں۔ آپ کیسا محسوس کر رہے ہیں؟"
        : "Hi, this is Darman's AI health assistant. How are you feeling today?";
      setTurns([{ role: "assistant", text: greeting }]);
      await speak(greeting);
      loop();
    } catch (e: any) {
      setError("Microphone permission denied.");
    }
  };

  const endCall = () => {
    setActive(false); setListening(false);
    try { recogRef.current?.stop?.(); } catch { /* */ }
    window.speechSynthesis?.cancel?.();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    stopWaveform();
    setDetected(null);
  };

  useEffect(() => () => endCall(), []); // cleanup

  const effGender: Exclude<Gender, "auto"> = gender === "auto" ? detected ?? "female" : gender;

  return (
    <section id="voice-call" className="relative py-20 overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950 text-white">
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/30 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live AI Voice Call
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight">Talk to Darman AI Doctor</h2>
          <p className="mt-3 text-white/70 max-w-xl mx-auto">Natural phone-style conversation in English or Urdu. Auto-matches a male or female voice based on yours.</p>
        </div>

        <div className="max-w-2xl mx-auto rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 shadow-2xl p-6 sm:p-10">
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <div className="flex rounded-full bg-white/10 p-1 text-xs">
              {(["auto","female","male"] as Gender[]).map((g) => (
                <button key={g} onClick={() => setGender(g)} disabled={active}
                  className={`px-3 py-1.5 rounded-full transition ${gender === g ? "bg-emerald-500 text-white" : "text-white/70 hover:text-white"}`}>
                  {g === "auto" ? "Auto detect" : g === "female" ? <span className="inline-flex items-center gap-1"><UserRound className="w-3 h-3"/>Female</span> : <span className="inline-flex items-center gap-1"><User className="w-3 h-3"/>Male</span>}
                </button>
              ))}
            </div>
            <div className="flex rounded-full bg-white/10 p-1 text-xs">
              {([["en-US","English"],["ur-PK","اردو"]] as [Lang,string][]).map(([code,label]) => (
                <button key={code} onClick={() => setLang(code)} disabled={active}
                  className={`px-3 py-1.5 rounded-full transition inline-flex items-center gap-1 ${lang === code ? "bg-indigo-500 text-white" : "text-white/70 hover:text-white"}`}>
                  <Languages className="w-3 h-3"/>{label}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar + pulse */}
          <div className="relative mx-auto w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center mb-6">
            {active && (
              <>
                <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-emerald-400/15 animate-ping [animation-delay:300ms]" />
              </>
            )}
            <div className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full grid place-items-center text-5xl shadow-2xl ${effGender === "male" ? "bg-gradient-to-br from-sky-400 to-indigo-600" : "bg-gradient-to-br from-pink-400 to-emerald-500"}`}>
              {speaking ? <Volume2 className="w-12 h-12 text-white animate-pulse" /> : (effGender === "male" ? <User className="w-14 h-14 text-white" /> : <UserRound className="w-14 h-14 text-white" />)}
            </div>
          </div>

          {/* Status */}
          <div className="text-center mb-6">
            <div className="text-sm text-white/60">{active ? (speaking ? "Speaking…" : listening ? "Listening…" : "Connected") : "Tap to start a call"}</div>
            {active && <div className="text-2xl font-mono tracking-wider mt-1">{fmt(seconds)}</div>}
            {detected && gender === "auto" && <div className="text-xs text-emerald-300 mt-1">Detected: {detected} voice</div>}
          </div>

          {/* Waveform */}
          <div className="flex items-end justify-center gap-1 h-20 mb-6">
            {levels.map((v, i) => (
              <span key={i} style={{ height: `${Math.max(8, v * 100)}%` }}
                className={`w-1.5 sm:w-2 rounded-full transition-[height] duration-100 ${active ? "bg-gradient-to-t from-emerald-400 to-indigo-400" : "bg-white/20"}`} />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-4">
            {!active ? (
              <button onClick={startCall} className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.6)] transition active:scale-95">
                <Phone className="w-5 h-5" /> <span className="font-semibold">Start Call</span>
              </button>
            ) : (
              <>
                <button onClick={() => setMuted((m) => !m)} className={`w-14 h-14 rounded-full grid place-items-center transition ${muted ? "bg-white/20" : "bg-white/10 hover:bg-white/20"}`} aria-label="Mute">
                  {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button onClick={endCall} className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 grid place-items-center shadow-[0_10px_40px_-10px_rgba(244,63,94,0.6)] active:scale-95 transition" aria-label="End call">
                  <PhoneOff className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {!supported && <div className="mt-6 text-xs text-amber-300 text-center">Speech recognition isn't supported in this browser. Use Chrome or Edge on Android/desktop.</div>}
          {error && <div className="mt-6 text-sm text-rose-300 text-center">{error}</div>}

          {/* Transcript */}
          {turns.length > 0 && (
            <div className="mt-8 max-h-64 overflow-y-auto space-y-2 rounded-2xl bg-black/30 p-4 border border-white/10">
              {turns.map((t, i) => (
                <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] text-sm px-3 py-2 rounded-2xl ${t.role === "user" ? "bg-emerald-500/30 rounded-br-sm" : "bg-white/10 rounded-bl-sm"}`}>{t.text}</div>
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-[11px] text-white/40 text-center">AI voice guidance is informational only and not a substitute for a licensed doctor.</p>
        </div>
      </div>
    </section>
  );
}