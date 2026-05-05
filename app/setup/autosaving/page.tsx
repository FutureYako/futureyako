"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Every 2 Months"];
const SOURCES = ["Bank Account", "Mobile Money", "Both"];

export default function EditSavingPreferencesPage() {
  const router = useRouter();
  const [type, setType] = useState<"Percentage" | "Fixed Amount">("Percentage");
  const [freq, setFreq] = useState("Monthly");
  const [src, setSrc] = useState("Both");

  return (
    <div className="p-4 sm:p-8 max-w-150 mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-slate-800 mb-1">
          Edit Saving Preferences
        </h1>
        <p className="text-slate-500 text-sm">
          Update how, how much, and how long you save. Changes take effect from your next deduction cycle.
        </p>
      </div>

      <div className="card p-7">
        <div className="mb-4">
          <label className="label-sm">Saving Amount</label>
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1 mb-3">
            {(["Percentage", "Fixed Amount"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all ${
                  type === t
                    ? "bg-brand-500 text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input className="input-field w-20!" defaultValue="10" />
            <span className="text-slate-500 text-sm">
              {type === "Percentage" ? "% of income" : "fixed per cycle"}
            </span>
          </div>
        </div>

        <div className="mb-4">
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

        <div className="mb-4">
          <label className="label-sm">Saving Duration</label>
          <div className="flex items-center gap-2">
            <input
              className="input-field w-28!"
              type="number"
              min={4}
              placeholder="e.g. 6"
            />
            <span className="text-slate-500 text-sm">months (minimum 4)</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="label-sm">Funding Source</label>
          <div className="flex flex-wrap gap-1.5">
            {SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => setSrc(s)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] transition-all ${
                  src === s
                    ? "border-brand-500 text-brand-500 bg-brand-50"
                    : "border-slate-200 text-slate-500 bg-white hover:border-slate-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">
            You can manage both sources separately
          </p>
        </div>

        <div className="flex gap-3">
          <button
            className="btn-outline flex-1"
            onClick={() => router.push("/dashboard")}
          >
            Cancel
          </button>
          <button
            className="btn-primary flex-2"
            onClick={() => router.push("/dashboard")}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
