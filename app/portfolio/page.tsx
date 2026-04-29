"use client";

import { DonutChart, SparkLine } from "@/components/ui/Charts";
import { InvestIcon, BankIcon, PhoneIcon } from "@/components/icons";

const breakdown = [
  { val: 1500, color: "#6c63ff", label: "Goals Savings", display: "$1,500" },
  { val: 500, color: "#22c55e", label: "Investments", display: "$500" },
  { val: 450, color: "#f59e0b", label: "Available", display: "$450" },
];

const holdings = [
  {
    icon: InvestIcon,
    label: "Real Estate Fund",
    type: "Investment",
    value: "$300.00",
    change: "+12.5%",
    pos: true,
    bg: "bg-indigo-100",
    text: "text-indigo-500",
  },
  {
    icon: InvestIcon,
    label: "Tech Startup Fund",
    type: "Investment",
    value: "$200.00",
    change: "+15.8%",
    pos: true,
    bg: "bg-sky-100",
    text: "text-sky-500",
  },
  {
    icon: BankIcon,
    label: "Bank Savings Wallet",
    type: "Savings",
    value: "$1,500.00",
    change: "+2.1%",
    pos: true,
    bg: "bg-brand-100",
    text: "text-brand-500",
  },
  {
    icon: PhoneIcon,
    label: "Mobile Money Wallet",
    type: "Savings",
    value: "$450.00",
    change: "+0.8%",
    pos: true,
    bg: "bg-blue-100",
    text: "text-blue-500",
  },
];

const portfolioStats = [
  { label: "Total Value", val: "$2,450.00", color: "text-brand-500" },
  { label: "Total Returns", val: "+$223.00", color: "text-success" },
  { label: "Active Holdings", val: "4", color: "text-slate-800" },
];

export default function PortfolioPage() {
  return (
    <div className="p-8">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-slate-800">Portfolio</h1>
        <p className="text-slate-500 text-sm">Your complete savings & investment overview</p>
      </div>

      <div className="bg-gradient-to-br from-brand-500 to-brand-300 rounded-2xl p-6 text-white mb-6 shadow-[0_8px_32px_rgba(108,99,255,0.3)]">
        <div className="text-[13px] opacity-85 mb-1">Total Portfolio Value</div>
        <div className="text-4xl font-black mb-1">$2,450.00</div>
        <div className="inline-flex items-center gap-1 bg-white/20 rounded-full px-2.5 py-0.5 text-[13px]">
          ▲ +12.9% this month
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {portfolioStats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-xl font-extrabold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <div className="card p-5">
          <div className="font-bold text-sm text-slate-800 mb-4">Asset Allocation</div>
          <div className="flex items-center gap-4">
            <DonutChart data={breakdown} />
            <div className="flex-1">
              {breakdown.map((d) => (
                <div key={d.label} className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: d.color }}
                    />
                    <span className="text-[13px] text-slate-500">{d.label}</span>
                  </div>
                  <span className="text-[13px] font-bold text-slate-800">{d.display}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <div className="font-bold text-sm text-slate-800">Performance</div>
            <span className="text-[13px] text-success font-semibold">+12.9%</span>
          </div>
          <SparkLine />
        </div>
      </div>

      <div className="card p-6">
        <div className="font-bold text-sm text-slate-800 mb-4">Holdings</div>
        <div className="divide-y divide-slate-100">
          {holdings.map((h, i) => {
            const Icon = h.icon;
            return (
              <div key={i} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${h.bg} ${h.text}`}
                  >
                    <Icon size={15} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800">{h.label}</div>
                    <div className="text-[11px] text-slate-400">{h.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[13px] font-bold text-slate-800">{h.value}</div>
                  <div
                    className={`text-[11px] font-semibold ${h.pos ? "text-success" : "text-danger"}`}
                  >
                    {h.change}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
