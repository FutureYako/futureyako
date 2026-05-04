"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Stepper from "@/components/ui/Stepper";
import { SETUP_STEPS } from "@/lib/constants";
import { WalletIcon, InvestIcon, CheckIcon } from "@/components/icons";

const ROUTES = [
  {
    id: "wallet",
    icon: WalletIcon,
    title: "Savings Wallet",
    sub: "Keep your money in your savings wallet",
  },
  {
    id: "invest",
    icon: InvestIcon,
    title: "Direct to Investment",
    sub: "Automatically invest your savings",
  },
];

export default function RoutingPage() {
  const router = useRouter();
  const [route, setRoute] = useState("wallet");

  return (
    <div className="p-8 max-w-[600px] mx-auto w-full">
      <Stepper steps={SETUP_STEPS} current={2} />

      <div className="card p-7">
        <h1 className="text-lg font-extrabold text-slate-800 mb-1">
          Where do you want your money to go?
        </h1>
        <p className="text-slate-500 text-[13px] mb-6">
          Choose how your savings will be managed
        </p>

        <div className="grid grid-cols-2 gap-4 mb-5">
          {ROUTES.map((r) => {
            const Icon = r.icon;
            const isActive = route === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setRoute(r.id)}
                className={`p-5 rounded-xl border-2 text-center transition-all ${
                  isActive
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                    isActive
                      ? "bg-brand-100 text-brand-500"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  <Icon size={22} />
                </div>
                <div className="font-bold text-sm text-slate-800 mb-1">
                  {r.title}
                </div>
                <div className="text-xs text-slate-500">{r.sub}</div>
                {isActive && (
                  <div className="w-5 h-5 bg-brand-500 rounded-full mx-auto mt-3 flex items-center justify-center text-white">
                    <CheckIcon size={11} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-brand-500 text-center mb-5">
          You can change this later in settings
        </p>

        <div className="flex gap-3">
          <button
            className="btn-outline flex-1"
            onClick={() => router.push("/setup/autosaving")}
          >
            Back
          </button>
          <button
            className="btn-primary flex-[2]"
            onClick={() => router.push("/setup/review")}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
