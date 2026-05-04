"use client";

import { useState } from "react";
import { HelpIcon, BankIcon, PhoneIcon } from "@/components/icons";

const CONTACT = [
  {
    label: "Email Support",
    desc: "support@savewise.com",
    icon: HelpIcon,
    bg: "bg-brand-100",
    text: "text-brand-500",
  },
  {
    label: "Live Chat",
    desc: "Available 9am – 6pm",
    icon: PhoneIcon,
    bg: "bg-success-light",
    text: "text-success",
  },
  {
    label: "Call Us",
    desc: "+1 (800) 123-4567",
    icon: BankIcon,
    bg: "bg-warning-light",
    text: "text-warning",
  },
];

const FAQS = [
  {
    q: "How does auto-saving work?",
    a: "Auto-saving automatically transfers a set amount from your linked bank or mobile money account on a schedule you define. You can configure the amount and frequency in the Setup Autosave section.",
  },
  {
    q: "Can I withdraw my savings at any time?",
    a: "Yes, you can withdraw from your wallet at any time. Investment funds may have a lock-in period depending on the fund type — check each fund's details before investing.",
  },
  {
    q: "How are my investments protected?",
    a: "All investments are held in regulated funds. Your capital is protected by the fund's terms, and we use bank-grade encryption to secure your data and transactions.",
  },
  {
    q: "What happens if an auto-save fails?",
    a: "If a scheduled auto-save fails (e.g. insufficient funds), we'll notify you and retry the following day. No penalties are applied for missed saves.",
  },
  {
    q: "How do I change my funding source?",
    a: "Go to Funding Sources in the navigation menu to add, remove, or update your linked bank or mobile money accounts at any time.",
  },
  {
    q: "Is there a minimum savings amount?",
    a: "There's no minimum for your savings wallet. Investment funds have their own minimums, typically starting at TSh 50, shown on each fund card.",
  },
];

export default function HelpPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="p-8">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-slate-800">Help & Support</h1>
        <p className="text-slate-500 text-sm">Find answers and get in touch with our team</p>
      </div>

      <div className="card p-4 mb-6">
        <input className="input-field" placeholder="Search for help topics…" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {CONTACT.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              className="card p-5 flex flex-col items-center text-center gap-2 hover:shadow-md transition-shadow cursor-pointer w-full"
            >
              <div
                className={`w-11 h-11 rounded-full ${c.bg} ${c.text} flex items-center justify-center`}
              >
                <Icon size={18} />
              </div>
              <div className="font-bold text-sm text-slate-800">{c.label}</div>
              <div className="text-[12px] text-slate-400">{c.desc}</div>
            </button>
          );
        })}
      </div>

      <div className="card p-6 mb-6">
        <div className="font-bold text-sm text-slate-800 mb-4">Frequently Asked Questions</div>
        <div className="divide-y divide-slate-100">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-4 text-left gap-4"
              >
                <span className="text-sm font-semibold text-slate-800">{faq.q}</span>
                <span
                  className={`text-brand-500 text-lg font-light transition-transform flex-shrink-0 ${
                    open === i ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              {open === i && (
                <div className="pb-4 text-[13px] text-slate-500 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card p-6 bg-brand-50 border border-brand-100">
        <div className="font-bold text-sm text-slate-800 mb-1">Still need help?</div>
        <p className="text-[13px] text-slate-500 mb-4">
          Our support team typically responds within 2 business hours.
        </p>
        <button className="btn-primary !w-auto px-8">Contact Support</button>
      </div>
    </div>
  );
}
