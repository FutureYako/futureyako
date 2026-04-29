"use client";

import Link from "next/link";
import { BankIcon } from "@/components/icons";

const txs = [
  { label: "Auto-save (Bank)", date: "Today", amt: "-$50.00" },
  { label: "Auto-save (Bank)", date: "May 29, 2024", amt: "-$50.00" },
  { label: "Auto-save (Bank)", date: "May 20, 2024", amt: "-$50.00" },
];

const info = [
  { label: "Wallet Number", val: "SV 8937 2345 6712" },
  { label: "Created", val: "May 20, 2024" },
  { label: "Status", val: "Active", green: true },
];

export default function BankWalletPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-extrabold text-slate-800 mb-5">Bank Wallet</h1>

      <div className="grid grid-cols-[1.4fr_1fr] gap-6">
        <div>
          <div className="card p-6 mb-5 text-white bg-gradient-to-br from-brand-500 to-brand-400">
            <div className="text-xs opacity-85 mb-0.5">Bank Wallet</div>
            <div className="text-[13px] opacity-70 mb-4">••••1234</div>
            <div className="text-[13px] opacity-85 mb-1">Available Balance</div>
            <div className="text-3xl font-black mb-4">$450.00</div>
            <button className="bg-white/20 border border-white/40 rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-white/30 transition-colors">
              Add Fund
            </button>
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
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center">
                      <BankIcon size={15} />
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
            <div className="font-bold text-[15px] text-slate-800 mb-5">
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
            <div className="text-xs text-slate-400 bg-slate-50 rounded-lg p-3">
              Bank integration in progress. You can add funds manually for now.
            </div>
          </div>

          <Link
            href="/wallet/mobile"
            className="btn-outline block w-full text-center"
          >
            View Mobile Wallet →
          </Link>
        </div>
      </div>
    </div>
  );
}
