"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Stepper from "@/components/ui/Stepper";
import { SETUP_STEPS } from "@/lib/constants";

const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Every 2 Months"];
const SOURCES = ["Bank Account", "Mobile Money", "Both"];

export default function AutosavingPage() {
  const router = useRouter();
  const [type, setType] = useState<"Percentage" | "Fixed Amount">("Percentage");
  const [freq, setFreq] = useState("Monthly");
  const [src, setSrc] = useState("Both");

  return (
    <div className="p-8 max-w-[600px] mx-auto w-full">
      <Stepper steps={SETUP_STEPS} current={0} />

      <div className="card p-7">
        <h1 className="text-lg font-extrabold text-slate-800 mb-1">
          Define your autosaving preferences
        </h1>
        <p className="text-slate-500 text-[13px] mb-6">
          Set how, how much, and how long you want to save
        </p>

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
            <input className="input-field !w-20" defaultValue="10" />
            <span className="text-slate-500 text-sm">% of income</span>
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
          <div className="flex gap-3">
            <input
              className="input-field flex-1"
              placeholder="Minimum 4 months"
            />
            <select className="input-field flex-1">
              <option>6 Months</option>
              <option>12 Months</option>
              <option>24 Months</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="label-sm">Select Funding Source</label>
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

        <button className="btn-primary" onClick={() => router.push("/setup/goals")}>
          Continue
        </button>
      </div>
    </div>
  );
}
