"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Stepper from "@/components/ui/Stepper";
import { SETUP_STEPS } from "@/lib/constants";
import { CalendarIcon } from "@/components/icons";

export default function GoalsPage() {
  const router = useRouter();
  const [weightType, setWeightType] = useState<"Percentage" | "Fixed Amount">(
    "Percentage"
  );

  return (
    <div className="p-8 max-w-[600px] mx-auto w-full">
      <Stepper steps={SETUP_STEPS} current={1} />

      <div className="card p-7">
        <h1 className="text-lg font-extrabold text-slate-800 mb-1">
          Create your savings goals
        </h1>
        <p className="text-slate-500 text-[13px] mb-6">
          Define your goals and how much each will receive
        </p>

        <div className="mb-4">
          <label className="label-sm">Goal Name</label>
          <input className="input-field" defaultValue="Buy a Car" />
        </div>

        <div className="mb-4">
          <label className="label-sm">Target Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
              $
            </span>
            <input className="input-field !pl-7" defaultValue="5,000.00" />
          </div>
        </div>

        <div className="mb-4">
          <label className="label-sm">Goal Weight</label>
          <div className="flex bg-slate-100 rounded-lg p-1 gap-1 mb-3">
            {(["Percentage", "Fixed Amount"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setWeightType(t)}
                className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all ${
                  weightType === t
                    ? "bg-brand-500 text-white"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input className="input-field !w-20" defaultValue="60" />
            <span className="text-slate-500 text-sm">% of total savings</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="label-sm">Deadline</label>
          <div className="relative">
            <input className="input-field" defaultValue="Dec 31, 2024" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <CalendarIcon size={16} />
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            className="btn-outline flex-1"
            onClick={() => router.push("/setup/autosaving")}
          >
            Back
          </button>
          <button
            className="btn-primary flex-[2]"
            onClick={() => router.push("/setup/routing")}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
