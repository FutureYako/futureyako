"use client";

import { useRouter } from "next/navigation";
import Stepper from "@/components/ui/Stepper";
import { SETUP_STEPS } from "@/lib/constants";
import { CheckIcon } from "@/components/icons";

const REVIEW_ROWS = [
  { label: "Amount", val: "10% of income" },
  { label: "Frequency", val: "Monthly" },
  { label: "Duration", val: "6 Months" },
  { label: "Funding Source", val: "Bank + Mobile Money" },
  { label: "Savings Route", val: "Savings Wallet" },
  { label: "Goals", val: "1 Goal" },
];

export default function ReviewPage() {
  const router = useRouter();

  return (
    <div className="p-8 max-w-[600px] mx-auto w-full">
      <Stepper steps={SETUP_STEPS} current={3} />

      <div className="card p-7">
        <h1 className="text-lg font-extrabold text-slate-800 mb-1">
          Review your settings
        </h1>
        <p className="text-slate-500 text-[13px] mb-6">
          Please review your autosaving plan
        </p>

        <div className="divide-y divide-slate-100 mb-6">
          {REVIEW_ROWS.map((row) => (
            <div
              key={row.label}
              className="flex justify-between items-center py-3"
            >
              <div className="flex items-center gap-2.5 text-sm text-slate-500">
                <div className="w-5 h-5 bg-success-light rounded-full flex items-center justify-center text-success">
                  <CheckIcon size={10} />
                </div>
                {row.label}
              </div>
              <span className="text-sm font-semibold text-slate-800">{row.val}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            className="btn-outline flex-1"
            onClick={() => router.push("/setup/routing")}
          >
            Back
          </button>
          <button
            className="btn-primary flex-[2]"
            onClick={() => router.push("/setup/success")}
          >
            Confirm &amp; Start Saving
          </button>
        </div>
      </div>
    </div>
  );
}
