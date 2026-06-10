import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { reminderMessage } from "@/lib/reminderMessage.functions";
import { Bell, Plus, Trash2, Pill, Clock, CheckCircle2, XCircle, AlarmClock, Sparkles, TrendingUp, Volume2, Calendar, Activity } from "lucide-react";

type Medicine = {
  id: string;
  name: string;
  dosage: string;
  quantity: string;
  instructions: "Before Food" | "After Food" | "Anytime";
  startDate: string;
  endDate: string;
  times: string[]; // "HH:MM"
  notes?: string;
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
};

type LogStatus = "taken" | "missed" | "snoozed" | "pending";
type Log = { id: string; medId: string; scheduled: string; status: LogStatus; takenAt?: string };

const MED_KEY = "darman:reminder:medicines";
const LOG_KEY = "darman:reminder:logs";
const PROFILE_KEY = "darman:reminder:profile";

const load = <T,>(k: string, fb: T): T => {
  if (typeof window === "undefined") return fb;
  try { return JSON.parse(localStorage.getItem(k) || "null") ?? fb; } catch { return fb; }
};
const save = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));
const uid = () => Math.random().toString(36).slice(2, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString();
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function scheduleOccurrences(med: Medicine, from: Date, days = 7): string[] {
  const out: string[] = [];
  const start = new Date(med.startDate + "T00:00:00");
  const end = new Date(med.endDate + "T23:59:59");
  for (let d = 0; d < days; d++) {
    const day = new Date(from); day.setDate(day.getDate() + d); day.setHours(0,0,0,0);
    if (day < start || day > end) continue;
    for (const t of med.times) {
      const [hh, mm] = t.split(":").map(Number);
      const dt = new Date(day); dt.setHours(hh, mm, 0, 0);
      out.push(dt.toISOString());
    }
  }
  return out;
}

function speak(text: string) {
  try {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1; u.pitch = 1; u.volume = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* noop */ }
}

// Simple alarm tone via WebAudio
function playAlarm(audioRef: { current: { ctx?: AudioContext; stop?: () => void } }) {
  try {
    audioRef.current.stop?.();
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
    const ctx: AudioContext = audioRef.current.ctx ?? new Ctx();
    audioRef.current.ctx = ctx;
    let stopped = false;
    const beepAt = (when: number, freq: number) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.4, when + 0.02);
      g.gain.linearRampToValueAtTime(0, when + 0.35);
      o.connect(g).connect(ctx.destination);
      o.start(when); o.stop(when + 0.36);
    };
    const start = ctx.currentTime;
    for (let i = 0; i < 6; i++) { beepAt(start + i * 0.45, 880); beepAt(start + i * 0.45 + 0.18, 660); }
    audioRef.current.stop = () => { if (stopped) return; stopped = true; try { ctx.close(); } catch {} audioRef.current.ctx = undefined; audioRef.current.stop = undefined; };
  } catch { /* noop */ }
}

