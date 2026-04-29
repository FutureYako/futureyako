"use client";

import Link from "next/link";
import { DonutChart, SparkLine } from "@/components/ui/Charts";
import { BankIcon, PhoneIcon, InvestIcon } from "@/components/icons";

const breakdown = [
  { val: 1500, color: "#6c63ff", label: "Goals", display: "$1,500" },
  { val: 600, color: "#22c55e", label: "Emergency", display: "$600" },
  { val: 350, color: "#f59e0b", label: "Investment", display: "$350" },
];

const activity = [
  {
    icon: BankIcon,
    label: "Auto-save (Bank)",
    date: "Today",
    amt: "+$50.00",
    pos: true,
    bg: "bg-brand-100",
    text: "text-brand-500",
  },
  {
    icon: PhoneIcon,
    label: "Mobile Money Save",
    date: "May 28, 2024",
    amt: "-$20.00",
    pos: false,
    bg: "bg-blue-100",
    text: "text-blue-500",
  },
  {
    icon: InvestIcon,
    label: "Investment Return",
    date: "May 25, 2024",
    amt: "+$15.00",
    pos: true,
    bg: "bg-success-light",
    text: "text-success",
  },
];

const stats = [
  { label: "Available Balance", val: "$450.00", color: "text-brand-500" },
  { label: "Active Goals", val: "$1,500.00", color: "text-success" },
  { label: "Invested Amount", val: "$500.00", color: "text-warning" },
];

export default function DashboardPage() {
  return (
    <div className="p-8">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-slate-800">
          Welcome back, John 👋
        </h1>
        <p className="text-slate-500 text-sm">Here&apos;s your savings overview</p>
      </div>

      <div className="bg-gradient-to-br from-brand-500 to-brand-300 rounded-2xl p-6 text-white mb-6 shadow-[0_8px_32px_rgba(108,99,255,0.3)]">
        <div className="text-[13px] opacity-85 mb-1">Total Portfolio</div>
        <div className="text-4xl font-black mb-1">$2,450.00</div>
        <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5 text-[13px]">
          ▲ +12.9% this month
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <div className="font-bold text-sm text-slate-800 mb-4">
            Savings Breakdown
          </div>
          <div className="flex items-center gap-4">
            <DonutChart data={breakdown} />
            <div className="flex-1">
              {breakdown.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between mb-2"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-[13px] text-slate-500">{d.label}</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-800">
                    {d.display}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="font-bold text-sm text-slate-800 mb-4">
            Recent Activity
          </div>
          <div className="divide-y divide-slate-100">
            {activity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center ${a.bg} ${a.text}`}
                    >
                      <Icon size={15} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-800">
                        {a.label}
                      </div>
                      <div className="text-[11px] text-slate-400">{a.date}</div>
                    </div>
                  </div>
                  <span
                    className={`font-bold text-[13px] ${
                      a.pos ? "text-success" : "text-danger"
                    }`}
                  >
                    {a.amt}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-xl font-extrabold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-5">
        <div className="flex justify-between items-center mb-4">
          <div className="font-bold text-sm text-slate-800">Performance</div>
          <span className="text-[13px] text-success font-semibold">+12.9%</span>
        </div>
        <SparkLine />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/setup/autosaving"
          className="btn-primary text-center !py-3"
        >
          Setup Autosave
        </Link>
        <Link
          href="/wallet/bank"
          className="btn-outline text-center !w-full"
        >
          View Wallets
        </Link>
        <Link
          href="/investments"
          className="btn-outline text-center !w-full"
        >
          Investments
        </Link>
      </div>
    </div>
  );
}
