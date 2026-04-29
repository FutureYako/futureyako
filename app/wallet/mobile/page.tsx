"use client";

import Link from "next/link";
import { PhoneIcon } from "@/components/icons";

const txs = [
  { label: "Mobile Money Save", date: "Today", amt: "-$20.00" },
  { label: "Mobile Money Save", date: "May 29, 2024", amt: "-$20.00" },
  { label: "Mobile Money Save", date: "May 20, 2024", amt: "-$20.00" },
];

const info = [
  { label: "Wallet Number", val: "SV 8937 2345 6712" },
  { label: "Provider", val: "MTN Mobile Money" },
  { label: "Status", val: "Active", green: true },
];

const ACTIONS = ["Send Money", "Request Money", "Top Up"];

export default function MobileWalletPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-extrabold text-slate-800 mb-5">
        Mobile Money Wallet
      </h1>

      <div className="grid grid-cols-[1.4fr_1fr] gap-6">
        <div>
          <div className="card p-6 mb-5 text-white bg-gradient-to-br from-success to-green-600">
            <div className="text-xs opacity-85 mb-0.5">Mobile Money Wallet</div>
            <div className="text-[13px] opacity-70 mb-4">••••0078</div>
            <div className="text-[13px] opacity-85 mb-1">Available Balance</div>
            <div className="text-3xl font-black mb-4">$280.00</div>
            <div className="flex gap-2.5 flex-wrap">
              {ACTIONS.map((a) => (
                <button
                  key={a}
                  className="bg-white/20 border border-white/40 rounded-lg px-3.5 py-2 text-xs font-semibold hover:bg-white/30 transition-colors"
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="font-bold text-sm text-slate-800 mb-4">
              Recent Transactions
            </div>
            <div className="divide-y divide-slate-100">
              {txs.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-success-light text-success flex items-center justify-center">
                      <PhoneIcon size={15} />
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-800">
                        {t.label}
                      </div>
                      <div className="text-[11px] text-slate-400">{t.date}</div>
                    </div>
                  </div>
                  <span className="font-bold text-[13px] text-danger">{t.amt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="card p-6 mb-4">
            <div className="font-bold text-[15px] text-slate-800 mb-4">
              Wallet Info
            </div>
            <div className="divide-y divide-slate-100">
              {info.map((r) => (
                <div
                  key={r.label}
                  className="flex justify-between items-center py-2"
                >
                  <span className="text-[13px] text-slate-500">{r.label}</span>
                  <span
                    className={`text-[13px] font-semibold ${
                      r.green ? "text-success" : "text-slate-800"
                    }`}
                  >
                    {r.val}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5 mb-4">
            <div className="font-bold text-sm text-slate-800 mb-2.5">
              About Mobile Money Savings
            </div>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Saves are made via secure payment requests to your mobile money.
            </p>
          </div>

          <Link
            href="/wallet/bank"
            className="btn-outline block w-full text-center"
          >
            View Bank Wallet →
          </Link>
        </div>
      </div>
    </div>
  );
}
