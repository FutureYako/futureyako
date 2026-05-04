"use client";

import { useState, useEffect } from "react";
import { SparkLine } from "@/components/ui/Charts";
import { CheckIcon, InvestIcon, BankIcon, PhoneIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPost } from "@/lib/api";
import { useSettings } from "@/lib/settings-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type Risk = "Low" | "Medium" | "High";
type InvestStep = "amount" | "review" | "success";

interface Fund {
  id: string;
  name: string;
  category: string;
  annual_roi: number;
  min_investment: number;
  risk_level: Risk;
  duration: string;
  description: string;
  highlights: string[];
  is_active: boolean;
  projected_return_example: string;
  investor_count: number;
  created_at: string;
  updated_at: string;
}

interface Holding {
  id: string;
  fund: string;
  fund_details: { name: string; category: string; annual_roi: number };
  amount_invested: number;
  current_value: number;
  projected_return: number;
  projected_value: number;
  roi_percentage: number;
  status: string;
  invested_at: string;
  reference_number: string;
  funding_source: string;
  funding_source_name: string;
}

interface FundingSource {
  id: string;
  source_type: string;
  name: string;
  is_primary: boolean;
  status: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const riskStyle: Record<string, string> = {
  Low: "bg-success-light text-success",
  Medium: "bg-warning-light text-warning",
  High: "bg-danger-light text-danger",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  "Real Estate": "🏢",
  "Agriculture": "🌾",
  "Technology": "💻",
  "Energy": "⚡",
  "Healthcare": "🏥",
  "Education": "📚",
  "Finance": "🏦",
};

const CATEGORY_BG: Record<string, string> = {
  "Real Estate": "bg-indigo-900",
  "Agriculture": "bg-green-800",
  "Technology": "bg-sky-900",
  "Energy": "bg-teal-800",
  "Healthcare": "bg-rose-900",
  "Education": "bg-amber-800",
  "Finance": "bg-slate-700",
};

const CATEGORY_GRADIENT: Record<string, string> = {
  "Real Estate": "linear-gradient(135deg,#0f172a 0%,#1e1b4b 55%,#0f172a 100%)",
  "Agriculture": "linear-gradient(160deg,#14532d 0%,#15803d 55%,#166534 100%)",
  "Technology": "linear-gradient(135deg,#0c1445 0%,#0a2a5e 55%,#0369a1 100%)",
  "Energy": "linear-gradient(160deg,#0f766e 0%,#0d9488 45%,#b45309 100%)",
};

const QUICK_AMOUNTS = [50, 100, 250, 500, 1000];

function FundAvatar({ fund, size = 36 }: { fund: Fund; size?: number }) {
  const emoji = CATEGORY_EMOJIS[fund.category] || "📈";
  const bg = CATEGORY_BG[fund.category] || "bg-slate-700";
  return (
    <div
      className={`rounded-xl flex items-center justify-center shrink-0 ${bg}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {emoji}
    </div>
  );
}

// ─── Fund cover art ───────────────────────────────────────────────────────────

function FundCoverArt({ fund, tall }: { fund: Fund; tall?: boolean }) {
  const h = tall ? "h-52" : "h-44";
  const gradient = CATEGORY_GRADIENT[fund.category] || "linear-gradient(135deg,#1e293b 0%,#334155 55%,#1e293b 100%)";
  const emoji = CATEGORY_EMOJIS[fund.category] || "📈";

  return (
    <div
      className={`relative ${h} overflow-hidden rounded-t-xl`}
      style={{ background: gradient }}
    >
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full"
        style={{ background: "radial-gradient(circle,rgba(99,102,241,.35) 0%,transparent 70%)" }}
      />
      <div className="absolute inset-0 flex items-center justify-center pb-8 text-[54px] select-none">
        {emoji}
      </div>
      <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full border border-white/20">
        {fund.annual_roi}% ROI
      </div>
    </div>
  );
}

// ─── Fund card ────────────────────────────────────────────────────────────────

function FundCard({
  fund,
  onView,
  onInvest,
}: {
  fund: Fund;
  onView: () => void;
  onInvest: () => void;
}) {
  const { formatCurrency, t } = useSettings();
  return (
    <div
      className="card overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={onView}
    >
      <FundCoverArt fund={fund} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <div className="font-bold text-sm text-slate-800 leading-tight">{fund.name}</div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${riskStyle[fund.risk_level] || ""}`}>
            {fund.risk_level}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mb-3">
          {fund.category} · {fund.duration} · Min {formatCurrency(fund.min_investment)}
        </div>
        <button
          className="btn-primary py-2! text-[13px]!"
          onClick={(e) => {
            e.stopPropagation();
            onInvest();
          }}
        >
          Invest Now
        </button>
      </div>
    </div>
  );
}

// ─── Fund detail modal ────────────────────────────────────────────────────────

function FundDetailModal({
  fund,
  onClose,
  onInvest,
}: {
  fund: Fund;
  onClose: () => void;
  onInvest: () => void;
}) {
  const { formatCurrency, t } = useSettings();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative card w-full max-w-125 z-10 max-h-[92vh] overflow-y-auto">
        <FundCoverArt fund={fund} tall />
        <button
          onClick={onClose}
          className="absolute top-3 left-3 w-8 h-8 bg-black/35 hover:bg-black/55 rounded-full text-white flex items-center justify-center text-xl leading-none transition-all"
        >
          ×
        </button>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">{fund.name}</h2>
              <span className="text-[12px] text-slate-400">{fund.category}</span>
            </div>
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${riskStyle[fund.risk_level] || ""}`}>
              {fund.risk_level} Risk
            </span>
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: "Annual ROI", val: `${fund.annual_roi}%`, cls: "text-success" },
              { label: "Min. Invest", val: formatCurrency(fund.min_investment), cls: "text-slate-800" },
              { label: "Duration", val: fund.duration, cls: "text-slate-800 text-sm!" },
            ].map((s) => (
              <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
                <div className="text-[11px] text-slate-400 mb-1">{s.label}</div>
                <div className={`text-[17px] font-extrabold ${s.cls}`}>{s.val}</div>
              </div>
            ))}
          </div>

          {/* About */}
          <div className="mb-5">
            <div className="font-bold text-sm text-slate-800 mb-1.5">About This Fund</div>
            <p className="text-[13px] text-slate-500 leading-relaxed">{fund.description}</p>
          </div>

          {/* Highlights */}
          {fund.highlights && fund.highlights.length > 0 && (
            <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-5">
              <div className="font-bold text-sm text-brand-700 mb-2.5">Why Invest?</div>
              <div className="space-y-2">
                {fund.highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 text-[12px] text-brand-700">
                    <span className="text-brand-500">
                      <CheckIcon size={11} />
                    </span>
                    {h}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button className="btn-outline flex-1" onClick={onClose}>
              Close
            </button>
            <button className="btn-primary flex-2" onClick={onInvest}>
              Invest Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Invest modal ─────────────────────────────────────────────────────────────

function InvestModal({ fund, fundingSources, onClose, onSuccess }: { fund: Fund; fundingSources: FundingSource[]; onClose: () => void; onSuccess: () => void }) {
  const { formatCurrency, t } = useSettings();
  const [step, setStep] = useState<InvestStep>("amount");
  const [amount, setAmount] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [ref, setRef] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const canReview = amountNum >= fund.min_investment && selectedSource !== "";
  const projReturn = ((amountNum * fund.annual_roi) / 100).toFixed(2);
  const projValue = (amountNum + parseFloat(projReturn)).toFixed(2);

  useEffect(() => {
    if (fundingSources.length > 0 && !selectedSource) {
      const primary = fundingSources.find((s) => s.is_primary);
      setSelectedSource((primary || fundingSources[0]).id);
    }
  }, [fundingSources]);

  async function handleConfirm() {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiPost(API_ENDPOINTS.INVESTMENTS.HOLDINGS, {
        fund: fund.id,
        funding_source: selectedSource,
        amount_invested: amountNum,
      });
      setRef(res.reference_number || "N/A");
      setStep("success");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create investment");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" onClick={step === "success" ? onClose : undefined} />
      <div className="relative card w-full max-w-110 z-10 max-h-[92vh] overflow-y-auto p-7">

        {/* ── Step: Amount ── */}
        {step === "amount" && (
          <>
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
              <FundAvatar fund={fund} size={40} />
              <div>
                <div className="font-bold text-sm text-slate-800">{fund.name}</div>
                <div className="text-[11px] text-slate-400">{fund.annual_roi}% ROI · {fund.risk_level} risk</div>
              </div>
              <button onClick={onClose} className="ml-auto text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <h2 className="text-lg font-extrabold text-slate-800 mb-1">How much to invest?</h2>
            <p className="text-[13px] text-slate-400 mb-4">Minimum investment: <strong className="text-slate-700">{formatCurrency(fund.min_investment)}</strong></p>

            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_AMOUNTS.filter((a) => a >= fund.min_investment).map((a) => (
                <button
                  key={a}
                  onClick={() => setAmount(String(a))}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] transition-all ${
                    amount === String(a)
                      ? "border-brand-500 bg-brand-50 text-brand-500"
                      : "border-slate-200 text-slate-500 bg-white hover:border-slate-300"
                  }`}
                >
                  {formatCurrency(a)}
                </button>
              ))}
            </div>

            {/* Custom amount */}
            <div className="relative mb-4">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">TSh</span>
              <input
                className="input-field !pl-14"
                type="number"
                placeholder={`e.g. ${fund.min_investment}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {amountNum > 0 && amountNum >= fund.min_investment && (
              <div className="bg-success-light rounded-xl p-3 mb-4 text-[12px] text-success font-semibold">
                Projected 1-year return: +{formatCurrency(parseFloat(projReturn))} → total {formatCurrency(parseFloat(projValue))}
              </div>
            )}
            {amountNum > 0 && amountNum < fund.min_investment && (
              <div className="bg-danger-light rounded-xl p-3 mb-4 text-[12px] text-danger font-semibold">
                Amount is below the minimum of {formatCurrency(fund.min_investment)}.
              </div>
            )}

            {/* Funding source */}
            <div className="mb-5">
              <label className="label-sm">Funding Source</label>
              {fundingSources.length === 0 ? (
                <div className="text-[12px] text-slate-400">No funding sources linked. Please add one first.</div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {fundingSources.map((s) => {
                    const Icon = s.source_type === "bank" ? BankIcon : PhoneIcon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setSelectedSource(s.id)}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                          selectedSource === s.id
                            ? "border-brand-500 bg-brand-50"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Icon size={16} className={selectedSource === s.id ? "text-brand-500" : "text-slate-400"} />
                        <span className={`text-[13px] font-semibold ${selectedSource === s.id ? "text-brand-600" : "text-slate-600"}`}>{s.name}</span>
                        {s.is_primary && <span className="text-[10px] text-brand-400 ml-1">(Primary)</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
              <button className="btn-primary flex-2" disabled={!canReview} onClick={() => setStep("review")}>
                Review Investment
              </button>
            </div>
          </>
        )}

        {/* ── Step: Review ── */}
        {step === "review" && (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-slate-800">Review Investment</h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>

            <div className="divide-y divide-slate-100 mb-5">
              {[
                { label: "Fund", val: fund.name },
                { label: "Category", val: fund.category },
                { label: "Amount", val: formatCurrency(amountNum) },
                { label: "Funding Source", val: fundingSources.find((s) => s.id === selectedSource)?.name || "N/A" },
                { label: "Expected ROI (1yr)", val: `${fund.annual_roi}% → +${formatCurrency(parseFloat(projReturn))}` },
                { label: "Projected Value (1yr)", val: formatCurrency(parseFloat(projValue)) },
                { label: "Risk Level", val: fund.risk_level },
                { label: "Duration", val: fund.duration },
              ].map((r) => (
                <div key={r.label} className="flex justify-between items-center py-3">
                  <span className="text-[13px] text-slate-500">{r.label}</span>
                  <span className="text-[13px] font-semibold text-slate-800 text-right ml-4">{r.val}</span>
                </div>
              ))}
            </div>

            <div className="bg-brand-50 border border-brand-200 rounded-xl p-3.5 mb-5">
              <p className="text-[12px] text-brand-700 leading-relaxed">
                By confirming, you authorise SaveWise to deduct <strong>{formatCurrency(amountNum)}</strong> from your funding source and allocate it to the {fund.name}. Returns are projected and not guaranteed.
              </p>
            </div>

            {error && <div className="text-[12px] text-danger mb-3">{error}</div>}

            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setStep("amount")}>Back</button>
              <button className="btn-primary flex-2" disabled={isSubmitting} onClick={handleConfirm}>
                {isSubmitting ? "Processing..." : "Confirm Investment"}
              </button>
            </div>
          </>
        )}

        {/* ── Step: Success ── */}
        {step === "success" && (
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-success-light rounded-full mx-auto mb-5 flex items-center justify-center text-success">
              <CheckIcon size={36} />
            </div>
            <h2 className="text-[22px] font-extrabold text-slate-800 mb-1">Investment Confirmed!</h2>
            <p className="text-slate-400 text-sm mb-6">
              Your investment in <strong className="text-slate-700">{fund.name}</strong> is active.
            </p>

            <div className="bg-slate-50 rounded-xl p-5 mb-6 text-left divide-y divide-slate-100">
              {[
                { label: "Reference", val: ref },
                { label: "Amount Invested", val: formatCurrency(amountNum) },
                { label: "Funding Source", val: fundingSources.find((s) => s.id === selectedSource)?.name || "N/A" },
                { label: "Projected 1-yr return", val: `+${formatCurrency(parseFloat(projReturn))}` },
                { label: "Projected value", val: formatCurrency(parseFloat(projValue)) },
              ].map((r) => (
                <div key={r.label} className="flex justify-between py-2.5">
                  <span className="text-[12px] text-slate-400">{r.label}</span>
                  <span className={`text-[13px] font-bold ${r.label === "Reference" ? "text-brand-500 font-mono" : r.label.includes("return") ? "text-success" : "text-slate-800"}`}>
                    {r.val}
                  </span>
                </div>
              ))}
            </div>

            <button className="btn-primary" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function InvestmentsPage() {
  const { formatCurrency, t } = useSettings();
  const [funds, setFunds] = useState<Fund[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [totalInvested, setTotalInvested] = useState(0);
  const [totalReturns, setTotalReturns] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [detailFund, setDetailFund] = useState<Fund | null>(null);
  const [investFund, setInvestFund] = useState<Fund | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (!localStorage.getItem("access_token")) {
      setIsLoading(false);
      return;
    }

    try {
      const [fundsRes, holdingsRes, sourcesRes, portfolioRes] = await Promise.all([
        apiGet(API_ENDPOINTS.INVESTMENTS.FUNDS),
        apiGet(API_ENDPOINTS.INVESTMENTS.HOLDINGS),
        apiGet(API_ENDPOINTS.WALLETS.FUNDING_SOURCES),
        apiGet(API_ENDPOINTS.INVESTMENTS.PORTFOLIO).catch(() => null),
      ]);

      setFunds(fundsRes.results || fundsRes || []);
      setHoldings(holdingsRes.results || holdingsRes || []);

      const sources = (sourcesRes.results || sourcesRes || []).filter(
        (s: any) => s.status === "active"
      );
      setFundingSources(sources);

      if (portfolioRes) {
        setTotalInvested(parseFloat(portfolioRes.total_invested) || 0);
        const invested = parseFloat(portfolioRes.total_invested) || 0;
        const current = parseFloat(portfolioRes.current_value) || 0;
        setTotalReturns(current - invested);
      }
    } catch (err) {
      console.error("Failed to load investments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  function openInvest(fund: Fund) {
    setDetailFund(null);
    setInvestFund(fund);
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-100">
        <div className="text-slate-500">Loading investments...</div>
      </div>
    );
  }

  const activeHoldings = holdings.filter((h) => h.status === "active");
  const returnsPct = totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : "0.0";

  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">{t("investments.available_funds")}</h1>
          <p className="text-slate-400 text-sm mt-0.5">{t("investments.title")}</p>
        </div>
        <div className="flex items-center gap-2 text-[13px] font-semibold text-brand-500">
          <InvestIcon size={14} />
          <span>{funds.length} {t("investments.available_funds")}</span>
        </div>
      </div>

      {/* Fund cards */}
      {funds.length === 0 ? (
        <div className="card p-10 text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <InvestIcon size={22} className="text-slate-400" />
          </div>
          <div className="font-bold text-sm text-slate-800 mb-1">{t("common.loading")}</div>
          <p className="text-[13px] text-slate-400">{t("common.loading")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {funds.map((f) => (
            <FundCard
              key={f.id}
              fund={f}
              onView={() => setDetailFund(f)}
              onInvest={() => openInvest(f)}
            />
          ))}
        </div>
      )}

      {/* My Investments */}
      <div className="card p-6">
        <div className="font-bold text-[15px] text-slate-800 mb-4">{t("investments.my_investments")}</div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-5">
          {[
            { label: t("investments.total_invested"), val: formatCurrency(totalInvested), green: false, delta: null },
            { label: t("investments.total_returns"), val: `${totalReturns >= 0 ? "+" : ""}${formatCurrency(totalReturns)}`, green: totalReturns >= 0, delta: totalInvested > 0 ? `${returnsPct}%` : null },
            { label: t("investments.active_funds"), val: String(activeHoldings.length), green: false, delta: null },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-1">{s.label}</div>
              <div className={`text-xl font-extrabold ${s.green ? "text-success" : "text-slate-800"}`}>
                {s.val}
              </div>
              {s.delta && <div className="text-[11px] text-success mt-0.5">{s.delta}</div>}
            </div>
          ))}
        </div>

        {/* Holdings table */}
        <div className="mb-5">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Holdings</div>
          {activeHoldings.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No active investments yet</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activeHoldings.map((h) => {
                const fundData = funds.find((f) => f.id === h.fund);
                const returns = h.current_value - h.amount_invested;
                return (
                  <div key={h.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {fundData ? (
                        <FundAvatar fund={fundData} size={36} />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center text-[15px]">📈</div>
                      )}
                      <div>
                        <div className="text-[13px] font-semibold text-slate-800">
                          {h.fund_details?.name || "Unknown Fund"}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Since {h.invested_at ? new Date(h.invested_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[13px] font-bold text-slate-800">{formatCurrency(h.current_value)}</div>
                      <div className={`text-[11px] font-semibold ${returns >= 0 ? "text-success" : "text-danger"}`}>
                        {returns >= 0 ? "+" : ""}{formatCurrency(returns)} ({h.roi_percentage?.toFixed(1) || "0.0"}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Portfolio spark */}
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Portfolio Growth</div>
        <SparkLine />
      </div>

      {/* Modals */}
      {detailFund && (
        <FundDetailModal
          fund={detailFund}
          onClose={() => setDetailFund(null)}
          onInvest={() => openInvest(detailFund)}
        />
      )}
      {investFund && (
        <InvestModal
          fund={investFund}
          fundingSources={fundingSources}
          onClose={() => setInvestFund(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
