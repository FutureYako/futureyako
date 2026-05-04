"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BankIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPost } from "@/lib/api";
import { formatTsh } from "@/lib/currency";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FundingSource {
  id: string;
  source_type: "bank" | "mobile";
  name: string;
  masked_identifier: string;
  account_holder_name: string;
  is_primary: boolean;
  status: string;
}

interface WalletData {
  wallet_number: string;
  total_balance: number;
  available_balance: number;
  status: string;
  created_at: string;
}

interface TxRow {
  id: string;
  transaction_type: string;
  description: string;
  net_amount: number;
  created_at: string;
}

interface PaymentProvider {
  id: string;
  name: string;
  code: string;
}

type DepositStep = "form" | "pending" | "success";

// ─── Bank Deposit Modal ───────────────────────────────────────────────────────

function BankDepositModal({
  sources,
  onClose,
  onSuccess,
}: {
  sources: FundingSource[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const bankSources = sources.filter((s) => s.source_type === "bank");
  const primaryBank = bankSources.find((s) => s.is_primary) ?? bankSources[0];

  const [useSaved, setUseSaved] = useState(!!primaryBank);
  const [selectedSourceId, setSelectedSourceId] = useState(primaryBank?.id ?? "");

  // Manual entry fields
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [banks, setBanks] = useState<PaymentProvider[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<DepositStep>("form");
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load bank list for manual entry
  useEffect(() => {
    if (!useSaved || bankSources.length === 0) {
      setLoadingBanks(true);
      apiGet(API_ENDPOINTS.ADMIN.PUBLIC_BANKS)
        .then((res) => {
          const list = Array.isArray(res) ? res : (res?.results ?? []);
          setBanks(list);
        })
        .catch(() => {})
        .finally(() => setLoadingBanks(false));
    }
  }, [useSaved]);

  const selectedSource = bankSources.find((s) => s.id === selectedSourceId);

  const canSubmit =
    Number(amount) > 0 &&
    (useSaved && bankSources.length > 0
      ? !!selectedSource
      : bankCode !== "" && accountNumber !== "" && accountName !== "");

  async function handleSubmit() {
    setError("");
    setSubmitting(true);

    let payload: Record<string, string | number>;

    if (useSaved && selectedSource) {
      payload = {
        amount: Number(amount),
        account_number: selectedSource.masked_identifier.replace(/\*/g, ""),
        bank_code: selectedSource.name,
        account_name: selectedSource.account_holder_name,
        funding_source_id: selectedSource.id,
      };
    } else {
      payload = {
        amount: Number(amount),
        account_number: accountNumber,
        bank_code: bankCode,
        account_name: accountName,
      };
    }

    try {
      const res = await apiPost(API_ENDPOINTS.PAYMENTS.BANK_DEPOSIT, payload);
      setReference(res.reference_number ?? "");
      setMessage(res.message ?? "Bank deposit initiated. Funds will reflect once confirmed.");
      setStep("pending");
    } catch (err: any) {
      setError(err.message || "Failed to initiate bank deposit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative card w-full max-w-115 z-10 p-7">

        {step === "form" && (
          <>
            <h2 className="text-lg font-extrabold text-slate-800 mb-1">Deposit via Bank</h2>
            <p className="text-slate-500 text-[13px] mb-5">
              Funds will be credited once the bank transfer is confirmed.
            </p>

            {bankSources.length > 0 && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setUseSaved(true)}
                  className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition-all ${
                    useSaved ? "border-brand-500 bg-brand-50 text-brand-500" : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  Saved account
                </button>
                <button
                  onClick={() => setUseSaved(false)}
                  className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition-all ${
                    !useSaved ? "border-brand-500 bg-brand-50 text-brand-500" : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  New account
                </button>
              </div>
            )}

            <div className="space-y-4 mb-5">
              {useSaved && bankSources.length > 0 ? (
                <div>
                  <label className="label-sm">Bank account</label>
                  <select
                    className="input-field"
                    value={selectedSourceId}
                    onChange={(e) => setSelectedSourceId(e.target.value)}
                  >
                    {bankSources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} · {s.masked_identifier}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label-sm">Bank</label>
                    <select
                      className="input-field"
                      value={bankCode}
                      onChange={(e) => setBankCode(e.target.value)}
                      disabled={loadingBanks}
                    >
                      <option value="">
                        {loadingBanks ? "Loading banks…" : banks.length === 0 ? "Select a bank…" : "Select a bank…"}
                      </option>
                      {banks.map((b) => (
                        <option key={b.id} value={b.code}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label-sm">Account number</label>
                    <input
                      className="input-field"
                      placeholder="Enter account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label-sm">Account holder name</label>
                    <input
                      className="input-field"
                      placeholder="Name on the account"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="label-sm">Amount (TZS)</label>
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  placeholder="e.g. 100000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <div className="text-[12px] text-danger bg-danger/5 rounded-lg px-3 py-2 mb-3">{error}</div>
            )}

            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
              <button
                className="btn-primary flex-2"
                disabled={!canSubmit || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Processing…" : "Initiate Deposit"}
              </button>
            </div>
          </>
        )}

        {step === "pending" && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
              <BankIcon size={24} className="text-brand-500" />
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-2">Deposit Initiated</h2>
            <p className="text-slate-500 text-[13px] mb-2 leading-relaxed">{message}</p>
            {reference && (
              <p className="text-[11px] text-slate-400 mb-5">Ref: {reference}</p>
            )}
            <p className="text-[12px] text-slate-400 mb-5">
              Your wallet balance will update automatically once the bank confirms the transfer.
            </p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={onClose}>Close</button>
              <button
                className="btn-primary flex-1"
                onClick={() => { onSuccess(); onClose(); }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BankWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [sources, setSources] = useState<FundingSource[]>([]);
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showDeposit, setShowDeposit] = useState(false);

  async function load() {
    setFetchError(null);
    if (!localStorage.getItem("access_token")) { setIsLoading(false); return; }
    try {
      const [walletRes, sourcesRes, txnRes] = await Promise.all([
        apiGet(API_ENDPOINTS.WALLETS.DETAIL),
        apiGet(API_ENDPOINTS.WALLETS.FUNDING_SOURCES),
        apiGet(API_ENDPOINTS.TRANSACTIONS.LIST + "?ordering=-created_at"),
      ]);
      setWallet(walletRes);
      setSources(Array.isArray(sourcesRes) ? sourcesRes : (sourcesRes?.results ?? []));
      const txns = Array.isArray(txnRes) ? txnRes : (txnRes?.results ?? []);
      setTransactions(txns.slice(0, 5));
    } catch (err: any) {
      setFetchError(err.message || "Failed to load wallet data.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const bankSource = sources.find((s) => s.source_type === "bank" && s.is_primary)
    ?? sources.find((s) => s.source_type === "bank");

  const info = [
    { label: "Wallet Number", val: wallet?.wallet_number ?? "—" },
    { label: "Created", val: wallet ? new Date(wallet.created_at).toLocaleDateString() : "—" },
    { label: "Status", val: wallet?.status ?? "—", green: wallet?.status === "active" },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="grid grid-cols-[1.4fr_1fr] gap-6">
            <div className="space-y-4">
              <div className="h-48 bg-slate-200 rounded" />
              <div className="h-56 bg-slate-200 rounded" />
            </div>
            <div className="space-y-4">
              <div className="h-44 bg-slate-200 rounded" />
              <div className="h-28 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="p-8">
        <div className="card p-6 text-center">
          <p className="text-danger mb-4">{fetchError}</p>
          <button onClick={load} className="btn-primary w-auto! px-6 mx-auto">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-8">
        <h1 className="text-xl font-extrabold text-slate-800 mb-5">Bank Wallet</h1>

        <div className="grid grid-cols-[1.4fr_1fr] gap-6">
          <div>
            <div className="card p-6 mb-5 text-white bg-linear-to-br from-brand-500 to-brand-400">
              <div className="text-xs opacity-85 mb-0.5">Bank Wallet</div>
              <div className="text-[13px] opacity-70 mb-4">
                {bankSource ? bankSource.masked_identifier : "No bank linked"}
              </div>
              <div className="text-[13px] opacity-85 mb-1">Available Balance</div>
              <div className="text-3xl font-black mb-4">
                {wallet ? formatTsh(wallet.available_balance) : "TSh 0"}
              </div>
              <button
                className="bg-white/20 border border-white/40 rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-white/30 transition-colors"
                onClick={() => setShowDeposit(true)}
              >
                Add Fund
              </button>
            </div>

            <div className="card p-5">
              <div className="font-bold text-sm text-slate-800 mb-4">Recent Transactions</div>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No transactions yet.</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center">
                          <BankIcon size={15} />
                        </div>
                        <div>
                          <div className="text-[13px] font-semibold text-slate-800">{tx.description}</div>
                          <div className="text-[11px] text-slate-400">
                            {new Date(tx.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span className={`font-bold text-[13px] ${tx.net_amount > 0 ? "text-success" : "text-danger"}`}>
                        {tx.net_amount > 0 ? "+" : "-"}{formatTsh(Math.abs(tx.net_amount))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="card p-6 mb-4">
              <div className="font-bold text-[15px] text-slate-800 mb-4">Wallet Info</div>
              <div className="divide-y divide-slate-100">
                {info.map((r) => (
                  <div key={r.label} className="flex justify-between items-center py-2">
                    <span className="text-[13px] text-slate-500">{r.label}</span>
                    <span className={`text-[13px] font-semibold ${r.green ? "text-success" : "text-slate-800"}`}>
                      {r.val}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-5 mb-4">
              <div className="font-bold text-sm text-slate-800 mb-2.5">About Bank Deposits</div>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Deposits are processed via AzamPay bank checkout. Funds reflect in your wallet as soon as the transfer is confirmed by your bank.
              </p>
            </div>

            <button
              className="btn-primary block w-full mb-3"
              onClick={() => setShowDeposit(true)}
            >
              + Deposit via Bank
            </button>

            <Link href="/wallet/mobile" className="btn-outline block w-full text-center">
              View Mobile Wallet →
            </Link>
          </div>
        </div>
      </div>

      {showDeposit && (
        <BankDepositModal
          sources={sources}
          onClose={() => setShowDeposit(false)}
          onSuccess={() => {
            apiGet(API_ENDPOINTS.WALLETS.DETAIL).then(setWallet).catch(() => {});
          }}
        />
      )}
    </>
  );
}
