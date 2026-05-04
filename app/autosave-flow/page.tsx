"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { BankIcon, PhoneIcon, WalletIcon, GoalsIcon, InvestIcon, CheckIcon, ZapIcon, ArrowIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPost } from "@/lib/api";
import { formatTsh } from "@/lib/currency";

const POLL_INTERVAL = 15_000;
const QUICK_AMOUNTS = [50, 100, 250, 500];

// ─── Types ───────────────────────────────────────────────────────────────────

interface FundingSource {
  id: string;
  source_type: "bank" | "mobile";
  name: string;
  masked_identifier: string;
  is_primary: boolean;
  status: string;
}

interface Goal {
  id: string;
  name: string;
  goal_type: "savings" | "emergency" | "group";
  current_amount: number;
  target_amount: number;
  status: string;
}

interface DeductionLog {
  id: string;
  scheduled_at: string;
  executed_at: string | null;
  amount: number;
  status: "completed" | "pending" | "failed";
  funding_source_name?: string;
  failure_reason?: string | null;
}

interface WalletData {
  wallet_number: string;
  total_balance: number;
  available_balance: number;
}

interface AutosavePrefs {
  amount: number;
  amount_type: string;
  frequency: string;
  duration_months: number;
  is_enabled: boolean;
  next_deduction_at: string | null;
  commitment_end_at: string | null;
}

interface Portfolio {
  total_value: number;
  total_invested: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return formatTsh(n);
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "Not scheduled";
  return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
}

function maskAccount(val: string) {
  if (!val) return "—";
  if (val.startsWith("+") && val.length > 6) return val.slice(0, 4) + " •••• " + val.slice(-3);
  if (val.length > 4) return "•••• " + val.slice(-4);
  return val;
}

// ─── Deposit Modal ────────────────────────────────────────────────────────────

type DepositStep = "form" | "review" | "pending" | "success" | "failed";

const POLL_INTERVAL_MS = 5_000;
const POLL_TIMEOUT_MS  = 3 * 60 * 1000; // 3 minutes

