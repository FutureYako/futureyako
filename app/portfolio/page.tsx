"use client";

import { useState, useEffect } from "react";
import { InvestIcon, BankIcon, PhoneIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet } from "@/lib/api";
import { useSettings } from "@/lib/settings-context";

const PERIODS = ["1W", "1M", "3M", "6M", "1Y"] as const;
type Period = (typeof PERIODS)[number];

const CATEGORY_STYLES: Record<string, { icon: typeof BankIcon; bar: string; badge: string }> = {
  Savings: { icon: BankIcon, bar: "bg-brand-500", badge: "bg-brand-100 text-brand-500" },
  Investment: { icon: InvestIcon, bar: "bg-success", badge: "bg-success-light text-success" },
  Mobile: { icon: PhoneIcon, bar: "bg-blue-400", badge: "bg-blue-100 text-blue-500" },
};

const ALLOCATION_COLORS = [
  { color: "#6c63ff", bg: "bg-brand-500" },
  { color: "#22c55e", bg: "bg-success" },
  { color: "#f59e0b", bg: "bg-warning" },
  { color: "#3b82f6", bg: "bg-blue-400" },
  { color: "#ef4444", bg: "bg-danger" },
];

interface Holding {
  id: string;
  fund_details: { name: string; category: string };
  amount_invested: number;
  current_value: number;
  roi_percentage: number;
  status: string;
  invested_at: string;
}

interface AllocationItem {
  category: string;
  amount: number;
  percentage: number;
}

interface MonthlyReturn {
  month: string;
  value: number;
}

