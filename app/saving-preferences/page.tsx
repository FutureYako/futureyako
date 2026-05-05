"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckIcon } from "@/components/icons";
import { API_ENDPOINTS, apiPatch, apiPost, apiGet } from "@/lib/api";

const STEPS = ["Sign Up", "Login", "Link Sources", "Account Details", "Saving Prefs", "Routing", "Review", "Wallet Created"];
const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Every 2 Months"];

export default function SavingPreferencesPage() {
  const router = useRouter();
  const [amountType, setAmountType] = useState<"Percentage" | "Fixed Amount">("Percentage");
  const [amount, setAmount] = useState("");
  const [freq, setFreq] = useState("Monthly");
  const [duration, setDuration] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fundingSourceIds, setFundingSourceIds] = useState<string[]>([]);
  const [prefsExist, setPrefsExist] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const sourcesData = await apiGet(API_ENDPOINTS.WALLETS.FUNDING_SOURCES);
        const sources = Array.isArray(sourcesData) ? sourcesData : (sourcesData.results ?? []);
        setFundingSourceIds(sources.map((s: any) => s.id));
      } catch {
        // Proceed without pre-selected sources
      }

      try {
        const prefs = await apiGet(API_ENDPOINTS.AUTOSAVE.PREFERENCES);
        setPrefsExist(true);
        if (prefs.amount_type) setAmountType(prefs.amount_type);
        if (prefs.amount) setAmount(String(prefs.amount));
        if (prefs.frequency) setFreq(prefs.frequency);
        if (prefs.duration_months) setDuration(String(prefs.duration_months));
      } catch {
        setPrefsExist(false);
      }
    };
    init();
  }, []);

  const durationNum = parseInt(duration) || 0;
  const durationTooShort = duration !== "" && durationNum < 4;
  const canContinue = amount.trim() !== "" && durationNum >= 4 && agreed;

  const handleContinue = async () => {
    if (!canContinue) return;

    setIsLoading(true);
    setError(null);

    const payload = {
      amount_type: amountType,
      amount: parseFloat(amount),
      frequency: freq,
      duration_months: durationNum,
      funding_sources: fundingSourceIds,
      is_enabled: true,
    };

    try {
      if (prefsExist) {
        await apiPatch(API_ENDPOINTS.AUTOSAVE.PREFERENCES, payload);
      } else {
        await apiPost(API_ENDPOINTS.AUTOSAVE.PREFERENCES, payload);
        setPrefsExist(true);
      }
      router.push("/saving-routing");
    } catch (err: any) {
      setError(err.message || "Failed to save preferences");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="max-w-120 w-full">
        <div className="flex justify-center gap-2 mb-7">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 4
                    ? "bg-brand-500 text-white"
                    : i === 4
                    ? "bg-brand-100 text-brand-500 border-2 border-brand-500"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < 4 ? <CheckIcon size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-3 h-0.5 ${i < 4 ? "bg-brand-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-5 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-extrabold text-slate-800 mb-1">
              Set your saving preferences
            </h1>
            <p className="text-slate-500 text-[13px]">
              Tell us how much, how often, and how long you want to save
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="label-sm">Amount to Save</label>
              <div className="flex bg-slate-100 rounded-lg p-1 gap-1 mb-3">
                {(["Percentage", "Fixed Amount"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setAmountType(t)}
                    className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all ${
                      amountType === t
                        ? "bg-brand-500 text-white"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="input-field w-24!"
                  type="number"
                  min={1}
                  placeholder={amountType === "Percentage" ? "10" : "500"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="text-slate-500 text-sm">
                  {amountType === "Percentage" ? "% of income" : "fixed per cycle"}
                </span>
              </div>
            </div>

            <div>
              <label className="label-sm">Saving Frequency</label>
              <div className="flex flex-wrap gap-1.5">
                {FREQUENCIES.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFreq(f)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] transition-all ${
                      freq === f
                        ? "border-brand-500 text-brand-500 bg-brand-50"
                        : "border-slate-200 text-slate-500 bg-white hover:border-slate-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-sm">How long do you want to save?</label>
              <div className="flex items-center gap-2">
                <input
                  className="input-field w-28!"
                  type="number"
                  min={4}
                  placeholder="e.g. 6"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
                <span className="text-slate-500 text-sm">months</span>
              </div>
              {durationTooShort && (
                <p className="text-[11px] text-danger font-semibold mt-1.5">
                  Minimum saving period is 4 months.
                </p>
              )}
              {durationNum >= 4 && (
                <p className="text-[11px] text-brand-500 font-semibold mt-1.5">
                  Your personal savings goals must have deadlines at least {durationNum} months away.
                </p>
              )}
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-start gap-3">
                <button
                  role="checkbox"
                  aria-checked={agreed}
                  onClick={() => setAgreed((v) => !v)}
                  className={`shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                    agreed
                      ? "bg-brand-500 border-brand-500"
                      : "bg-white border-slate-300 hover:border-brand-300"
                  }`}
                >
                  {agreed && <CheckIcon size={10} />}
                </button>
                <p className="text-[13px] text-slate-600 leading-relaxed">
                  I agree to allow SaveWise to automatically deduct savings from my linked
                  funding source(s) according to my preferences. I have read and accept the{" "}
                  <Link href="/terms" target="_blank" className="text-brand-500 font-semibold hover:underline">
                    Auto-Saving Terms &amp; Conditions
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              className="btn-primary"
              disabled={!canContinue || isLoading}
              onClick={handleContinue}
            >
              {isLoading ? "Saving..." : "Continue"}
            </button>
            <button
              className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
              onClick={() => router.back()}
            >
              ← Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
