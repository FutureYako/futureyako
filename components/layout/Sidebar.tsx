"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon, PortfolioIcon, GoalsIcon, TxIcon, FundIcon,
  InvestIcon, UserIcon, SettingsIcon, HelpIcon, WalletIcon,
} from "@/components/icons";

const navItems = [
  { href: "/dashboard", icon: HomeIcon, label: "Dashboard" },
  { href: "/portfolio", icon: PortfolioIcon, label: "Portfolio" },
  { href: "/setup/goals", icon: GoalsIcon, label: "Goals" },
  { href: "/transactions", icon: TxIcon, label: "Transactions" },
  { href: "/link-sources", icon: FundIcon, label: "Funding Sources" },
  { href: "/investments", icon: InvestIcon, label: "Investments" },
  { href: "/profile", icon: UserIcon, label: "Profile" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
  { href: "/help", icon: HelpIcon, label: "Help & Support" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] min-w-[220px] bg-white border-r border-slate-200 flex flex-col py-6">
      <div className="px-6 pb-6 border-b border-slate-200 mb-2">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
            <WalletIcon size={16} />
          </div>
          <span className="font-extrabold text-base text-slate-800">SaveWise</span>
        </Link>
      </div>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href.split("?")[0];
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-6 py-2.5 text-sm transition-all ${
              isActive
                ? "text-brand-500 bg-brand-50 font-semibold border-l-[3px] border-brand-500"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <Icon size={16} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </aside>
  );
}