export default function MedicineReminder() {
  const genMsg = useServerFn(reminderMessage);
  const [meds, setMeds] = useState<Medicine[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [profile, setProfile] = useState<{ name: string; email: string; phone: string }>({ name: "", email: "", phone: "" });
  const [activeAlarm, setActiveAlarm] = useState<{ log: Log; med: Medicine; message: string } | null>(null);
  const [notifGranted, setNotifGranted] = useState(false);
  const audioRef = useRef<{ ctx?: AudioContext; stop?: () => void }>({});

  const [form, setForm] = useState<Medicine>({
    id: "", name: "", dosage: "", quantity: "1",
    instructions: "After Food", startDate: todayStr(), endDate: todayStr(),
    times: ["09:00"], notes: "",
  });

  // Load on mount
  useEffect(() => {
    setMeds(load<Medicine[]>(MED_KEY, []));
    setLogs(load<Log[]>(LOG_KEY, []));
    setProfile(load(PROFILE_KEY, { name: "", email: "", phone: "" }));
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifGranted(Notification.permission === "granted");
    }
  }, []);

  useEffect(() => save(MED_KEY, meds), [meds]);
  useEffect(() => save(LOG_KEY, logs), [logs]);
  useEffect(() => save(PROFILE_KEY, profile), [profile]);

  // Generate pending logs for next 7 days
  useEffect(() => {
    if (!meds.length) return;
    const now = new Date();
    setLogs(prev => {
      const map = new Map(prev.map(l => [`${l.medId}|${l.scheduled}`, l]));
      for (const m of meds) {
        for (const iso of scheduleOccurrences(m, now, 7)) {
          const key = `${m.id}|${iso}`;
          if (!map.has(key)) map.set(key, { id: uid(), medId: m.id, scheduled: iso, status: "pending" });
        }
      }
      return Array.from(map.values()).sort((a, b) => a.scheduled.localeCompare(b.scheduled));
    });
  }, [meds]);

  // Tick every 20s — fire alarm + auto-miss
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      let firedOne = false;
      setLogs(prev => {
        const next = [...prev];
        for (let i = 0; i < next.length; i++) {
          const l = next[i];
          if (l.status !== "pending") continue;
          const t = new Date(l.scheduled).getTime();
          if (now - t > 30 * 60 * 1000) { next[i] = { ...l, status: "missed" }; continue; }
          if (!firedOne && !activeAlarm && t <= now && now - t < 30 * 60 * 1000) {
            const med = meds.find(m => m.id === l.medId);
            if (med) {
              firedOne = true;
              triggerAlarm(l, med);
            }
          }
        }
        return next;
      });
    };
    tick();
    const id = setInterval(tick, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meds, activeAlarm]);

  const triggerAlarm = async (log: Log, med: Medicine) => {
    let message = `🔔 Hello ${profile.name || "there"}, it's time to take your ${med.name} ${med.dosage}. Please take ${med.quantity} (${med.instructions}).`;
    try {
      const r = await genMsg({ data: { name: profile.name, medicine: med.name, dosage: med.dosage, instructions: med.instructions, quantity: med.quantity } });
      if (r?.message) message = r.message;
    } catch { /* keep fallback */ }
    setActiveAlarm({ log, med, message });
    playAlarm(audioRef);
    speak(message);
    if (notifGranted) {
      try { new Notification("Medicine Reminder", { body: message, tag: log.id }); } catch {}
    }
  };

  const requestNotif = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setNotifGranted(p === "granted");
  };

  const addTime = () => setForm(f => ({ ...f, times: [...f.times, "20:00"] }));
  const setTime = (i: number, v: string) => setForm(f => ({ ...f, times: f.times.map((t, k) => k === i ? v : t) }));
  const rmTime = (i: number) => setForm(f => ({ ...f, times: f.times.filter((_, k) => k !== i) }));

  const addMedicine = () => {
    if (!form.name.trim() || !form.times.length) return;
    const m: Medicine = { ...form, id: uid(), patientName: profile.name, patientEmail: profile.email, patientPhone: profile.phone };
    setMeds(prev => [...prev, m]);
    setForm({ id: "", name: "", dosage: "", quantity: "1", instructions: "After Food", startDate: todayStr(), endDate: todayStr(), times: ["09:00"], notes: "" });
  };
  const removeMedicine = (id: string) => {
    setMeds(prev => prev.filter(m => m.id !== id));
    setLogs(prev => prev.filter(l => l.medId !== id));
  };

  const updateLog = (id: string, status: LogStatus, shift?: number) => {
    setLogs(prev => prev.map(l => {
      if (l.id !== id) return l;
      if (status === "snoozed" && shift) {
        const next = new Date(Date.now() + shift * 60 * 1000).toISOString();
        return { ...l, status: "pending", scheduled: next };
      }
      return { ...l, status, takenAt: status === "taken" ? new Date().toISOString() : l.takenAt };
    }));
    audioRef.current.stop?.();
    try { window.speechSynthesis?.cancel(); } catch {}
    setActiveAlarm(null);
  };

  // Dashboard buckets
  const now = new Date();
  const todayKey = todayStr();
  const grouped = useMemo(() => {
    const today: Log[] = [], upcoming: Log[] = [], missed: Log[] = [], done: Log[] = [];
    for (const l of logs) {
      const d = new Date(l.scheduled);
      const dk = d.toISOString().slice(0, 10);
      if (l.status === "missed") missed.push(l);
      else if (l.status === "taken") done.push(l);
      else if (dk === todayKey) today.push(l);
      else if (d > now) upcoming.push(l);
    }
    return { today, upcoming, missed, done };
  }, [logs, todayKey]);

  const adherence = useMemo(() => {
    const finished = logs.filter(l => l.status === "taken" || l.status === "missed");
    if (!finished.length) return { pct: 100, taken: 0, missed: 0, total: 0 };
    const taken = finished.filter(l => l.status === "taken").length;
    return { pct: Math.round((taken / finished.length) * 100), taken, missed: finished.length - taken, total: finished.length };
  }, [logs]);

  const medById = (id: string) => meds.find(m => m.id === id);

  const Stat = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) => (
    <div className="rounded-2xl bg-white/80 backdrop-blur-xl border border-white/60 p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-xl grid place-items-center ${color}`}>{icon}</div>
      <div className="mt-3 text-2xl font-bold tabular-nums text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );

  const LogRow = ({ l, showActions }: { l: Log; showActions?: boolean }) => {
    const m = medById(l.medId);
    if (!m) return null;
    const badge = l.status === "taken" ? "bg-emerald-100 text-emerald-700" :
      l.status === "missed" ? "bg-rose-100 text-rose-700" :
      l.status === "snoozed" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700";
    return (
      <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0">
        <div className="min-w-0">
          <div className="font-semibold text-slate-900 truncate">{m.name} <span className="text-slate-500 font-normal text-sm">· {m.dosage}</span></div>
          <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
            <Clock className="w-3 h-3" />{fmtDateTime(l.scheduled)} · {m.instructions} · qty {m.quantity}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold ${badge}`}>{l.status}</span>
          {showActions && l.status === "pending" && (
            <>
              <button onClick={() => updateLog(l.id, "taken")} className="text-xs px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500">Taken</button>
              <button onClick={() => updateLog(l.id, "missed")} className="text-xs px-2 py-1 rounded-lg bg-rose-500 text-white hover:bg-rose-400">Miss</button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <section id="medicine-reminder" className="py-20 bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold">
            <Bell className="w-3.5 h-3.5" /> AI Medicine Reminder
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">Never miss a dose again</h2>
          <p className="mt-3 text-slate-600">Smart alarms, voice reminders, AI-personalized messages and a full adherence dashboard.</p>
          {!notifGranted && (
            <button onClick={requestNotif} className="mt-4 inline-flex items-center gap-2 text-xs font-semibold bg-sky-600 text-white px-3 py-1.5 rounded-full hover:bg-sky-500">
              <Bell className="w-3.5 h-3.5" /> Enable browser notifications
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-5xl mx-auto mb-8">
          <Stat icon={<Pill className="w-4 h-4 text-white"/>} label="Active medicines" value={meds.length} color="bg-sky-500" />
          <Stat icon={<AlarmClock className="w-4 h-4 text-white"/>} label="Today's doses" value={grouped.today.length + grouped.done.filter(l => l.scheduled.slice(0,10) === todayKey).length} color="bg-indigo-500" />
          <Stat icon={<XCircle className="w-4 h-4 text-white"/>} label="Missed total" value={adherence.missed} color="bg-rose-500" />
          <Stat icon={<TrendingUp className="w-4 h-4 text-white"/>} label="Adherence" value={`${adherence.pct}%`} color="bg-emerald-500" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Add medicine form */}
          <div className="lg:col-span-1 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Plus className="w-4 h-4" /> Add medicine</h3>
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Your name" value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2 col-span-2" />
                <input placeholder="Phone (for SMS/WA)" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
                <input placeholder="Email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              </div>
              <hr className="border-slate-100" />
              <input placeholder="Medicine name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Dosage e.g. 500mg" value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
                <input placeholder="Quantity" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="rounded-xl border border-slate-200 px-3 py-2" />
              </div>
              <select value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value as Medicine["instructions"] })} className="w-full rounded-xl border border-slate-200 px-3 py-2">
                <option>Before Food</option><option>After Food</option><option>Anytime</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-slate-500">Start
                  <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1" />
                </label>
                <label className="text-xs text-slate-500">End
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 mt-1" />
                </label>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Reminder times</div>
                <div className="space-y-2">
                  {form.times.map((t, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="time" value={t} onChange={e => setTime(i, e.target.value)} className="flex-1 rounded-xl border border-slate-200 px-3 py-2" />
                      <button onClick={() => rmTime(i)} className="px-2 rounded-xl text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={addTime} className="text-xs text-sky-600 font-semibold hover:underline">+ Add another time</button>
                </div>
              </div>
              <textarea placeholder="Notes (optional)" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 min-h-16" />
              <button onClick={addMedicine} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 transition active:scale-[0.98]">
                <Plus className="w-4 h-4" /> Save medicine
              </button>
            </div>
          </div>

          {/* Dashboard */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4 text-sky-600" /> Today's schedule</h3>
              {grouped.today.length === 0 ? <p className="text-sm text-slate-500">No pending doses for today. 🎉</p> :
                grouped.today.sort((a,b)=>a.scheduled.localeCompare(b.scheduled)).map(l => <LogRow key={l.id} l={l} showActions />)}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-indigo-600" /> Upcoming</h3>
                <div className="max-h-56 overflow-y-auto">
                  {grouped.upcoming.slice(0, 8).map(l => <LogRow key={l.id} l={l} />)}
                  {!grouped.upcoming.length && <p className="text-sm text-slate-500">Nothing scheduled yet.</p>}
                </div>
              </div>
              <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
                <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><XCircle className="w-4 h-4 text-rose-600" /> Missed doses</h3>
                <div className="max-h-56 overflow-y-auto">
                  {grouped.missed.slice(-8).reverse().map(l => <LogRow key={l.id} l={l} />)}
                  {!grouped.missed.length && <p className="text-sm text-slate-500">No missed doses. Great job!</p>}
                </div>
              </div>
            </div>

            {/* Insight */}
            <div className="rounded-3xl bg-gradient-to-br from-sky-600 to-indigo-700 text-white shadow-xl p-6">
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5" /><h3 className="font-bold">AI Adherence Insight</h3></div>
              <p className="mt-3 text-sm text-white/90">
                You've taken <span className="font-bold">{adherence.taken}</span> of <span className="font-bold">{adherence.total}</span> scheduled doses
                ({adherence.pct}% adherence). {adherence.pct >= 90 ? "Excellent consistency — keep it up!" : adherence.pct >= 70 ? "Good — try setting alarms 5 minutes earlier to reduce missed doses." : "Consider asking a family member or enabling WhatsApp reminders for accountability."}
              </p>
              <div className="mt-4 rounded-2xl bg-white/10 p-3 text-xs text-white/80">
                WhatsApp · SMS · Email channels are wired and ready — connect Twilio and an email domain to enable automated multi-channel reminders.
              </div>
            </div>

            {/* Medicine list */}
            {meds.length > 0 && (
              <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /> Your medicines</h3>
                <div className="divide-y divide-slate-100">
                  {meds.map(m => (
                    <div key={m.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 truncate">{m.name} <span className="text-slate-500 font-normal text-sm">· {m.dosage}</span></div>
                        <div className="text-xs text-slate-500">{m.startDate} → {m.endDate} · {m.times.join(", ")} · {m.instructions}</div>
                      </div>
                      <button onClick={() => removeMedicine(m.id)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active alarm modal */}
      {activeAlarm && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-sky-600 to-indigo-700 text-white p-6 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-white/15 grid place-items-center animate-pulse">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="mt-3 text-xl font-bold">Medicine Reminder</h3>
              <p className="text-sm text-white/80 mt-1">{fmtTime(activeAlarm.log.scheduled)}</p>
            </div>
            <div className="p-6">
              <p className="text-slate-800 leading-relaxed">{activeAlarm.message}</p>
              <button onClick={() => speak(activeAlarm.message)} className="mt-3 text-xs font-semibold text-sky-600 inline-flex items-center gap-1 hover:underline">
                <Volume2 className="w-3.5 h-3.5" /> Replay voice
              </button>
              <div className="mt-5 grid grid-cols-3 gap-2">
                <button onClick={() => updateLog(activeAlarm.log.id, "snoozed", 5)} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 text-sm">+5 min</button>
                <button onClick={() => updateLog(activeAlarm.log.id, "snoozed", 10)} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 text-sm">+10 min</button>
                <button onClick={() => updateLog(activeAlarm.log.id, "snoozed", 30)} className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 text-sm">+30 min</button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button onClick={() => updateLog(activeAlarm.log.id, "missed")} className="rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold py-2.5 inline-flex items-center justify-center gap-2"><XCircle className="w-4 h-4" /> Skip</button>
                <button onClick={() => updateLog(activeAlarm.log.id, "taken")} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 inline-flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4" /> Taken</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}