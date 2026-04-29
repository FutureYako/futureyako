"use client";

import { useState } from "react";
import { BankIcon, PhoneIcon, InvestIcon, TxIcon } from "@/components/icons";

type IconComponent = React.ComponentType<{ size?: number }>;

interface Transaction {
  icon: IconComponent;
  label: string;
  category: string;
  date: string;
  amt: string;
  pos: boolean;
  bg: string;
  text: string;
}

const ALL_TX: Transaction[] = [
  { icon: BankIcon, label: "Auto-save (Bank)", category: "Savings", date: "Apr 29, 2026", amt: "+$50.00", pos: true, bg: "bg-brand-100", text: "text-brand-500" },
  { icon: PhoneIcon, label: "Mobile Money Save", category: "Savings", date: "Apr 28, 2026", amt: "+$20.00", pos: true, bg: "bg-blue-100", text: "text-blue-500" },
  { icon: InvestIcon, label: "Investment Return", category: "Investment", date: "Apr 25, 2026", amt: "+$15.00", pos: true, bg: "bg-success-light", text: "text-success" },
  { icon: TxIcon, label: "Withdrawal", category: "Expense", date: "Apr 23, 2026", amt: "-$100.00", pos: false, bg: "bg-danger-light", text: "text-danger" },
  { icon: BankIcon, label: "Auto-save (Bank)", category: "Savings", date: "Apr 22, 2026", amt: "+$50.00", pos: true, bg: "bg-brand-100", text: "text-brand-500" },
  { icon: InvestIcon, label: "Real Estate Fund", category: "Investment", date: "Apr 20, 2026", amt: "-$100.00", pos: false, bg: "bg-success-light", text: "text-success" },
  { icon: PhoneIcon, label: "Mobile Money Save", category: "Savings", date: "Apr 18, 2026", amt: "+$30.00", pos: true, bg: "bg-blue-100", text: "text-blue-500" },
  { icon: TxIcon, label: "Withdrawal", category: "Expense", date: "Apr 15, 2026", amt: "-$50.00", pos: false, bg: "bg-danger-light", text: "text-danger" },
  { icon: BankIcon, label: "Auto-save (Bank)", category: "Savings", date: "Apr 12, 2026", amt: "+$50.00", pos: true, bg: "bg-brand-100", text: "text-brand-500" },
  { icon: InvestIcon, label: "Investment Return", category: "Investment", date: "Apr 10, 2026", amt: "+$8.00", pos: true, bg: "bg-success-light", text: "text-success" },
];

const TABS = ["All", "Income", "Expenses"] as const;
type Tab = (typeof TABS)[number];

function parseDollar(amt: string) {
  return parseFloat(amt.replace(/[^0-9.]/g, ""));
}

export default function TransactionsPage() {
  const [tab, setTab] = useState<Tab>("All");

  const filtered = ALL_TX.filter((t) => {
    if (tab === "Income") return t.pos;
    if (tab === "Expenses") return !t.pos;
    return true;
  });

  const totalIn = ALL_TX.filter((t) => t.pos).reduce((s, t) => s + parseDollar(t.amt), 0);
  const totalOut = ALL_TX.filter((t) => !t.pos).reduce((s, t) => s + parseDollar(t.amt), 0);
  const net = totalIn - totalOut;

  return (
    <div className="p-8">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-slate-800">Transactions</h1>
        <p className="text-slate-500 text-sm">Your complete transaction history</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">Total In</div>
          <div className="text-xl font-extrabold text-success">+${totalIn.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">Total Out</div>
          <div className="text-xl font-extrabold text-danger">-${totalOut.toFixed(2)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs text-slate-500 mb-1">Net</div>
          <div className={`text-xl font-extrabold ${net >= 0 ? "text-success" : "text-danger"}`}>
            {net >= 0 ? "+" : "-"}${Math.abs(net).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex gap-2">
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

        <div className="divide-y divide-slate-100">
          {filtered.map((tx, i) => {
            const Icon = tx.icon;
            return (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.bg} ${tx.text}`}
                  >
                    <Icon size={15} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800">{tx.label}</div>
                    <div className="text-[11px] text-slate-400">
                      {tx.category} · {tx.date}
                    </div>
                  </div>
                </div>
                <span
                  className={`font-bold text-[13px] ${tx.pos ? "text-success" : "text-danger"}`}
                >
                  {tx.amt}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
