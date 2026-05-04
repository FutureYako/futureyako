"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HomeIcon, PortfolioIcon, GoalsIcon, TxIcon, FundIcon,
  InvestIcon, UserIcon, SettingsIcon, HelpIcon, WalletIcon, LogoutIcon, FlowIcon,
} from "@/components/icons";

const navItems = [
  { href: "/dashboard", icon: HomeIcon, label: "Dashboard" },
  { href: "/portfolio", icon: PortfolioIcon, label: "Portfolio" },
  { href: "/goals", icon: GoalsIcon, label: "Goals" },
  { href: "/transactions", icon: TxIcon, label: "Transactions" },
  { href: "/funding-sources", icon: FundIcon, label: "Funding Sources" },
  { href: "/autosave-flow", icon: FlowIcon, label: "Auto-Save Flow" },
  { href: "/investments", icon: InvestIcon, label: "Investments" },
  { href: "/profile", icon: UserIcon, label: "Profile" },
  { href: "/settings", icon: SettingsIcon, label: "Settings" },
  { href: "/help", icon: HelpIcon, label: "Help & Support" },
];

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("onboarding_complete");
    router.push("/login");
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50
        md:relative md:inset-auto md:z-auto md:translate-x-0
        w-55 min-w-55 bg-white border-r border-slate-200 flex flex-col py-6
        transition-transform duration-200 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="px-6 pb-6 border-b border-slate-200 mb-2 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
            <WalletIcon size={16} />
          </div>
          <span className="font-extrabold text-base text-slate-800">SaveWise</span>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden text-slate-400 hover:text-slate-600 text-xl leading-none"
          aria-label="Close menu"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href.split("?")[0];
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
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
      </div>
      <div className="px-6 pt-4 border-t border-slate-200 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-0 py-2.5 text-sm text-slate-500 hover:text-danger transition-all w-full"
        >
          <LogoutIcon size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
