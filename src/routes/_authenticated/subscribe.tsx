import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { submitPayment, PLAN_INFO } from "@/lib/payments.functions";
import { toast } from "sonner";

const PAY_NUMBER = "03111257628";

export const Route = createFileRoute("/_authenticated/subscribe")({
  head: () => ({ meta: [{ title: "Subscribe — Darman STORE AI" }] }),
  component: SubscribePage,
});

type Plan = "weekly" | "monthly" | "yearly";

function SubscribePage() {
  const navigate = useNavigate();
  const submit = useServerFn(submitPayment);
  const [plan, setPlan] = useState<Plan>("monthly");
  const [method, setMethod] = useState<"easypaisa" | "jazzcash">("easypaisa");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [txId, setTxId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const mutate = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Please upload a payment screenshot");
      if (!fullName.trim() || !email.trim()) throw new Error("Full name and email are required");
      setUploading(true);
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("Please sign in");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${uid}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-screenshots").upload(path, file, { upsert: false, contentType: file.type });
      if (upErr) throw new Error(upErr.message);
      const res = await submit({ data: { full_name: fullName, email, plan, method, transaction_id: txId || undefined, screenshot_path: path } });
      return res;
    },
    onSuccess: () => {
      toast.success("Payment submitted. Awaiting admin approval.");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setUploading(false),
  });

  const copy = () => { navigator.clipboard.writeText(PAY_NUMBER); toast.success("Number copied"); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8 md:py-14">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary"><i className="fa-solid fa-arrow-left mr-2" />Back to home</Link>
          <h1 className="text-3xl md:text-4xl font-extrabold mt-3">Unlock unlimited AI</h1>
          <p className="text-muted-foreground mt-1">Choose a plan, pay via EasyPaisa or JazzCash, and upload your receipt. Admins approve within 24 hours.</p>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {(Object.keys(PLAN_INFO) as Plan[]).map((p) => {
              const info = PLAN_INFO[p];
              const active = plan === p;
              return (
                <button key={p} onClick={() => setPlan(p)}
                  className={`text-left rounded-2xl border-2 p-5 transition-all ${active ? "border-primary shadow-glow bg-primary/5" : "border-border bg-card hover:border-primary/40"}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-bold capitalize text-lg">{p}</div>
                    {p === "monthly" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-bold">POPULAR</span>}
                  </div>
                  <div className="mt-3 text-3xl font-extrabold">PKR {info.pkr}</div>
                  <div className="text-xs text-muted-foreground">{info.days} days · unlimited AI usage</div>
                </button>
              );
            })}
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {/* Payment instructions */}
            <div className="bg-card border border-border rounded-2xl p-6">
              <h2 className="font-bold text-lg">Payment details</h2>
              <p className="text-sm text-muted-foreground">Send <b>PKR {PLAN_INFO[plan].pkr}</b> to the number below and upload the screenshot.</p>
              <div className="mt-4 flex gap-2">
                {(["easypaisa", "jazzcash"] as const).map(m => (
                  <button key={m} onClick={() => setMethod(m)}
                    className={`flex-1 py-3 rounded-xl border-2 font-semibold capitalize ${method === m ? "border-primary bg-primary/5" : "border-border"}`}>
                    <i className={`fa-solid ${m === "easypaisa" ? "fa-mobile-screen" : "fa-money-bill-wave"} mr-2`} />{m}
                  </button>
                ))}
              </div>
              <div className="mt-4 p-4 rounded-xl bg-muted">
                <div className="text-xs text-muted-foreground">Payment number</div>
                <div className="font-mono text-xl font-bold tracking-wider">{PAY_NUMBER}</div>
                <div className="flex gap-2 mt-3">
                  <button onClick={copy} className="flex-1 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium text-sm"><i className="fa-solid fa-copy mr-2" />Copy Number</button>
                  <a href={`tel:${PAY_NUMBER}`} className="flex-1 text-center py-2 rounded-lg bg-gradient-cta text-primary-foreground font-medium text-sm"><i className="fa-solid fa-phone mr-2" />Pay Now</a>
                </div>
              </div>
              <ol className="mt-4 text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Open your {method === "easypaisa" ? "EasyPaisa" : "JazzCash"} app.</li>
                <li>Send PKR {PLAN_INFO[plan].pkr} to {PAY_NUMBER}.</li>
                <li>Take a screenshot of the successful transaction.</li>
                <li>Fill the form and upload the screenshot.</li>
              </ol>
            </div>

            {/* Form */}
            <form onSubmit={(e) => { e.preventDefault(); mutate.mutate(); }} className="bg-card border border-border rounded-2xl p-6 space-y-3">
              <h2 className="font-bold text-lg">Submit your payment</h2>
              <div>
                <label className="text-xs font-medium">Full name</label>
                <input required value={fullName} onChange={e => setFullName(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-lg bg-muted outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-medium">Registered email</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-lg bg-muted outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-medium">Selected plan</label>
                <div className="mt-1 px-4 py-2.5 rounded-lg bg-muted font-semibold capitalize">{plan} · PKR {PLAN_INFO[plan].pkr}</div>
              </div>
              <div>
                <label className="text-xs font-medium">Transaction ID (optional)</label>
                <input value={txId} onChange={e => setTxId(e.target.value)} placeholder="TID from your app" className="w-full mt-1 px-4 py-2.5 rounded-lg bg-muted outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="text-xs font-medium">Payment screenshot</label>
                <input required type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] ?? null)}
                  className="w-full mt-1 text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-cta file:text-primary-foreground file:font-semibold" />
                {file && <div className="text-xs text-muted-foreground mt-1">{file.name} · {(file.size / 1024).toFixed(0)} KB</div>}
              </div>
              <button disabled={mutate.isPending || uploading} className="w-full py-3 rounded-xl bg-gradient-cta text-primary-foreground font-bold shadow-glow disabled:opacity-60">
                {mutate.isPending ? <><i className="fa-solid fa-spinner animate-spin mr-2" />Submitting…</> : <><i className="fa-solid fa-paper-plane mr-2" />Submit for review</>}
              </button>
              <p className="text-xs text-center text-muted-foreground">Your payment is under review. Subscription will be activated after admin approval.</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}