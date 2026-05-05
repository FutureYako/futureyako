"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, WalletIcon, InvestIcon } from "@/components/icons";
import { API_ENDPOINTS, apiPatch } from "@/lib/api";

const STEPS = ["Sign Up", "Login", "Link Sources", "Account Details", "Saving Prefs", "Routing", "Review", "Wallet Created"];

const ROUTES = [
  {
    id: "wallet",
    Icon: WalletIcon,
    title: "Savings Wallet",
    desc: "Keep your money in your SaveWise savings wallet. Accessible anytime.",
  },
  {
    id: "invest",
    Icon: InvestIcon,
    title: "Direct to Investment",
    desc: "Automatically invest your savings as they come in.",
  },
];

export default function SavingRoutingPage() {
  const router = useRouter();
  const [route, setRoute] = useState("wallet");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Save routing preference to backend
      await apiPatch(API_ENDPOINTS.AUTOSAVE.PREFERENCES, {
        routing_preference: route,
      });
      
      router.push("/saving-review");
    } catch (err: any) {
      console.error('Routing preference error:', err);
      setError(err.message || 'Failed to save routing preference');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="max-w-120 w-full">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-7">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 5
                    ? "bg-brand-500 text-white"
                    : i === 5
                    ? "bg-brand-100 text-brand-500 border-2 border-brand-500"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < 5 ? <CheckIcon size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-3 h-0.5 ${i < 5 ? "bg-brand-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-5 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-extrabold text-slate-800 mb-1">
              Where should your savings go?
            </h1>
            <p className="text-slate-500 text-[13px]">
              Choose how your automatically saved money will be managed
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {ROUTES.map(({ id, Icon, title, desc }) => {
              const active = route === id;
              return (
                <button
                  key={id}
                  onClick={() => setRoute(id)}
                  className={`p-5 rounded-xl border-2 text-center transition-all ${
                    active
                      ? "border-brand-500 bg-brand-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center transition-all ${
                      active ? "bg-brand-100 text-brand-500" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                  <div className="font-bold text-sm text-slate-800 mb-1.5">{title}</div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">{desc}</div>
                  {active && (
                    <div className="w-5 h-5 bg-brand-500 rounded-full mx-auto mt-3 flex items-center justify-center text-white">
                      <CheckIcon size={11} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] text-brand-500 text-center mb-5">
            You can change this later in Settings
          </p>

          <div className="space-y-3">
            <button
              className="btn-primary"
              disabled={isLoading}
              onClick={handleContinue}
            >
              {isLoading ? 'Saving...' : 'Continue'}
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
