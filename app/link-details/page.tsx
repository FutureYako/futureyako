"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckIcon } from "@/components/icons";

const STEPS = ["Sign Up", "Login", "Link Sources", "Account Details", "Wallet Created"];

// These lists will be replaced with API responses from the backend
const BANK_OPTIONS = [
  "Chase Bank",
  "Bank of America",
  "Wells Fargo",
  "Citibank",
  "US Bank",
  "Capital One",
  "TD Bank",
  "PNC Bank",
];

const PROVIDER_OPTIONS = [
  "M-Pesa",
  "Airtel Money",
  "MTN Mobile Money",
  "Tigo Pesa",
  "Orange Money",
  "Wave",
];

function SelectField({
  label,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="label-sm">{label}</label>
      <select
        className="input-field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
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

  const bankValid =
    !hasBank || (bank.name !== "" && bank.accountNumber !== "" && bank.accountName !== "");
  const mobileValid =
    !hasMobile || (mobile.provider !== "" && mobile.phone !== "" && mobile.walletName !== "");
  const canContinue = bankValid && mobileValid;

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="max-w-[480px] w-full">
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
                <div className={`w-6 h-0.5 ${i < 3 ? "bg-brand-500" : "bg-slate-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-extrabold text-slate-800 mb-1">
              Enter your account details
            </h1>
            <p className="text-slate-500 text-[13px]">
              Provide the details for your linked source
              {hasBank && hasMobile ? "s" : ""}
            </p>
          </div>

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
                    placeholder="Select your bank…"
                    options={BANK_OPTIONS}
                    value={bank.name}
                    onChange={(v) => setBank((p) => ({ ...p, name: v }))}
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
                    placeholder="Select your provider…"
                    options={PROVIDER_OPTIONS}
                    value={mobile.provider}
                    onChange={(v) => setMobile((p) => ({ ...p, provider: v }))}
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
              disabled={!canContinue}
              onClick={() => router.push("/wallet-created")}
            >
              Continue
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
