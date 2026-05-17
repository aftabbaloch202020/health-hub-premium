import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { healthInsights, type VitalEntry, type HealthInsight } from "@/lib/healthInsights.functions";
import { Activity, Droplet, HeartPulse, Wind, Weight, Plus, Sparkles, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const KEY = "darman:vitals";
const read = (): VitalEntry[] => {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const write = (e: VitalEntry[]) => localStorage.setItem(KEY, JSON.stringify(e));

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function HealthDashboard() {
  const run = useServerFn(healthInsights);
  const [entries, setEntries] = useState<VitalEntry[]>([]);
  const [insight, setInsight] = useState<HealthInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState<VitalEntry>({ date: todayStr() });

  useEffect(() => { setEntries(read()); }, []);

  const sorted = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries]);
  const last = sorted.at(-1);

  const addEntry = () => {
    const clean: VitalEntry = {
      date: form.date || todayStr(),
      systolic: form.systolic ? Number(form.systolic) : undefined,
      diastolic: form.diastolic ? Number(form.diastolic) : undefined,
      sugar: form.sugar ? Number(form.sugar) : undefined,
      heartRate: form.heartRate ? Number(form.heartRate) : undefined,
      oxygen: form.oxygen ? Number(form.oxygen) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      symptoms: form.symptoms?.trim() || undefined,
    };
    if (!clean.systolic && !clean.sugar && !clean.heartRate && !clean.oxygen && !clean.weight && !clean.symptoms) return;
    const next = [...entries, clean];
    setEntries(next); write(next);
    setForm({ date: todayStr() });
    setInsight(null);
  };

  const removeAt = (i: number) => {
    const next = entries.filter((_, k) => k !== i);
    setEntries(next); write(next); setInsight(null);
  };

  const runInsight = async () => {
    setLoading(true); setErr(null);
    try {
      const res = await run({ data: { entries: sorted } });
      setInsight(res);
    } catch (e: any) {
      setErr(e?.message || "Failed to analyze.");
    } finally { setLoading(false); }
  };

  const trendIcon = insight?.trend === "improving" ? <TrendingUp className="w-4 h-4 text-emerald-600" /> :
    insight?.trend === "declining" ? <TrendingDown className="w-4 h-4 text-rose-600" /> :
    <Minus className="w-4 h-4 text-slate-500" />;

  const StatCard = ({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value?: number; unit: string; color: string }) => (
    <div className="rounded-2xl bg-white/70 backdrop-blur-xl border border-white/60 p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl grid place-items-center ${color}`}>{icon}</div>
        <span className="text-[10px] uppercase tracking-wider text-slate-500">{unit}</span>
      </div>
      <div className="mt-3 text-2xl font-bold tabular-nums">{value ?? "—"}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );

  return (
    <section id="health-dashboard" className="py-20 bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> AI Healthcare History
          </div>
          <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">Your Health, Tracked Smartly</h2>
          <p className="mt-3 text-slate-600">Log vitals, see trends, and let AI summarize your weekly progress.</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-w-5xl mx-auto mb-8">
          <StatCard icon={<HeartPulse className="w-4 h-4 text-white"/>} label="Blood Pressure" value={last?.systolic} unit={last?.diastolic ? `/${last.diastolic} mmHg` : "mmHg"} color="bg-rose-500" />
          <StatCard icon={<Droplet className="w-4 h-4 text-white"/>} label="Sugar" value={last?.sugar} unit="mg/dL" color="bg-amber-500" />
          <StatCard icon={<Activity className="w-4 h-4 text-white"/>} label="Heart Rate" value={last?.heartRate} unit="bpm" color="bg-pink-500" />
          <StatCard icon={<Wind className="w-4 h-4 text-white"/>} label="Oxygen" value={last?.oxygen} unit="%" color="bg-sky-500" />
          <StatCard icon={<Weight className="w-4 h-4 text-white"/>} label="Weight" value={last?.weight} unit="kg" color="bg-emerald-500" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Form */}
          <div className="lg:col-span-1 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
            <h3 className="font-bold text-slate-900 mb-4">Add new reading</h3>
            <div className="space-y-3 text-sm">
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2" />
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Systolic" type="number" value={form.systolic ?? ""} onChange={(e) => setForm({ ...form, systolic: e.target.value ? +e.target.value : undefined })} className="rounded-xl border border-slate-200 px-3 py-2" />
                <input placeholder="Diastolic" type="number" value={form.diastolic ?? ""} onChange={(e) => setForm({ ...form, diastolic: e.target.value ? +e.target.value : undefined })} className="rounded-xl border border-slate-200 px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Sugar mg/dL" type="number" value={form.sugar ?? ""} onChange={(e) => setForm({ ...form, sugar: e.target.value ? +e.target.value : undefined })} className="rounded-xl border border-slate-200 px-3 py-2" />
                <input placeholder="Heart bpm" type="number" value={form.heartRate ?? ""} onChange={(e) => setForm({ ...form, heartRate: e.target.value ? +e.target.value : undefined })} className="rounded-xl border border-slate-200 px-3 py-2" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Oxygen %" type="number" value={form.oxygen ?? ""} onChange={(e) => setForm({ ...form, oxygen: e.target.value ? +e.target.value : undefined })} className="rounded-xl border border-slate-200 px-3 py-2" />
                <input placeholder="Weight kg" type="number" value={form.weight ?? ""} onChange={(e) => setForm({ ...form, weight: e.target.value ? +e.target.value : undefined })} className="rounded-xl border border-slate-200 px-3 py-2" />
              </div>
              <textarea placeholder="Symptoms or medicines (optional)" value={form.symptoms ?? ""} onChange={(e) => setForm({ ...form, symptoms: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2 min-h-16" />
              <button onClick={addEntry} className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 transition active:scale-[0.98]">
                <Plus className="w-4 h-4" /> Save reading
              </button>
            </div>
          </div>

          {/* Charts + insights */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Blood Pressure trend</h3>
                <span className="text-xs text-slate-500">{sorted.length} {sorted.length === 1 ? "entry" : "entries"}</span>
              </div>
              <div className="h-52">
                <ResponsiveContainer>
                  <AreaChart data={sorted}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" fontSize={11} />
                    <YAxis fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="systolic" stroke="#f43f5e" fill="url(#g1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="diastolic" stroke="#fb923c" fillOpacity={0} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
                <h3 className="font-bold text-slate-900 mb-2">Sugar & Heart Rate</h3>
                <div className="h-40">
                  <ResponsiveContainer>
                    <LineChart data={sorted}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip />
                      <Line type="monotone" dataKey="sugar" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="heartRate" stroke="#ec4899" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
                <h3 className="font-bold text-slate-900 mb-2">Oxygen %</h3>
                <div className="h-40">
                  <ResponsiveContainer>
                    <AreaChart data={sorted}>
                      <defs>
                        <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.5} />
                          <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" fontSize={10} />
                      <YAxis domain={[80, 100]} fontSize={10} />
                      <Tooltip />
                      <Area type="monotone" dataKey="oxygen" stroke="#0ea5e9" fill="url(#g2)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* AI insight */}
            <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl p-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-bold">AI Health Insight</h3>
                </div>
                <button onClick={runInsight} disabled={loading || !sorted.length} className="text-xs font-semibold bg-white/15 hover:bg-white/25 disabled:opacity-50 px-3 py-1.5 rounded-full transition">
                  {loading ? "Analyzing…" : "Generate summary"}
                </button>
              </div>
              {err && <p className="mt-3 text-sm text-rose-100">{err}</p>}
              {insight && (
                <div className="mt-4">
                  <div className="flex items-center gap-2 text-lg font-semibold">{trendIcon}<span>{insight.headline}</span></div>
                  {insight.bullets.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-white/90">
                      {insight.bullets.map((b, i) => <li key={i}>• {b}</li>)}
                    </ul>
                  )}
                  {insight.recommendations.length > 0 && (
                    <div className="mt-4 rounded-2xl bg-white/10 p-3">
                      <div className="text-xs uppercase tracking-wider opacity-80 mb-1">Recommended</div>
                      <ul className="text-sm space-y-1">{insight.recommendations.map((r, i) => <li key={i}>→ {r}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
              {!insight && !err && <p className="mt-3 text-sm text-white/80">Log a few readings, then tap “Generate summary” for an AI-written weekly health update.</p>}
            </div>

            {/* History list */}
            {entries.length > 0 && (
              <div className="rounded-3xl bg-white/80 backdrop-blur-xl border border-white/60 shadow-lg p-6">
                <h3 className="font-bold text-slate-900 mb-3">Recent log</h3>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 text-sm">
                  {[...entries].reverse().slice(0, 12).map((e, idx) => {
                    const realIdx = entries.length - 1 - idx;
                    return (
                      <div key={realIdx} className="py-2 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-slate-700">{e.date}</div>
                          <div className="text-xs text-slate-500">
                            {e.systolic ? `BP ${e.systolic}/${e.diastolic ?? "—"} ` : ""}
                            {e.sugar ? `· Sugar ${e.sugar} ` : ""}
                            {e.heartRate ? `· HR ${e.heartRate} ` : ""}
                            {e.oxygen ? `· O₂ ${e.oxygen}% ` : ""}
                            {e.weight ? `· ${e.weight}kg ` : ""}
                            {e.symptoms ? `· ${e.symptoms}` : ""}
                          </div>
                        </div>
                        <button onClick={() => removeAt(realIdx)} className="text-slate-400 hover:text-rose-500 transition" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}