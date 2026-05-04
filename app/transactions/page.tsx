"use client";

import { useState, useEffect } from "react";
import { BankIcon, PhoneIcon, InvestIcon, TxIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet } from "@/lib/api";
import { useSettings } from "@/lib/settings-context";

type IconComponent = React.ComponentType<{ size?: number }>;

interface Transaction {
  id: string;
  transaction_type: string;
  category: string;
  amount: number;
  net_amount: number;
  description: string;
  created_at: string;
  status: string;
}

const TABS = ["All", "Income", "Expenses"] as const;
type Tab = (typeof TABS)[number];

function parseDollar(amt: string) {
  return parseFloat(amt.replace(/[^0-9.]/g, ""));
}

export default function TransactionsPage() {
  const { formatCurrency, t } = useSettings();
  const [tab, setTab] = useState<Tab>("All");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await apiGet(API_ENDPOINTS.TRANSACTIONS.LIST);
      setTransactions(response.results || []);
    } catch (err: any) {
      console.error('Transactions fetch error:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const INCOME_TYPES = ["Deposit", "Return", "Auto-Save"];
  const EXPENSE_TYPES = ["Withdrawal", "Investment"];

  const filtered = transactions.filter((t) => {
    if (tab === "Income") return INCOME_TYPES.includes(t.transaction_type);
    if (tab === "Expenses") return EXPENSE_TYPES.includes(t.transaction_type);
    return true;
  });

  const totalIn = transactions.filter((t) => INCOME_TYPES.includes(t.transaction_type)).reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => EXPENSE_TYPES.includes(t.transaction_type)).reduce((s, t) => s + t.amount, 0);
  const net = totalIn - totalOut;

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-slate-800">{t("transactions.title")}</h1>
        <p className="text-slate-500 text-sm">{t("transactions.history")}</p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">{t("transactions.total_in")}</div>
          <div className="text-xl font-extrabold text-success">+{formatCurrency(totalIn)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">{t("transactions.total_out")}</div>
          <div className="text-xl font-extrabold text-danger">-{formatCurrency(totalOut)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">{t("transactions.net")}</div>
          <div className={`text-xl font-extrabold ${net >= 0 ? "text-success" : "text-danger"}`}>
            {net >= 0 ? "+" : "-"}{formatCurrency(Math.abs(net))}
          </div>
        </div>
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  tab === t
                    ? "bg-brand-500 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-brand-50 hover:text-brand-500"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="text-[13px] text-slate-400">{filtered.length} transactions</span>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-slate-400">Loading transactions...</div>
        ) : error ? (
          <div className="text-center py-8 text-danger">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No transactions found</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((tx) => {
              const isIncome = INCOME_TYPES.includes(tx.transaction_type);
              const Icon = isIncome ? BankIcon : PhoneIcon;
              return (
                <div key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isIncome ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                      }`}
                    >
                      <Icon size={15} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-800">{tx.description}</div>
                      <div className="text-[11px] text-slate-400">
                        {tx.category} · {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-[13px] ${isIncome ? "text-success" : "text-danger"}`}
                  >
                    {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
