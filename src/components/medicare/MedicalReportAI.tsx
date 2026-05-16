import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { analyzeReport, type ReportResult } from "@/lib/analyzeReport.functions";
import jsPDF from "jspdf";

const STAGES = [
  "Uploading securely…",
  "Extracting image data…",
  "Running AI vision model…",
  "Detecting abnormalities…",
  "Compiling clinical report…",
];

function severityColor(s: string) {
  switch (s) {
    case "severe": return "bg-rose-100 text-rose-700 border-rose-200";
    case "moderate": return "bg-amber-100 text-amber-700 border-amber-200";
    case "mild": return "bg-yellow-100 text-yellow-700 border-yellow-200";
    default: return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
}
function riskBadge(r: string) {
  if (r === "high") return { c: "from-rose-500 to-red-600", t: "High Risk" };
  if (r === "moderate") return { c: "from-amber-500 to-orange-600", t: "Moderate" };
  return { c: "from-emerald-500 to-teal-600", t: "Low Risk" };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

export default function MedicalReportAI() {
  const fileRef = useRef<HTMLInputElement>(null);
  const analyze = useServerFn(analyzeReport);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [note, setNote] = useState("");
  const [stage, setStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = () => {
    setPreview(null); setReport(null); setError(null); setProgress(0); setStage(0); setFileName(""); setNote("");
  };

  const onFiles = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const f = files[0];
    if (!f.type.startsWith("image/")) { setError("Please upload an image file (X-ray, scan, or report photo)."); return; }
    if (f.size > 8 * 1024 * 1024) { setError("File too large (max 8MB)."); return; }
    setError(null); setReport(null); setFileName(f.name);
    const dataUrl = await fileToDataUrl(f);
    setPreview(dataUrl);
  };

  const runAnalysis = async () => {
    if (!preview) return;
    setLoading(true); setError(null); setReport(null); setStage(0); setProgress(0);
    const stageTimer = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 1200);
    const progTimer = setInterval(() => setProgress(p => Math.min(p + Math.random() * 12, 92)), 400);
    try {
      const r = await analyze({ data: { imageDataUrl: preview, note } });
      setReport(r);
      setProgress(100);
    } catch (e: any) {
      setError(e?.message || "Analysis failed. Please try again.");
    } finally {
      clearInterval(stageTimer); clearInterval(progTimer);
      setLoading(false);
    }
  };

  const downloadPdf = () => {
    if (!report) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    let y = 48;
    doc.setFillColor(16, 185, 129); doc.rect(0, 0, W, 80, "F");
    doc.setTextColor(255); doc.setFont("helvetica", "bold"); doc.setFontSize(22);
    doc.text("Darman STORE — AI Medical Report", 40, 50);
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text(new Date().toLocaleString(), 40, 68);
    y = 110;
    doc.setTextColor(20);
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text(report.reportType, 40, y); y += 20;
    doc.setFont("helvetica", "normal"); doc.setFontSize(11);
    const sum = doc.splitTextToSize(report.summary, W - 80);
    doc.text(sum, 40, y); y += sum.length * 14 + 10;

    doc.setFont("helvetica", "bold"); doc.setFontSize(12);
    doc.text(`Risk Level: ${report.riskLevel.toUpperCase()}    Confidence: ${report.overallConfidence}%`, 40, y); y += 22;

    const section = (title: string, items: string[]) => {
      if (!items.length) return;
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text(title, 40, y); y += 16;
      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      items.forEach((it) => {
        const lines = doc.splitTextToSize(`• ${it}`, W - 80);
        if (y + lines.length * 14 > 800) { doc.addPage(); y = 48; }
        doc.text(lines, 40, y); y += lines.length * 14 + 2;
      });
      y += 8;
    };

    if (report.findings.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.text("Findings", 40, y); y += 16;
      doc.setFont("helvetica", "normal"); doc.setFontSize(11);
      report.findings.forEach((f) => {
        const head = `• ${f.title}  [${f.severity.toUpperCase()} • ${f.confidence}%]`;
        const body = doc.splitTextToSize(f.description, W - 80);
        if (y + body.length * 14 + 16 > 800) { doc.addPage(); y = 48; }
        doc.setFont("helvetica", "bold"); doc.text(head, 40, y); y += 14;
        doc.setFont("helvetica", "normal"); doc.text(body, 56, y); y += body.length * 14 + 4;
      });
      y += 6;
    }
    section("Abnormalities", report.abnormalities);
    section("Recommendations", report.recommendations);
    section("Next Steps", report.nextSteps);

    if (y > 740) { doc.addPage(); y = 48; }
    doc.setDrawColor(200); doc.line(40, y, W - 40, y); y += 14;
    doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(120);
    const disc = doc.splitTextToSize("Disclaimer: This AI analysis is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider.", W - 80);
    doc.text(disc, 40, y);
    doc.save(`darman-ai-report-${Date.now()}.pdf`);
  };

  return (
    <section id="ai-report" className="container mx-auto px-4 py-16 md:py-24" style={{ fontFamily: "'Poppins', sans-serif" }}>
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-12 bg-gradient-to-br from-emerald-50 via-white to-sky-50 border border-emerald-100/60 shadow-[0_30px_80px_-40px_rgba(16,185,129,0.3)]">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-sky-300/30 blur-3xl" />

        <div className="relative text-center mb-10">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur border border-emerald-200 text-emerald-700 text-xs font-semibold shadow-sm">
            <i className="fa-solid fa-microscope" /> AI Medical Report Analysis
          </span>
          <h2 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            Upload your scan. Get an <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">instant clinical report</span>.
          </h2>
          <p className="mt-3 text-slate-600 max-w-2xl mx-auto">
            Securely analyze X-rays, MRI, CT scans, blood tests, lab reports, or prescriptions with our AI. Get findings, risk indicators, and recommended next steps in seconds.
          </p>
        </div>

        <div className="relative grid lg:grid-cols-2 gap-8">
          {/* Upload side */}
          <div className="space-y-5">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files); }}
              onClick={() => fileRef.current?.click()}
              className={`relative rounded-2xl border-2 border-dashed cursor-pointer transition-all p-8 md:p-10 bg-white/70 backdrop-blur-xl hover:bg-white ${dragOver ? "border-emerald-500 bg-emerald-50/70 scale-[1.01]" : "border-emerald-200"}`}
            >
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
              {!preview ? (
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white shadow-lg shadow-emerald-500/30">
                    <i className="fa-solid fa-cloud-arrow-up text-2xl" />
                  </div>
                  <div className="mt-4 font-semibold text-slate-800">Drop your medical file here</div>
                  <div className="text-sm text-slate-500 mt-1">X-ray • MRI • CT • Blood test • Prescription • Lab report</div>
                  <button type="button" className="mt-5 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-md hover:shadow-lg transition-all">
                    <i className="fa-solid fa-folder-open mr-2" />Choose file
                  </button>
                  <div className="mt-3 text-xs text-slate-400">PNG, JPG, WEBP • up to 8MB</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative rounded-xl overflow-hidden bg-slate-900/5 grid place-items-center">
                    <img src={preview} alt="scan" className="max-h-72 w-auto mx-auto" />
                    {loading && (
                      <div className="absolute inset-0 bg-emerald-900/60 backdrop-blur-sm grid place-items-center">
                        <div className="text-center text-white">
                          <div className="w-14 h-14 mx-auto rounded-full border-4 border-white/30 border-t-white animate-spin" />
                          <div className="mt-3 text-sm font-medium">{STAGES[stage]}</div>
                        </div>
                        <div className="absolute left-0 right-0 top-0 h-1 bg-white/20">
                          <div className="h-full bg-gradient-to-r from-emerald-300 to-teal-300 transition-all" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-300/60 animate-pulse" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="truncate text-slate-600"><i className="fa-solid fa-file-medical mr-2 text-emerald-600" />{fileName}</div>
                    <button onClick={(e) => { e.stopPropagation(); reset(); }} className="text-rose-600 hover:underline text-xs font-medium">Remove</button>
                  </div>
                </div>
              )}
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional: add symptoms or context (e.g. 'chest pain for 3 days')"
              className="w-full rounded-xl border border-emerald-200 bg-white/70 backdrop-blur p-3 text-sm outline-none focus:border-emerald-500 resize-none"
              rows={2}
              maxLength={500}
            />

            <div className="flex flex-wrap gap-3">
              <button
                disabled={!preview || loading}
                onClick={runAnalysis}
                className="flex-1 min-w-[200px] px-6 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
              >
                {loading ? (<><i className="fa-solid fa-circle-notch fa-spin mr-2" />Analyzing…</>) : (<><i className="fa-solid fa-wand-magic-sparkles mr-2" />Analyze with AI</>)}
              </button>
              {report && (
                <button onClick={downloadPdf} className="px-6 py-3.5 rounded-full bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all">
                  <i className="fa-solid fa-file-pdf mr-2" />Download PDF
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm">
                <i className="fa-solid fa-circle-exclamation mr-2" />{error}
              </div>
            )}

            <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-xs">
              <i className="fa-solid fa-triangle-exclamation mt-0.5" />
              <p><strong>Important:</strong> AI analysis is for informational purposes only and is <strong>not a replacement for professional medical diagnosis</strong>. Always consult a qualified doctor.</p>
            </div>
          </div>

          {/* Report side */}
          <div className="rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden min-h-[480px] flex flex-col">
            {!report && !loading && (
              <div className="flex-1 grid place-items-center text-center p-10">
                <div>
                  <div className="mx-auto w-20 h-20 rounded-2xl bg-emerald-50 grid place-items-center text-emerald-500">
                    <i className="fa-solid fa-file-waveform text-3xl" />
                  </div>
                  <div className="mt-4 font-semibold text-slate-700">Your AI report will appear here</div>
                  <div className="text-sm text-slate-500 mt-1">Upload a scan and click Analyze to begin.</div>
                </div>
              </div>
            )}

            {loading && !report && (
              <div className="flex-1 p-6 space-y-4 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="grid grid-cols-3 gap-3 pt-4">
                  {[0,1,2].map(i => <div key={i} className="h-20 bg-slate-100 rounded-xl" />)}
                </div>
                <div className="h-24 bg-slate-100 rounded-xl" />
                <div className="h-24 bg-slate-100 rounded-xl" />
              </div>
            )}

            {report && (
              <div className="flex flex-col h-full">
                <div className={`bg-gradient-to-r ${riskBadge(report.riskLevel).c} text-white p-5`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-wider opacity-80">Clinical AI Report</div>
                      <div className="text-xl font-extrabold mt-0.5">{report.reportType}</div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-bold">{riskBadge(report.riskLevel).t}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 text-xs">
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white" style={{ width: `${report.overallConfidence}%` }} />
                    </div>
                    <span className="font-semibold">{report.overallConfidence}% confidence</span>
                  </div>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto flex-1">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Summary</div>
                    <p className="text-sm text-slate-700 leading-relaxed">{report.summary}</p>
                  </div>

                  {report.findings.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Findings</div>
                      <div className="space-y-2">
                        {report.findings.map((f, i) => (
                          <div key={i} className={`rounded-xl border p-3 ${severityColor(f.severity)}`}>
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span>{f.title}</span>
                              <span className="text-[10px] uppercase tracking-wider">{f.severity} · {f.confidence}%</span>
                            </div>
                            <p className="text-xs mt-1 opacity-90">{f.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.abnormalities.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Abnormalities Highlighted</div>
                      <ul className="space-y-1.5">
                        {report.abnormalities.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <i className="fa-solid fa-circle-dot text-rose-500 mt-1.5 text-[8px]" />{a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.recommendations.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommendations</div>
                      <ul className="space-y-1.5">
                        {report.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <i className="fa-solid fa-check text-emerald-500 mt-1" />{r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.nextSteps.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recommended Next Steps</div>
                      <ol className="space-y-1.5">
                        {report.nextSteps.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 grid place-items-center text-[10px] font-bold shrink-0">{i + 1}</span>{s}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 italic border-t pt-3">
                    Generated by Darman AI · {new Date().toLocaleString()} · Informational use only.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}