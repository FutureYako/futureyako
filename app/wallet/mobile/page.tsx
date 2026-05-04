"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PhoneIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPost } from "@/lib/api";

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
  total_balance: string;
  available_balance: string;
  wallet_number: string;
  status: string;
}

interface Transaction {
  id: string;
  description: string;
  amount: string;
  net_amount: string;
  status: string;
  created_at: string;
  transaction_type: string;
}

type DepositStep = "form" | "pending" | "success" | "failed";

const POLL_MS = 5_000;
const TIMEOUT_MS = 3 * 60 * 1000;

const MNO_PROVIDERS = [
  "M-Pesa",
  "Airtel",
  "Tigo",
  "Halotel",
  "TTCL",
  "MTN",
];

// ─── Deposit Modal ────────────────────────────────────────────────────────────

function MnoDepositModal({
  sources,
  onClose,
  onSuccess,
}: {
  sources: FundingSource[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const mobileSources = sources.filter((s) => s.source_type === "mobile");
  const primaryMobile = mobileSources.find((s) => s.is_primary) ?? mobileSources[0];

  const [useSaved, setUseSaved] = useState(!!primaryMobile);
  const [selectedSourceId, setSelectedSourceId] = useState(primaryMobile?.id ?? "");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState(MNO_PROVIDERS[0]);
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState<DepositStep>("form");
  const [reference, setReference] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [failReason, setFailReason] = useState("");
  const [timedOut, setTimedOut] = useState(false);
  const [pollSeconds, setPollSeconds] = useState(0);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Poll transaction status while waiting for webhook callback
  useEffect(() => {
    if (step !== "pending" || !transactionId) return;
    setTimedOut(false);
    setPollSeconds(0);

    const ticker = setInterval(() => setPollSeconds((s) => s + 1), 1000);
    const poller = setInterval(async () => {
      try {
        const txn = await apiGet(API_ENDPOINTS.TRANSACTIONS.DETAIL(transactionId));
        if (txn.status === "completed") {
          clearInterval(poller); clearInterval(ticker); clearTimeout(giveUp);
          setStep("success");
          onSuccess();
        } else if (txn.status === "failed") {
          clearInterval(poller); clearInterval(ticker); clearTimeout(giveUp);
          setFailReason(txn.failure_reason || "Payment was not completed.");
          setStep("failed");
        }
      } catch {}
    }, POLL_MS);
    const giveUp = setTimeout(() => {
      clearInterval(poller); clearInterval(ticker);
      setTimedOut(true);
    }, TIMEOUT_MS);

    return () => { clearInterval(poller); clearInterval(ticker); clearTimeout(giveUp); };
  }, [step, transactionId]);

  const canSubmit =
    amount !== "" && Number(amount) > 0 &&
    (useSaved ? selectedSourceId !== "" : phone !== "" && provider !== "");

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    const payload: Record<string, string | number> = { amount: Number(amount) };
    if (useSaved && selectedSourceId) {
      payload.funding_source_id = selectedSourceId;
    } else {
      payload.phone_number = phone;
      payload.provider = provider;
    }
    try {
      const res = await apiPost(API_ENDPOINTS.PAYMENTS.MNO_DEPOSIT, payload);
      setTransactionId(res.transaction_id ?? "");
      setReference(res.reference_number ?? "");
      setStep("pending");
    } catch (err: any) {
      setError(err.message || "Failed to initiate deposit.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={step === "form" ? onClose : undefined} />
      <div className="relative card w-full max-w-110 z-10 p-7">

        {/* ── Form ── */}
        {step === "form" && (
          <>
            <h2 className="text-lg font-extrabold text-slate-800 mb-1">Top Up via Mobile Money</h2>
            <p className="text-slate-500 text-[13px] mb-5">Funds arrive instantly after you confirm the USSD prompt.</p>

            {mobileSources.length > 0 && (
              <div className="flex gap-2 mb-4">
                {(["saved", "new"] as const).map((t) => (
                  <button key={t} onClick={() => setUseSaved(t === "saved")}
                    className={`flex-1 py-2 rounded-lg text-[13px] font-semibold border transition-all ${
                      (t === "saved") === useSaved
                        ? "border-brand-500 bg-brand-50 text-brand-500"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}>
                    {t === "saved" ? "Saved account" : "New number"}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4 mb-5">
              {useSaved && mobileSources.length > 0 ? (
                <div>
                  <label className="label-sm">Mobile account</label>
                  <select className="input-field" value={selectedSourceId} onChange={(e) => setSelectedSourceId(e.target.value)}>
                    {mobileSources.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} · {s.masked_identifier}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="label-sm">Provider</label>
                    <select className="input-field" value={provider} onChange={(e) => setProvider(e.target.value)}>
                      {MNO_PROVIDERS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label-sm">Phone number</label>
                    <input className="input-field" type="tel" placeholder="255712345678"
                      value={phone} onChange={(e) => setPhone(e.target.value)} />
                    <p className="text-[11px] text-slate-400 mt-1">Include country code (255 for Tanzania, 250 for Rwanda).</p>
                  </div>
                </>
              )}
              <div>
                <label className="label-sm">Amount (TZS)</label>
                <input className="input-field" type="number" min="1" placeholder="e.g. 50000"
                  value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
            </div>

            {error && <div className="text-[12px] text-danger bg-danger/5 rounded-lg px-3 py-2 mb-3">{error}</div>}

            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
              <button className="btn-primary flex-2" disabled={!canSubmit || submitting} onClick={handleSubmit}>
                {submitting ? "Sending…" : "Send Payment Request"}
              </button>
            </div>
          </>
        )}

        {/* ── Pending — waiting for user to approve USSD & webhook to fire ── */}
        {step === "pending" && (
          <div className="text-center py-4">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-success-light animate-ping opacity-40" />
              <div className="relative w-16 h-16 bg-success-light rounded-full flex items-center justify-center">
                <PhoneIcon size={26} className="text-success" />
              </div>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-1">Check your phone</h2>
            <p className="text-slate-500 text-[13px] mb-3 leading-relaxed">
              A USSD prompt has been sent to your mobile number. Enter your PIN to approve the payment.
            </p>
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-success animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
              <span className="text-[12px] text-slate-400 ml-2">Waiting · {pollSeconds}s</span>
            </div>
            {reference && (
              <div className="inline-block bg-slate-100 rounded-lg px-4 py-2 mb-4">
                <p className="text-[10px] text-slate-400">Reference</p>
                <p className="text-[12px] font-bold text-slate-600 tracking-wider">{reference}</p>
              </div>
            )}
            {timedOut && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-left">
                <p className="text-[12px] text-amber-700">
                  Taking longer than expected. If you approved the prompt, funds will still arrive — check your transactions in a few minutes.
                </p>
              </div>
            )}
            <p className="text-[11px] text-slate-400 mb-5">Your wallet updates automatically once the payment is confirmed.</p>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
              Close (payment continues in background)
            </button>
          </div>
        )}

        {/* ── Success ── */}
        {step === "success" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-success-light rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-success">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-1">Payment Confirmed!</h2>
            <p className="text-slate-500 text-[13px] mb-4">TSh {Number(amount).toLocaleString()} has been added to your wallet.</p>
            {reference && <p className="text-[11px] text-slate-400 mb-5">Ref: {reference}</p>}
            <button className="btn-primary w-full" onClick={onClose}>Done</button>
          </div>
        )}

        {/* ── Failed ── */}
        {step === "failed" && (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="text-danger">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-1">Payment Failed</h2>
            <p className="text-slate-500 text-[13px] mb-4">{failReason}</p>
            {reference && <p className="text-[11px] text-slate-400 mb-5">Ref: {reference}</p>}
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={onClose}>Close</button>
              <button className="btn-primary flex-1" onClick={() => { setStep("form"); setError(""); }}>Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MobileWalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [sources, setSources] = useState<FundingSource[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeposit, setShowDeposit] = useState(false);

  useEffect(() => {
    async function load() {
      if (!localStorage.getItem("access_token")) { setIsLoading(false); return; }
      try {
        const [walletRes, sourcesRes, txnRes] = await Promise.all([
          apiGet(API_ENDPOINTS.WALLETS.DETAIL),
          apiGet(API_ENDPOINTS.WALLETS.FUNDING_SOURCES),
          apiGet(API_ENDPOINTS.TRANSACTIONS.LIST + "?transaction_type=Deposit&ordering=-created_at"),
        ]);
        setWallet(walletRes);
        setSources(Array.isArray(sourcesRes) ? sourcesRes : (sourcesRes?.results ?? []));
        const txns = Array.isArray(txnRes) ? txnRes : (txnRes?.results ?? []);
        setTransactions(txns.slice(0, 5));
      } catch {}
      setIsLoading(false);
    }
    load();
  }, []);

  const mobileSources = sources.filter((s) => s.source_type === "mobile");
  const primaryMobile = mobileSources.find((s) => s.is_primary) ?? mobileSources[0];

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-TZ", { month: "short", day: "numeric", year: "numeric" });
  }

  const info = [
    { label: "Wallet Number", val: wallet?.wallet_number ?? "—" },
    { label: "Provider", val: primaryMobile?.name ?? "Not linked" },
    { label: "Status", val: wallet?.status === "active" ? "Active" : (wallet?.status ?? "—"), green: wallet?.status === "active" },
  ];

  const displayTxns = transactions.length > 0
    ? transactions
    : [
        { id: "1", label: "Mobile Money Save", date: "Today", amt: "-TSh 20" },
        { id: "2", label: "Mobile Money Save", date: "May 29, 2024", amt: "-TSh 20" },
        { id: "3", label: "Mobile Money Save", date: "May 20, 2024", amt: "-TSh 20" },
      ];

  return (
    <>
      <div className="p-8">
        <h1 className="text-xl font-extrabold text-slate-800 mb-5">Mobile Money Wallet</h1>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-50 text-slate-400">Loading…</div>
        ) : (
          <div className="grid grid-cols-[1.4fr_1fr] gap-6">
            <div>
              <div className="card p-6 mb-5 text-white bg-linear-to-br from-success to-green-600">
                <div className="text-xs opacity-85 mb-0.5">Mobile Money Wallet</div>
                <div className="text-[13px] opacity-70 mb-4">
                  {primaryMobile?.masked_identifier ?? "••••0000"}
                </div>
                <div className="text-[13px] opacity-85 mb-1">Available Balance</div>
                <div className="text-3xl font-black mb-4">
                  TSh {wallet ? Number(wallet.available_balance).toLocaleString() : "0"}
                </div>
                <div className="flex gap-2.5 flex-wrap">
                  <button
                    className="bg-white/20 border border-white/40 rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-white/30 transition-colors"
                    onClick={() => setShowDeposit(true)}
                  >
                    Top Up
                  </button>
                  <button className="bg-white/20 border border-white/40 rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-white/30 transition-colors">
                    Send Money
                  </button>
                  <button className="bg-white/20 border border-white/40 rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-white/30 transition-colors">
                    Request Money
                  </button>
                </div>
              </div>

              <div className="card p-5">
                <div className="font-bold text-sm text-slate-800 mb-4">Recent Deposits</div>
                {transactions.length === 0 ? (
                  <div className="text-[13px] text-slate-400 text-center py-4">No deposits yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-full bg-success-light text-success flex items-center justify-center">
                            <PhoneIcon size={15} />
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-slate-800">{t.description}</div>
                            <div className="text-[11px] text-slate-400">{formatDate(t.created_at)}</div>
                          </div>
                        </div>
                        <span className={`font-bold text-[13px] ${t.transaction_type === "Deposit" ? "text-success" : "text-danger"}`}>
                          +TSh {Number(t.net_amount).toLocaleString()}
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
                <div className="font-bold text-sm text-slate-800 mb-2.5">About Mobile Money Savings</div>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  Saves are made via secure STK push requests to your mobile money. You&apos;ll receive a prompt on your phone to confirm each deposit.
                </p>
              </div>

              <button
                className="btn-primary block w-full mb-3"
                onClick={() => setShowDeposit(true)}
              >
                + Deposit via Mobile Money
              </button>

              <Link href="/wallet/bank" className="btn-outline block w-full text-center">
                View Bank Wallet →
              </Link>
            </div>
          </div>
        )}
      </div>

      {showDeposit && (
        <MnoDepositModal
          sources={sources}
          onClose={() => setShowDeposit(false)}
          onSuccess={() => {
            // Reload wallet data after successful initiation
            apiGet(API_ENDPOINTS.WALLETS.DETAIL).then(setWallet).catch(() => {});
          }}
        />
      )}
    </>
  );
}
