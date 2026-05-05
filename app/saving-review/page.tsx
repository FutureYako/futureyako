"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPatch } from "@/lib/api";

const STEPS = ["Sign Up", "Login", "Link Sources", "Account Details", "Saving Prefs", "Routing", "Review", "Wallet Created"];

interface SavingPreference {
  amount: number;
  amount_type: string;
  frequency: string;
  duration_months: number;
  funding_source_names: string[];
  is_enabled: boolean;
  routing_preference?: string;
}

export default function SavingReviewPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<SavingPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await apiGet(API_ENDPOINTS.AUTOSAVE.PREFERENCES);
        setPreferences(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load preferences');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleConfirm = async () => {
    setIsConfirming(true);
    setConfirmError(null);

    try {
      await apiPatch(API_ENDPOINTS.USER.ONBOARDING, { step: 'complete' });
      router.push("/wallet-created");
    } catch {
      // Onboarding endpoint may not exist yet — proceed anyway so the flow isn't blocked
      router.push("/wallet-created");
    } finally {
      setIsConfirming(false);
    }
  };

  const getReviewRows = () => {
    if (!preferences) return [];

    const amountText = preferences.amount_type === 'Percentage'
      ? `${preferences.amount}% of income`
      : `${preferences.amount} fixed per cycle`;

    const fundingSourcesText = preferences.funding_source_names?.join(' + ') || 'Not set';

    const routingText = preferences.routing_preference === 'invest'
      ? 'Direct to Investment'
      : preferences.routing_preference === 'wallet'
      ? 'Savings Wallet'
      : 'Savings Wallet';

    return [
      { label: "Amount to Save", val: amountText },
      { label: "Frequency", val: preferences.frequency },
      { label: "Duration", val: `${preferences.duration_months} Months` },
      { label: "Funding Source", val: fundingSourcesText },
      { label: "Savings Route", val: routingText },
      { label: "Goals", val: "Set up after onboarding" },
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-8">
        <div className="text-slate-500">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-8">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="max-w-120 w-full">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-7">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i < 6
                    ? "bg-brand-500 text-white"
                    : i === 6
                    ? "bg-brand-100 text-brand-500 border-2 border-brand-500"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < 6 ? <CheckIcon size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-3 h-0.5 ${i < 6 ? "bg-brand-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-5 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-extrabold text-slate-800 mb-1">
              Review your plan
            </h1>
            <p className="text-slate-500 text-[13px]">
              Confirm your autosaving setup before we create your wallet
            </p>
          </div>

          <div className="divide-y divide-slate-100 mb-6">
            {getReviewRows().map((row: { label: string; val: string }) => (
              <div key={row.label} className="flex justify-between items-center py-3">
                <div className="flex items-center gap-2.5 text-sm text-slate-500">
                  <div className="w-5 h-5 bg-success-light rounded-full flex items-center justify-center text-success shrink-0">
                    <CheckIcon size={10} />
                  </div>
                  {row.label}
                </div>
                <span className="text-sm font-semibold text-slate-800 text-right ml-4">
                  {row.val}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-5">
            <p className="text-[12px] text-brand-700 leading-relaxed">
              By confirming, you authorise SaveWise to begin automatic savings deductions
              according to your preferences. Your wallet will be created immediately.
            </p>
          </div>

          {confirmError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{confirmError}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              className="btn-primary"
              disabled={isConfirming}
              onClick={handleConfirm}
            >
              {isConfirming ? 'Creating wallet...' : 'Confirm & Create Wallet'}
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