function DepositModal({
  sources,
  onClose,
  onSuccess,
}: {
  sources: FundingSource[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<DepositStep>("form");
  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState(
    sources.find((s) => s.is_primary)?.id ?? sources[0]?.id ?? ""
  );
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reference, setReference] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [failReason, setFailReason] = useState<string>("");
  const [timedOut, setTimedOut] = useState(false);
  const [pollSeconds, setPollSeconds] = useState(0);

  const selectedSource = sources.find((s) => s.id === sourceId);
  const parsedAmount = parseFloat(amount) || 0;
  const canReview = parsedAmount >= 1 && sourceId !== "";

  // Poll transaction status while step === "pending"
  useEffect(() => {
    if (step !== "pending" || !transactionId) return;

    setTimedOut(false);
    setPollSeconds(0);

    const ticker = setInterval(() => setPollSeconds((s) => s + 1), 1000);

    const poller = setInterval(async () => {
      try {
        const txn = await apiGet(API_ENDPOINTS.TRANSACTIONS.DETAIL(transactionId));
        if (txn.status === "completed") {
          clearInterval(poller);
          clearInterval(ticker);
          clearTimeout(giveUp);
          setStep("success");
          onSuccess();
        } else if (txn.status === "failed") {
          clearInterval(poller);
          clearInterval(ticker);
          clearTimeout(giveUp);
          setFailReason(txn.failure_reason || "Payment was not completed.");
          setStep("failed");
        }
      } catch {}
    }, POLL_INTERVAL_MS);

    const giveUp = setTimeout(() => {
      clearInterval(poller);
      clearInterval(ticker);
      setTimedOut(true);
    }, POLL_TIMEOUT_MS);

    return () => {
      clearInterval(poller);
      clearInterval(ticker);
      clearTimeout(giveUp);
    };
  }, [step, transactionId]);

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isMobile = selectedSource?.source_type === "mobile";
      const endpoint = isMobile
        ? API_ENDPOINTS.PAYMENTS.MNO_DEPOSIT
        : API_ENDPOINTS.PAYMENTS.BANK_DEPOSIT;

      const res = await apiPost(endpoint, {
        amount: parsedAmount,
        funding_source_id: sourceId,
      });
      setTransactionId(res?.transaction_id || "");
      setReference(res?.reference_number || "");
      setStep("pending");
    } catch (err: any) {
      setError(err.message || "Deposit failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* ── Step: Form ── */}
        {step === "form" && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-[16px] font-extrabold text-slate-800">Deposit to Wallet</h2>
                <p className="text-[12px] text-slate-400 mt-0.5">Add money to your SaveWise wallet manually</p>
              </div>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Amount */}
              <div>
                <label className="label-sm">Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">TSh</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="input-field pl-14 text-xl font-bold"
                  />
                </div>
                {/* Quick amounts */}
                <div className="flex gap-2 mt-2">
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setAmount(String(q))}
                      className={`flex-1 py-1.5 rounded-lg text-[12px] font-bold border transition-all ${
                        parsedAmount === q
                          ? "bg-brand-500 text-white border-brand-500"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:border-brand-300 hover:text-brand-500"
                      }`}
                    >
                      {formatTsh(q)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Source selector */}
              <div>
                <label className="label-sm">From</label>
                {sources.length === 0 ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-[12px] text-slate-500 text-center">
                    No funding sources linked.{" "}
                    <Link href="/funding-sources" className="text-brand-500 font-semibold hover:underline">Add one →</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sources.map((s) => {
                      const isBank = s.source_type === "bank";
                      const selected = s.id === sourceId;
                      return (
                        <button
                          key={s.id}
                          onClick={() => setSourceId(s.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                            selected
                              ? "border-brand-500 bg-brand-50"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            isBank ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                          }`}>
                            {isBank ? <BankIcon size={15} /> : <PhoneIcon size={15} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold text-slate-700 truncate">{s.name}</div>
                            <div className="text-[11px] text-slate-400">{maskAccount(s.masked_identifier)}</div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {s.is_primary && (
                              <span className="text-[9px] font-bold bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full">PRIMARY</span>
                            )}
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                              selected ? "border-brand-500 bg-brand-500" : "border-slate-300"
                            }`}>
                              {selected && <CheckIcon size={9} className="text-white" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="label-sm">Note <span className="text-slate-300 font-normal">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. Monthly top-up"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="input-field"
                  maxLength={120}
                />
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button
                disabled={!canReview}
                onClick={() => setStep("review")}
                className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Review <ArrowIcon size={14} />
              </button>
            </div>
          </>
        )}

        {/* ── Step: Review ── */}
        {step === "review" && (
          <>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-[16px] font-extrabold text-slate-800">Review Deposit</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Summary card */}
              <div className="bg-brand-50 border border-brand-200 rounded-2xl p-5 text-center">
                <p className="text-[12px] text-brand-500 font-semibold uppercase tracking-wider mb-1">Depositing</p>
                <p className="text-4xl font-extrabold text-brand-700">{fmt(parsedAmount)}</p>
                <p className="text-[12px] text-brand-500 mt-1">→ SaveWise Wallet</p>
              </div>

              {/* Detail rows */}
              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-[12px] text-slate-500">From</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      selectedSource?.source_type === "bank" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                    }`}>
                      {selectedSource?.source_type === "bank" ? <BankIcon size={11} /> : <PhoneIcon size={11} />}
                    </div>
                    <span className="text-[12px] font-semibold text-slate-700">{selectedSource?.name}</span>
                    <span className="text-[11px] text-slate-400">{maskAccount(selectedSource?.masked_identifier ?? "")}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-[12px] text-slate-500">To</span>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-brand-100 flex items-center justify-center text-brand-500">
                      <WalletIcon size={11} />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-700">SaveWise Wallet</span>
                  </div>
                </div>
                {note && (
                  <div className="flex justify-between items-center px-4 py-3">
                    <span className="text-[12px] text-slate-500">Note</span>
                    <span className="text-[12px] text-slate-700">{note}</span>
                  </div>
                )}
              </div>

              {/* How it works note */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[11px] text-slate-500 font-semibold mb-1">What happens next</p>
                {selectedSource?.source_type === "bank" ? (
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    A bank transfer will be initiated from your account. Funds typically arrive in your SaveWise wallet within <span className="font-semibold text-slate-700">1–3 business days</span> once payment processing is live.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    You will receive a <span className="font-semibold text-slate-700">push notification</span> on your mobile money number to approve the payment. It completes instantly once approved.
                  </p>
                )}
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-[12px] text-red-600">{error}</p>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => { setStep("form"); setError(null); }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                ← Back
              </button>
              <button
                disabled={isLoading}
                onClick={handleConfirm}
                className="flex-1 btn-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? "Processing..." : "Confirm Deposit"}
              </button>
            </div>
          </>
        )}

        {/* ── Step: Pending (waiting for USSD approval / webhook) ── */}
        {step === "pending" && (
          <div className="px-6 py-10 text-center">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-brand-100 animate-ping opacity-40" />
              <div className="relative w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
                <PhoneIcon size={26} className="text-brand-500" />
              </div>
            </div>
            <h2 className="text-[18px] font-extrabold text-slate-800 mb-1">
              {selectedSource?.source_type === "mobile" ? "Check your phone" : "Processing payment…"}
            </h2>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-3">
              {selectedSource?.source_type === "mobile"
                ? "A USSD prompt has been sent to your mobile number. Enter your PIN to approve the payment."
                : "Your bank transfer is being processed. This may take a moment."}
            </p>

            {/* Animated waiting dots */}
            <div className="flex items-center justify-center gap-1.5 mb-4">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
              <span className="text-[12px] text-slate-400 ml-2">
                Waiting for confirmation · {pollSeconds}s
              </span>
            </div>

            {reference && (
              <div className="inline-block bg-slate-100 rounded-lg px-4 py-2 mb-4">
                <p className="text-[10px] text-slate-400">Reference</p>
                <p className="text-[12px] font-bold text-slate-600 tracking-wider">{reference}</p>
              </div>
            )}

            {timedOut && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <p className="text-[12px] text-amber-700">
                  Taking longer than expected. If you approved the prompt, funds will still arrive — check your transactions in a few minutes.
                </p>
              </div>
            )}

            <p className="text-[11px] text-slate-400 mb-5">
              Your wallet balance will update automatically once the payment is confirmed.
            </p>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              Close (payment continues in background)
            </button>
          </div>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
              <CheckIcon size={30} />
            </div>
            <h2 className="text-[18px] font-extrabold text-slate-800 mb-1">Payment Confirmed!</h2>
            <p className="text-[13px] text-slate-500 leading-relaxed mb-1">
              <span className="font-bold text-slate-700">{fmt(parsedAmount)}</span> has been added to your wallet from{" "}
              <span className="font-semibold text-slate-700">{selectedSource?.name}</span>.
            </p>
            {reference && (
              <div className="inline-block bg-slate-100 rounded-lg px-4 py-2 mb-6 mt-2">
                <p className="text-[11px] text-slate-500">Reference</p>
                <p className="text-[13px] font-bold text-slate-700 tracking-wider">{reference}</p>
              </div>
            )}
            <button onClick={onClose} className="btn-primary w-full">
              Done
            </button>
          </div>
        )}

        {/* ── Step: Failed ── */}
        {step === "failed" && (
          <div className="px-6 py-10 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2 className="text-[18px] font-extrabold text-slate-800 mb-1">Payment Failed</h2>
            <p className="text-[13px] text-slate-500 mb-2">{failReason}</p>
            {reference && (
              <p className="text-[11px] text-slate-400 mb-5">Ref: {reference}</p>
            )}
            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                Close
              </button>
              <button
                onClick={() => { setStep("form"); setError(null); }}
                className="flex-1 btn-primary"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Flow sub-components ──────────────────────────────────────────────────────

function FlowConnector({ active }: { active: boolean }) {
  return (
    <div className="hidden md:flex flex-col items-center justify-center gap-1 px-1 w-14 shrink-0">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full transition-all duration-500 ${
            active ? "bg-brand-400 animate-pulse" : "bg-slate-200"
          }`}
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
      <div className={`text-xs font-bold mt-0.5 ${active ? "text-brand-400" : "text-slate-300"}`}>►</div>
    </div>
  );
}

function SourceCard({ source }: { source: FundingSource }) {
  const isBank = source.source_type === "bank";
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isBank ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
        {isBank ? <BankIcon size={16} /> : <PhoneIcon size={16} />}
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-bold text-slate-700 truncate">{source.name}</div>
        <div className="text-[11px] text-slate-400">{maskAccount(source.masked_identifier)}</div>
      </div>
      {source.is_primary && (
        <span className="ml-auto text-[9px] font-bold bg-brand-100 text-brand-600 px-1.5 py-0.5 rounded-full shrink-0">PRIMARY</span>
      )}
    </div>
  );
}

function GoalBar({ goal }: { goal: Goal }) {
  const pct = goal.target_amount > 0 ? Math.min(100, (goal.current_amount / goal.target_amount) * 100) : 0;
  const colors: Record<Goal["goal_type"], string> = {
    savings: "bg-brand-500",
    emergency: "bg-amber-500",
    group: "bg-purple-500",
  };
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-semibold text-slate-600 truncate">{goal.name}</span>
        <span className="text-[11px] text-slate-400 ml-2 shrink-0">{fmt(goal.current_amount)}</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors[goal.goal_type]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: DeductionLog["status"] }) {
  if (status === "completed") return <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">Success</span>;
  if (status === "failed") return <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">Failed</span>;
  return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Pending</span>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AutoSaveFlowPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [sources, setSources] = useState<FundingSource[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [logs, setLogs] = useState<DeductionLog[]>([]);
  const [prefs, setPrefs] = useState<AutosavePrefs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const [flash, setFlash] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const prevBalance = useRef<number | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [walletRes, sourcesRes, goalsRes, portfolioRes, logsRes, prefsRes] = await Promise.allSettled([
        apiGet(API_ENDPOINTS.WALLETS.DETAIL),
        apiGet(API_ENDPOINTS.WALLETS.FUNDING_SOURCES),
        apiGet(API_ENDPOINTS.GOALS.LIST),
        apiGet(API_ENDPOINTS.INVESTMENTS.PORTFOLIO),
        apiGet(API_ENDPOINTS.AUTOSAVE.LOGS),
        apiGet(API_ENDPOINTS.AUTOSAVE.PREFERENCES),
      ]);

      if (walletRes.status === "fulfilled") {
        const w = walletRes.value;
        if (prevBalance.current !== null && w.total_balance > prevBalance.current) {
          setFlash(true);
          setTimeout(() => setFlash(false), 1800);
        }
        prevBalance.current = w.total_balance;
        setWallet(w);
      }
      if (sourcesRes.status === "fulfilled") {
        const s = sourcesRes.value;
        setSources(Array.isArray(s) ? s : (s.results ?? []));
      }
      if (goalsRes.status === "fulfilled") {
        const g = goalsRes.value;
        setGoals((Array.isArray(g) ? g : (g.results ?? [])).filter((g: Goal) => g.status === "active"));
      }
      if (portfolioRes.status === "fulfilled") setPortfolio(portfolioRes.value);
      if (logsRes.status === "fulfilled") {
        const l = logsRes.value;
        setLogs((Array.isArray(l) ? l : (l.results ?? [])).slice(0, 8));
      }
      if (prefsRes.status === "fulfilled") setPrefs(prefsRes.value);

      setLastUpdated(new Date());
      setSecondsAgo(0);
    } catch {
      // Keep stale data on poll failure
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const poll = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [fetchAll]);

  useEffect(() => {
    const tick = setInterval(() => setSecondsAgo((s) => s + 1), 1000);
    return () => clearInterval(tick);
  }, [lastUpdated]);

  // After a successful deposit, flash the wallet and refresh after 2s
  const handleDepositSuccess = useCallback(() => {
    setFlash(true);
    setTimeout(() => { setFlash(false); fetchAll(); }, 2000);
  }, [fetchAll]);

  const bankSources = sources.filter((s) => s.source_type === "bank");
  const mobileSources = sources.filter((s) => s.source_type === "mobile");
  const savingsGoals = goals.filter((g) => g.goal_type === "savings");
  const emergencyGoals = goals.filter((g) => g.goal_type === "emergency");
  const groupGoals = goals.filter((g) => g.goal_type === "group");
  const hasSources = sources.length > 0;
  const isActive = prefs?.is_enabled ?? false;
  const totalGoalAmount = goals.reduce((s, g) => s + (g.current_amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-400 text-sm animate-pulse">Loading flow data...</div>
      </div>
    );
  }

  return (
    <>
      {depositOpen && (
        <DepositModal
          sources={sources}
          onClose={() => setDepositOpen(false)}
          onSuccess={handleDepositSuccess}
        />
      )}

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Auto-Save Flow</h1>
            <p className="text-slate-500 text-sm mt-0.5">Live view of how money moves through your account</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Updated {secondsAgo < 5 ? "just now" : `${secondsAgo}s ago`}
              </span>
            )}
            <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[11px] font-bold text-green-700">LIVE</span>
            </div>
            <button
              onClick={() => setDepositOpen(true)}
              className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Deposit
            </button>
            <button
              onClick={fetchAll}
              className="text-xs text-slate-500 font-semibold hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* ── Flow Diagram ── */}
        <div className="flex items-stretch gap-0">

          {/* Column 1: Funding Sources */}
          <div className="flex-1 card p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <ZapIcon size={14} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 1</div>
                <div className="text-[13px] font-bold text-slate-700">Funding Sources</div>
              </div>
            </div>

            {sources.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-[12px] text-slate-400">No sources linked yet.</p>
                <Link href="/funding-sources" className="text-[12px] text-brand-500 font-semibold hover:underline mt-1 block">
                  + Link a source
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {bankSources.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bank</p>
                    <div className="space-y-1.5">
                      {bankSources.map((s) => <SourceCard key={s.id} source={s} />)}
                    </div>
                  </div>
                )}
                {mobileSources.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 mt-2">Mobile Money</p>
                    <div className="space-y-1.5">
                      {mobileSources.map((s) => <SourceCard key={s.id} source={s} />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {prefs && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {prefs.amount_type === "Percentage" ? `${prefs.amount}% of income` : fmt(prefs.amount)}
                  </span>{" "}
                  deducted {prefs.frequency.toLowerCase()}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Next: <span className="font-semibold text-slate-600">{formatDate(prefs.next_deduction_at)}</span>
                </p>
              </div>
            )}
          </div>

          <FlowConnector active={hasSources && isActive} />

          {/* Column 2: SaveWise Wallet */}
          <div className={`flex-1 card p-5 transition-all duration-700 ${flash ? "ring-2 ring-green-400 bg-green-50/30" : ""}`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-brand-100 flex items-center justify-center text-brand-500">
                <WalletIcon size={14} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 2</div>
                <div className="text-[13px] font-bold text-slate-700">SaveWise Wallet</div>
              </div>
              {flash && (
                <span className="ml-auto text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full animate-pulse">
                  ↑ New deposit
                </span>
              )}
            </div>

            {wallet ? (
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-slate-400 font-medium">{wallet.wallet_number}</div>
                  <div className={`text-3xl font-extrabold mt-1 transition-colors duration-700 ${flash ? "text-green-600" : "text-slate-800"}`}>
                    {fmt(wallet.total_balance)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Total balance</div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <div className="text-[10px] text-slate-400 font-medium">Available</div>
                    <div className="text-[14px] font-bold text-slate-700 mt-0.5">{fmt(wallet.available_balance)}</div>
                  </div>
                  <div className="bg-brand-50 rounded-lg p-2.5">
                    <div className="text-[10px] text-brand-500 font-medium">In Goals</div>
                    <div className="text-[14px] font-bold text-brand-700 mt-0.5">{fmt(totalGoalAmount)}</div>
                  </div>
                </div>

                {/* Deposit button inside wallet card */}
                <button
                  onClick={() => setDepositOpen(true)}
                  className="w-full py-2 rounded-xl border-2 border-dashed border-brand-300 text-brand-500 text-[12px] font-bold hover:bg-brand-50 transition-colors"
                >
                  + Deposit manually
                </button>

                <div className="pt-1 border-t border-slate-100">
                  <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${isActive ? "text-green-600" : "text-slate-400"}`}>
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-slate-300"}`} />
                    Auto-save {isActive ? "active" : "paused"}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[12px] text-slate-400 py-6 text-center">Wallet not found</div>
            )}
          </div>

          <FlowConnector active={hasSources && isActive} />

          {/* Column 3: Destinations */}
          <div className="flex-1 card p-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-500">
                <GoalsIcon size={14} />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Step 3</div>
                <div className="text-[13px] font-bold text-slate-700">Destinations</div>
              </div>
            </div>

            {savingsGoals.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Savings Goals</p>
                <div className="space-y-2.5">
                  {savingsGoals.map((g) => <GoalBar key={g.id} goal={g} />)}
                </div>
              </div>
            )}
            {emergencyGoals.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2">Emergency Fund</p>
                <div className="space-y-2.5">
                  {emergencyGoals.map((g) => <GoalBar key={g.id} goal={g} />)}
                </div>
              </div>
            )}
            {groupGoals.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2">Group Goals</p>
                <div className="space-y-2.5">
                  {groupGoals.map((g) => <GoalBar key={g.id} goal={g} />)}
                </div>
              </div>
            )}
            {portfolio && portfolio.total_value > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-wider mb-2">Investments</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-500">
                      <InvestIcon size={13} />
                    </div>
                    <span className="text-[12px] text-slate-600 font-medium">Portfolio</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-700">{fmt(portfolio.total_value)}</span>
                </div>
              </div>
            )}
            {goals.length === 0 && !portfolio && (
              <div className="text-center py-4">
                <p className="text-[12px] text-slate-400">No active goals yet.</p>
                <Link href="/goals" className="text-[12px] text-brand-500 font-semibold hover:underline mt-1 block">
                  + Create a goal
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* ── Recent Deposits & Deductions ── */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="text-[14px] font-bold text-slate-700">Recent Activity</h2>
            <Link href="/transactions" className="text-[12px] text-brand-500 font-semibold hover:underline">
              View all →
            </Link>
          </div>

          {logs.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px] text-slate-400">No activity yet.</p>
              <button onClick={() => setDepositOpen(true)} className="text-[12px] text-brand-500 font-semibold hover:underline mt-1">
                Make your first deposit →
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {logs.map((log) => {
                const isBank = (log.funding_source_name || "").toLowerCase().includes("bank");
                return (
                  <div key={log.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isBank ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                      {isBank ? <BankIcon size={14} /> : <PhoneIcon size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-slate-700">
                        {log.funding_source_name || "Funding source"}
                      </div>
                      {log.failure_reason && (
                        <div className="text-[11px] text-red-500 mt-0.5 truncate">{log.failure_reason}</div>
                      )}
                    </div>
                    <div className="text-[13px] font-bold text-slate-800 shrink-0">{fmt(log.amount)}</div>
                    <div className="text-[11px] text-slate-400 w-16 text-right shrink-0">
                      {timeAgo(log.executed_at || log.scheduled_at)}
                    </div>
                    <StatusBadge status={log.status} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Autosave Settings Summary ── */}
        {prefs && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[14px] font-bold text-slate-700">Autosave Settings</h2>
              <Link href="/settings" className="text-[12px] text-brand-500 font-semibold hover:underline">
                Edit →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Status</div>
                <div className={`flex items-center gap-1.5 text-[13px] font-bold ${prefs.is_enabled ? "text-green-600" : "text-slate-400"}`}>
                  <span className={`w-2 h-2 rounded-full ${prefs.is_enabled ? "bg-green-500" : "bg-slate-300"}`} />
                  {prefs.is_enabled ? "Active" : "Paused"}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Amount</div>
                <div className="text-[13px] font-bold text-slate-700">
                  {prefs.amount_type === "Percentage" ? `${prefs.amount}% of income` : fmt(prefs.amount)}
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Frequency</div>
                <div className="text-[13px] font-bold text-slate-700">{prefs.frequency}</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-3">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Next Deduction</div>
                <div className="text-[13px] font-bold text-slate-700">{formatDate(prefs.next_deduction_at)}</div>
              </div>
            </div>
            {prefs.commitment_end_at && (
              <p className="text-[11px] text-slate-400 mt-3">
                Commitment ends: <span className="font-semibold text-slate-600">{formatDate(prefs.commitment_end_at)}</span>
                &nbsp;·&nbsp;{prefs.duration_months} month plan
              </p>
            )}
          </div>
        )}

        {/* ── Payment integration note ── */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="text-amber-500 mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <p className="text-[12px] text-amber-800 leading-relaxed">
            <span className="font-bold">Payment processing coming soon.</span> Deposit requests are recorded and ready.
            Real money movement will activate once the payment gateway is integrated.
            All your preferences and goals are saved and waiting.
          </p>
        </div>

      </div>
    </>
  );
}
