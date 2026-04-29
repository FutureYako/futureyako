"use client";

import { BellIcon, ChevronDown } from "@/components/icons";

export default function Topbar() {
  return (
    <header className="bg-white border-b border-slate-200 flex items-center justify-between px-8 h-[60px]">
      <div className="text-sm text-slate-500">Wednesday, Apr 29, 2026</div>
      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="relative text-slate-500 hover:text-slate-700 transition-colors"
        >
          <BellIcon size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full" />
        </button>
        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-[34px] h-[34px] rounded-full bg-brand-500 text-white flex items-center justify-center text-[13px] font-bold">
            JD
          </div>
          <span className="text-sm font-semibold text-slate-800">John Doe</span>
          <ChevronDown size={14} className="text-slate-500" />
        </button>
      </div>
    </header>
  );
}
