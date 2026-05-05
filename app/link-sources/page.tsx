"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BankIcon, PhoneIcon, ArrowIcon, CheckIcon } from "@/components/icons";

const STEPS = ["Sign Up", "Login", "Link Sources", "Account Details", "Saving Prefs", "Routing", "Review", "Wallet Created"];

export default function LinkSourcesPage() {
  const router = useRouter();
  const [bank, setBank] = useState(false);
  const [mobile, setMobile] = useState(false);

  const sources = [
    {
      id: "bank",
      icon: BankIcon,
      title: "Bank Account",
      sub: "Securely link your bank account for automatic savings",
      state: bank,
      set: setBank,
    },
    {
      id: "mobile",
      icon: PhoneIcon,
      title: "Mobile Money",
      sub: "Link your mobile money for flexible savings",
      state: mobile,
      set: setMobile,
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="max-w-110 w-full">
        <div className="flex justify-center gap-2 mb-7">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 2
                    ? "bg-brand-500 text-white"
                    : i === 2
                    ? "bg-brand-100 text-brand-500 border-2 border-brand-500"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < 2 ? <CheckIcon size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-6 h-0.5 ${i < 2 ? "bg-brand-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-5 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-extrabold text-slate-800 mb-1">
              Link your funding sources
            </h1>
            <p className="text-slate-500 text-[13px]">
              Add at least one funding source to continue
            </p>
          </div>

          <div className="space-y-3 mb-5">
            {sources.map((src) => {
              const Icon = src.icon;
              return (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => src.set(!src.state)}
                  className={`w-full text-left flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    src.state
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        src.state
                          ? "bg-brand-100 text-brand-500"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">
                        {src.title}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{src.sub}</div>
                    </div>
                  </div>
                  <ArrowIcon
                    size={16}
                    className={src.state ? "text-brand-500" : "text-slate-400"}
                  />
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-400 text-center mb-5">
            You can add both and choose how to save
          </p>

          <button
            className="btn-primary"
            disabled={!bank && !mobile}
            onClick={() => {
              const types = [bank && "bank", mobile && "mobile"]
                .filter(Boolean)
                .join(",");
              router.push(`/link-details?types=${types}`);
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
