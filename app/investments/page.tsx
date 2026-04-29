"use client";

import { SparkLine } from "@/components/ui/Charts";

const FUNDS = [
  {
    name: "Real Estate Fund",
    roi: "12.5%",
    min: "Min. Invest $100",
    emoji: "🏢",
    gradient: "from-indigo-500 to-indigo-700",
  },
  {
    name: "Agriculture Fund",
    roi: "10.2%",
    min: "Min. Invest $50",
    emoji: "🌾",
    gradient: "from-green-500 to-green-700",
  },
  {
    name: "Tech Startup Fund",
    roi: "15.8%",
    min: "Min. Invest $200",
    emoji: "💻",
    gradient: "from-sky-500 to-sky-700",
  },
  {
    name: "Green Energy Fund",
    roi: "11.0%",
    min: "Min. Invest $150",
    emoji: "⚡",
    gradient: "from-amber-500 to-amber-700",
  },
];

const STATS = [
  { label: "Total Invested", val: "$500.00" },
  { label: "Total Returns", val: "+$75.00", green: true, delta: "+15.0%" },
  { label: "Active Investments", val: "2" },
];

export default function InvestmentsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-extrabold text-slate-800">
          Investment Opportunities
        </h1>
        <button className="text-[13px] text-brand-500 font-semibold hover:underline">
          View All →
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-7">
        {FUNDS.map((f) => (
          <div
            key={f.name}
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-200"
          >
            <div
              className={`h-[90px] rounded-lg bg-gradient-to-br ${f.gradient} flex items-center justify-center text-3xl mb-3`}
            >
              {f.emoji}
            </div>
            <div className="font-bold text-sm text-slate-800 mb-1">{f.name}</div>
            <div className="text-success font-extrabold text-base mb-0.5">
              {f.roi} ROI
            </div>
            <div className="text-[11px] text-slate-400 mb-3">{f.min}</div>
            <button className="btn-primary !py-2 !text-[13px]">Invest Now</button>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="font-bold text-[15px] text-slate-800 mb-4">
          My Investments
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          {STATS.map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-4">
              <div className="text-xs text-slate-500 mb-1">{s.label}</div>
              <div
                className={`text-xl font-extrabold ${
                  s.green ? "text-success" : "text-slate-800"
                }`}
              >
                {s.val}
              </div>
              {s.delta && (
                <div className="text-[11px] text-success mt-0.5">{s.delta}</div>
              )}
            </div>
          ))}
        </div>

        <SparkLine />
      </div>
    </div>
  );
}
