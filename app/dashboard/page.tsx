"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DonutChart, SparkLine } from "@/components/ui/Charts";
import { BankIcon, PhoneIcon, InvestIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet } from "@/lib/api";
import { useSettings } from "@/lib/settings-context";

export default function DashboardPage() {
  const { formatCurrency, t } = useSettings();

  const [userName, setUserName] = useState("there");
  const [totalPortfolio, setTotalPortfolio] = useState(0);
  const [changePercent, setChangePercent] = useState(0);

  const [breakdown, setBreakdown] = useState([
    { val: 0, color: "#6c63ff", label: t("dashboard.goals"), display: formatCurrency(0) },
    { val: 0, color: "#22c55e", label: t("dashboard.savings"), display: formatCurrency(0) },
    { val: 0, color: "#f59e0b", label: t("dashboard.investments"), display: formatCurrency(0) },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  const [activity, setActivity] = useState<any[]>([]);

  const [stats, setStats] = useState([
    { label: t("dashboard.available_balance"), val: formatCurrency(0), color: "text-brand-500" },
    { label: t("dashboard.active_goals"), val: formatCurrency(0), color: "text-success" },
    { label: t("dashboard.invested_amount"), val: formatCurrency(0), color: "text-warning" },
  ]);

  useEffect(() => {
    checkOnboardingThenLoad();
  }, []);

  const checkOnboardingThenLoad = async () => {
    // Skip onboarding checks - users go directly to dashboard after login
    loadDashboardData();
  };


  const loadDashboardData = async () => {
    try {
      const [userRes, walletRes, goalsRes, portfolioRes, txRes] = await Promise.all([
        apiGet(API_ENDPOINTS.USER.PROFILE),
        apiGet(API_ENDPOINTS.WALLETS.DETAIL),
        apiGet(API_ENDPOINTS.GOALS.LIST),
        apiGet(API_ENDPOINTS.INVESTMENTS.PORTFOLIO),
        apiGet(API_ENDPOINTS.TRANSACTIONS.LIST + "?limit=3"),
      ]);

      setUserName(userRes.full_name?.split(" ")[0] || "there");

      const goalsAmt = (goalsRes.results || [])
        .filter((g: any) => g.type === "savings")
        .reduce((s: number, g: any) => s + (g.current || 0), 0);
      const emergencyAmt = (goalsRes.results || [])
        .filter((g: any) => g.type === "emergency")
        .reduce((s: number, g: any) => s + (g.current || 0), 0);
      const investAmt = portfolioRes.current_value || 0;

      setBreakdown([
        { val: goalsAmt, color: "#6c63ff", label: "Goals", display: formatCurrency(goalsAmt) },
        { val: emergencyAmt, color: "#22c55e", label: "Emergency", display: formatCurrency(emergencyAmt) },
        { val: investAmt, color: "#f59e0b", label: "Investment", display: formatCurrency(investAmt) },
      ]);

      setTotalPortfolio((walletRes.total_balance || 0) + investAmt);
      setChangePercent(portfolioRes.change_percentage || 0);

      setStats([
        { label: "Available Balance", val: formatCurrency(walletRes.available_balance || 0), color: "text-brand-500" },
        { label: "Active Goals", val: formatCurrency(goalsAmt + emergencyAmt), color: "text-success" },
        { label: "Invested Amount", val: formatCurrency(portfolioRes.total_invested || 0), color: "text-warning" },
      ]);

      const INCOME_TYPES = ["Deposit", "Return", "Auto-Save"];
      const txActivity = (txRes.results || []).slice(0, 3).map((tx: any) => {
        const isIncome = INCOME_TYPES.includes(tx.transaction_type);
        return {
          icon: tx.transaction_type === "Auto-Save" ? BankIcon : tx.category === "Investment" ? InvestIcon : PhoneIcon,
          label: tx.description || tx.transaction_type,
          date: new Date(tx.created_at).toLocaleDateString(),
          amt: `${isIncome ? "+" : "-"}${formatCurrency(Math.abs(tx.net_amount || tx.amount))}`,
          pos: isIncome,
          bg: isIncome ? "bg-brand-100" : "bg-blue-100",
          text: isIncome ? "text-brand-500" : "text-blue-500",
        };
      });
      if (txActivity.length > 0) setActivity(txActivity);
    } catch {
      // Keep default values on error
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-100">
        <div className="text-slate-500">{t("common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-slate-800">
          {t("dashboard.welcome")}, {userName} 👋
        </h1>
        <p className="text-slate-500 text-sm">{t("dashboard.overview")}</p>
      </div>

      <div className="bg-gradient-to-br from-brand-500 to-brand-300 rounded-2xl p-6 text-white mb-6 shadow-[0_8px_32px_rgba(108,99,255,0.3)]">
        <div className="text-[13px] opacity-85 mb-1">{t("dashboard.total_portfolio")}</div>
        <div className="text-4xl font-black mb-1">{formatCurrency(totalPortfolio)}</div>
        <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5 text-[13px]">
          {changePercent >= 0 ? "▲" : "▼"} {changePercent >= 0 ? "+" : ""}{Number(changePercent).toFixed(1)}% {t("dashboard.this_month")}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mb-5">
        <div className="card p-5">
          <div className="font-bold text-sm text-slate-800 mb-4">
            {t("dashboard.savings_breakdown")}
          </div>
          <div className="flex items-center gap-4">
            <DonutChart data={breakdown} />
            <div className="flex-1">
              {breakdown.map((d) => (
                <div key={d.label} className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-[13px] text-slate-500">{d.label}</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-800">{d.display}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="font-bold text-sm text-slate-800 mb-4">
            {t("dashboard.recent_activity")}
          </div>
          <div className="divide-y divide-slate-100">
            {activity.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">
                {t("common.loading")}
              </div>
            ) : (
              activity.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${a.bg} ${a.text}`}>
                        <Icon size={15} />
                      </div>
                      <div>
                        <div className="text-[13px] font-semibold text-slate-800">{a.label}</div>
                        <div className="text-[11px] text-slate-400">{a.date}</div>
                      </div>
                    </div>
                    <span className={`font-bold text-[13px] ${a.pos ? "text-success" : "text-danger"}`}>
                      {a.amt}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-xl font-extrabold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-5">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-sm text-slate-800">{t("dashboard.performance")}</div>
          <span className="text-[13px] text-success font-semibold">
            {changePercent >= 0 ? "+" : ""}{Number(changePercent).toFixed(1)}%
          </span>
        </div>
        <SparkLine />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <Link href="/setup/autosaving" className="btn-primary text-center py-3!">
          {t("common.setup")} Autosave
        </Link>
        <Link href="/wallet/bank" className="btn-outline text-center w-full!">
          {t("common.view")} {t("wallet.title")}
        </Link>
        <Link href="/investments" className="btn-outline text-center w-full!">
          {t("investments.title")}
        </Link>
      </div>
    </div>
  );
}