export default function PortfolioPage() {
  const { formatCurrency, t } = useSettings();
  const [period, setPeriod] = useState<Period>("1M");
  const [isLoading, setIsLoading] = useState(true);

  const [totalValue, setTotalValue] = useState(0);
  const [totalInvested, setTotalInvested] = useState(0);
  const [changePercentage, setChangePercentage] = useState(0);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [allocation, setAllocation] = useState<AllocationItem[]>([]);
  const [monthlyReturns, setMonthlyReturns] = useState<MonthlyReturn[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [investingSince, setInvestingSince] = useState<string>("");

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      const [portfolioRes, allocationRes, returnsRes, walletRes] = await Promise.all([
        apiGet(API_ENDPOINTS.INVESTMENTS.PORTFOLIO),
        apiGet(API_ENDPOINTS.INVESTMENTS.ALLOCATION),
        apiGet(API_ENDPOINTS.INVESTMENTS.RETURNS + `?period=${period}`),
        apiGet(API_ENDPOINTS.WALLETS.DETAIL),
      ]);

      setTotalValue(parseFloat(portfolioRes.total_value) || 0);
      setTotalInvested(parseFloat(portfolioRes.total_invested) || 0);
      setChangePercentage(parseFloat(portfolioRes.change_percentage) || 0);
      setHoldings(portfolioRes.holdings || []);

      setAllocation(allocationRes.allocation || []);

      const returns = returnsRes.results || returnsRes;
      setMonthlyReturns(Array.isArray(returns) ? returns : []);

      setAvailableBalance(parseFloat(walletRes.available_balance) || 0);

      // Determine investing since date from oldest holding
      if (portfolioRes.holdings?.length > 0) {
        const oldest = portfolioRes.holdings.reduce((min: string, h: Holding) =>
          h.invested_at < min ? h.invested_at : min,
          portfolioRes.holdings[0].invested_at
        );
        if (oldest) {
          const d = new Date(oldest);
          setInvestingSince(d.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
        }
      }
    } catch (err) {
      console.error('Failed to load portfolio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500">{t("common.loading")}</div>
      </div>
    );
  }

  const totalReturns = totalValue - totalInvested;
  const maxBarVal = Math.max(...monthlyReturns.map((m) => m.value), 1);

  // Build allocation with available balance included
  const fullAllocation = [
    ...allocation.map((a, i) => ({
      ...a,
      color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length].color,
      bg: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length].bg,
    })),
  ];
  if (availableBalance > 0) {
    const pct = totalValue > 0
      ? Math.round((availableBalance / (totalValue + availableBalance)) * 100 * 10) / 10
      : 100;
    fullAllocation.push({
      category: t("dashboard.available_balance"),
      amount: availableBalance,
      percentage: pct,
      color: "#f59e0b",
      bg: "bg-warning",
    });
  }

  const grandTotal = totalValue + availableBalance;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Portfolio</h1>
          <p className="text-slate-500 text-sm">Your wealth breakdown &amp; performance</p>
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                period === p
                  ? "bg-white text-brand-500 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Summary strip */}
      <div className="card p-5 mb-6 flex items-center gap-0 divide-x divide-slate-100">
        <div className="pr-8">
          <div className="text-xs text-slate-400 mb-0.5">Total Value</div>
          <div className="text-3xl font-black text-slate-800">{formatCurrency(grandTotal)}</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              changePercentage >= 0 ? "bg-success-light text-success" : "bg-red-50 text-danger"
            }`}>
              {changePercentage >= 0 ? "▲" : "▼"} {changePercentage >= 0 ? "+" : ""}{Number(changePercentage).toFixed(1)}%
            </span>
            <span className="text-[11px] text-slate-400">this {period}</span>
          </div>
        </div>
        {[
          { label: "Total Returns", val: `${totalReturns >= 0 ? "+" : ""}${formatCurrency(totalReturns)}`, color: totalReturns >= 0 ? "text-success" : "text-danger" },
          { label: "Active Holdings", val: String(holdings.length), color: "text-slate-800" },
          { label: "Investing Since", val: investingSince || "N/A", color: "text-slate-800" },
        ].map((s) => (
          <div key={s.label} className="px-8">
            <div className="text-xs text-slate-400 mb-1">{s.label}</div>
            <div className={`text-lg font-extrabold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Holdings table + Allocation side by side */}
      <div className="grid grid-cols-[1fr_280px] gap-5 mb-5">
        {/* Holdings table */}
        <div className="card p-5">
          <div className="font-bold text-sm text-slate-800 mb-4">Holdings</div>
          {holdings.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No active holdings</div>
          ) : (
            <>
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wide pb-2 border-b border-slate-100 mb-1">
                <span>Asset</span>
                <span className="text-right">Value</span>
                <span className="text-right w-20">Allocation</span>
                <span className="text-right w-14">30d</span>
              </div>
              <div className="divide-y divide-slate-50">
                {holdings.map((h) => {
                  const style = CATEGORY_STYLES[h.fund_details?.category] || CATEGORY_STYLES.Investment;
                  const Icon = style.icon;
                  const pct = grandTotal > 0 ? ((h.current_value / grandTotal) * 100).toFixed(1) : "0.0";
                  return (
                    <div
                      key={h.id}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center py-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center flex-shrink-0">
                          <Icon size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-semibold text-slate-800 truncate">
                            {h.fund_details?.name || "Unknown"}
                          </div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${style.badge}`}>
                            {h.fund_details?.category || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-[13px] font-bold text-slate-800 text-right">
                        {formatCurrency(h.current_value)}
                      </div>
                      <div className="w-20">
                        <div className="flex items-center justify-end gap-1.5 mb-1">
                          <span className="text-[11px] text-slate-400">{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className={`text-[12px] font-bold text-right w-14 ${
                        h.roi_percentage >= 0 ? "text-success" : "text-danger"
                      }`}>
                        {h.roi_percentage >= 0 ? "+" : ""}{Number(h.roi_percentage).toFixed(1)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Allocation */}
        <div className="card p-5 flex flex-col">
          <div className="font-bold text-sm text-slate-800 mb-4">Allocation</div>

          {/* Stacked bar */}
          {fullAllocation.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No allocation data</div>
          ) : (
            <>
              <div className="flex h-3 rounded-full overflow-hidden mb-5">
                {fullAllocation.map((a) => (
                  <div
                    key={a.category}
                    className={`h-full ${a.bg}`}
                    style={{ width: `${a.percentage}%` }}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="space-y-3 flex-1">
                {fullAllocation.map((a) => (
                  <div key={a.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: a.color }} />
                        <span className="text-[12px] text-slate-500">{a.category}</span>
                      </div>
                      <span className="text-[12px] font-bold text-slate-800">{a.percentage}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-1 bg-slate-100 rounded-full flex-1 mr-2 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${a.percentage}%`, background: a.color }} />
                      </div>
                      <span className="text-[11px] text-slate-400 w-14 text-right">
                        {formatCurrency(a.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-400 mb-0.5">Total</div>
            <div className="font-extrabold text-slate-800">{formatCurrency(grandTotal)}</div>
          </div>
        </div>
      </div>

      {/* Monthly returns */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="font-bold text-sm text-slate-800">Monthly Returns</div>
          {monthlyReturns.length > 0 && (
            <span className="text-[12px] text-success font-semibold bg-success-light px-2.5 py-0.5 rounded-full">
              Avg +{(monthlyReturns.reduce((s, m) => s + m.value, 0) / monthlyReturns.length).toFixed(1)}%
            </span>
          )}
        </div>
        {monthlyReturns.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-sm">No return data yet</div>
        ) : (
          <div className="flex items-end justify-between gap-3 h-24">
            {monthlyReturns.map((m) => (
              <div key={m.month} className="flex flex-col items-center gap-1.5 flex-1">
                <span className="text-[10px] font-semibold text-slate-500">{m.value.toFixed(1)}%</span>
                <div
                  className="w-full rounded-t-md bg-brand-500 opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${(m.value / maxBarVal) * 72}px` }}
                />
                <span className="text-[10px] text-slate-400">{m.month}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
