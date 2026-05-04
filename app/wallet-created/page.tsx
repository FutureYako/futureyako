"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { CheckIcon, CopyIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet } from "@/lib/api";

const STEPS = ["Sign Up", "Login", "Link Sources", "Account Details", "Saving Prefs", "Routing", "Review", "Wallet Created"];

interface Wallet {
  wallet_number: string;
}

export default function WalletCreatedPage() {
  const [walletNumber, setWalletNumber] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const data: Wallet = await apiGet(API_ENDPOINTS.WALLETS.DETAIL);
        setWalletNumber(data.wallet_number);
      } catch (err) {
        console.error('Failed to fetch wallet:', err);
        setWalletNumber("SV 0000 0000 0000");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWallet();
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(walletNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5 py-8">
        <div className="text-slate-500">Creating your wallet...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="max-w-110 w-full">
        <div className="flex justify-center gap-2 mb-7">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center">
                <CheckIcon size={12} />
              </div>
              {i < STEPS.length - 1 && <div className="w-3 h-0.5 bg-brand-500" />}
            </div>
          ))}
        </div>

        <div className="card p-9 text-center">
          <div className="w-[70px] h-[70px] bg-success-light rounded-full mx-auto mb-5 flex items-center justify-center text-success">
            <CheckIcon size={32} />
          </div>
          <h1 className="text-[22px] font-extrabold text-slate-800 mb-2">
            Your wallet is ready!
          </h1>
          <p className="text-slate-500 text-sm mb-7">
            Your unique savings wallet has been created successfully.
          </p>

          <div className="bg-brand-50 border-2 border-dashed border-brand-200 rounded-xl p-5 mb-7">
            <div className="text-xs text-brand-700 mb-1.5 font-semibold">
              Your Wallet Number
            </div>
            <div className="flex items-center justify-center gap-3">
              <span className="font-extrabold text-lg text-brand-500 tracking-[2px]">
                {walletNumber}
              </span>
              <button
                onClick={handleCopy}
                aria-label="Copy wallet number"
                className="text-brand-500 hover:text-brand-700 transition-colors"
              >
                <CopyIcon size={16} />
              </button>
            </div>
            <div className="text-[11px] text-brand-300 mt-1.5">
              {copied ? "Copied!" : "This is your unique wallet number."}
            </div>
          </div>

          <Link href="/dashboard" className="btn-primary block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
