"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPost } from "@/lib/api";

const STEPS = [ "Login","Sign Up", "Link Sources", "Account Details", "Saving Prefs", "Routing", "Review", "Wallet Created"];

interface PaymentProvider {
  id: string;
  name: string;
  is_active: boolean;
}

function toArray<T>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.results)) return res.results;
  return [];
}

function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="label-sm">{label}</label>
      <select
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label-sm">{label}</label>
      <input
        className="input-field"
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function LinkDetailsForm() {
  const router = useRouter();
  const params = useSearchParams();
  const types = params.get("types") ?? "";
  const hasBank = types.includes("bank");
  const hasMobile = types.includes("mobile");

  const [bank, setBank] = useState({ name: "", accountNumber: "", accountName: "" });
  const [mobile, setMobile] = useState({ provider: "", phone: "", walletName: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [banks, setBanks] = useState<string[]>([]);
  const [mobileProviders, setMobileProviders] = useState<string[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);

  useEffect(() => {
    async function fetchProviders() {
      try {
        const [banksRes, mobileRes] = await Promise.all([
          apiGet(API_ENDPOINTS.ADMIN.PUBLIC_BANKS),
          apiGet(API_ENDPOINTS.ADMIN.PUBLIC_MOBILE_PROVIDERS),
        ]);
        setBanks(toArray<PaymentProvider>(banksRes).map((p) => p.name));
        setMobileProviders(toArray<PaymentProvider>(mobileRes).map((p) => p.name));
      } catch {}
      setLoadingProviders(false);
    }
    fetchProviders();
  }, []);

  const bankValid =
    !hasBank || (bank.name !== "" && bank.accountNumber !== "" && bank.accountName !== "");
  const mobileValid =
    !hasMobile || (mobile.provider !== "" && mobile.phone !== "" && mobile.walletName !== "");
  const canContinue = bankValid && mobileValid;

  const handleContinue = async () => {
    if (!canContinue) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create funding sources for bank if selected
      if (hasBank && bank.name !== "") {
        await apiPost(API_ENDPOINTS.WALLETS.FUNDING_SOURCES, {
          source_type: 'bank',
          name: bank.name,
          account_identifier: bank.accountNumber,
          account_holder_name: bank.accountName,
          is_primary: !hasMobile, // Make primary if no mobile money
        });
      }

      // Create funding source for mobile money if selected
      if (hasMobile && mobile.provider !== "") {
        await apiPost(API_ENDPOINTS.WALLETS.FUNDING_SOURCES, {
          source_type: 'mobile',
          name: mobile.walletName || mobile.provider,
          account_identifier: mobile.phone,
          account_holder_name: mobile.walletName,
          is_primary: !hasBank, // Make primary if no bank
        });
      }

      router.push("/saving-preferences");
    } catch (err: any) {
      setError(err.message || 'Failed to link funding sources');
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
                  i < 3
                    ? "bg-brand-500 text-white"
                    : i === 3
                    ? "bg-brand-100 text-brand-500 border-2 border-brand-500"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {i < 3 ? <CheckIcon size={12} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-3 h-0.5 ${i < 3 ? "bg-brand-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-5 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-extrabold text-slate-800 mb-1">
              Enter your account details
            </h1>
            <p className="text-slate-500 text-[13px]">
              Provide the details for your linked source
              {hasBank && hasMobile ? "s" : ""}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {hasBank && (
              <div>
                {hasMobile && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Bank Account
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                )}
                <div className="space-y-3">
                  <SelectField
                    label="Bank Name"
                    placeholder={loadingProviders ? "Loading banks…" : banks.length === 0 ? "No banks available" : "Select your bank…"}
                    options={banks}
                    value={bank.name}
                    onChange={(v) => setBank((p) => ({ ...p, name: v }))}
                    disabled={loadingProviders}
                  />
                  <InputField
                    label="Bank Account Number"
                    placeholder="Enter account number"
                    value={bank.accountNumber}
                    onChange={(v) => setBank((p) => ({ ...p, accountNumber: v }))}
                  />
                  <InputField
                    label="Bank Account Name"
                    placeholder="Name on the account"
                    value={bank.accountName}
                    onChange={(v) => setBank((p) => ({ ...p, accountName: v }))}
                  />
                </div>
              </div>
            )}

            {hasMobile && (
              <div>
                {hasBank && (
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                      Mobile Money
                    </span>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                )}
                <div className="space-y-3">
                  <SelectField
                    label="Provider"
                    placeholder={loadingProviders ? "Loading providers…" : mobileProviders.length === 0 ? "No providers available" : "Select your provider…"}
                    options={mobileProviders}
                    value={mobile.provider}
                    onChange={(v) => setMobile((p) => ({ ...p, provider: v }))}
                    disabled={loadingProviders}
                  />
                  <InputField
                    label="Phone Number"
                    placeholder="Enter phone number"
                    type="tel"
                    value={mobile.phone}
                    onChange={(v) => setMobile((p) => ({ ...p, phone: v }))}
                  />
                  <InputField
                    label="Wallet Name"
                    placeholder="Enter wallet name"
                    value={mobile.walletName}
                    onChange={(v) => setMobile((p) => ({ ...p, walletName: v }))}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <button
              className="btn-primary"
              disabled={!canContinue || isLoading}
              onClick={handleContinue}
            >
              {isLoading ? 'Linking...' : 'Continue'}
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

export default function LinkDetailsPage() {
  return (
    <Suspense>
      <LinkDetailsForm />
    </Suspense>
  );
}
