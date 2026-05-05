"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { API_ENDPOINTS, apiGet, apiPost, apiPatch, apiDelete, apiUpload } from "@/lib/api";

// ─── Icons ────────────────────────────────────────────────────────────────────

const GridIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const UsersIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const CoinsIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
    <path d="M7 6h1v4" /><line x1="16.71" y1="13.88" x2="13.91" y2="16.71" />
  </svg>
);
const ArrowsIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);
const DownloadIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const BellIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const GearIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const SearchIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const CheckIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const EditIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const BanIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
  </svg>
);
const TrashIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const TrendUpIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const AlertIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const WalletIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z" />
    <path d="M16 3H8a2 2 0 0 0-2 2v2h12V5a2 2 0 0 0-2-2z" />
    <circle cx="17" cy="13" r="1" fill="currentColor" />
  </svg>
);
const PlusIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const LogOutIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const ShieldIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const PhoneIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.39 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.79a16 16 0 0 0 6.28 6.28l.95-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const EyeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const RefreshIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);
const BuildingIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="9" width="18" height="12" rx="2" /><path d="M3 9l9-6 9 6" /><line x1="9" y1="22" x2="9" y2="14" /><line x1="15" y1="22" x2="15" y2="14" />
  </svg>
);
const TargetIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type AdminTab = "overview" | "users" | "goals" | "funds" | "transactions" | "withdrawals" | "providers" | "broadcast" | "settings";

interface UserData {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  created_at: string;
  member_status: "active" | "suspended" | "pending" | "deleted";
  is_staff: boolean;
  is_superuser: boolean;
  total_saved?: number;
  goals_count?: number;
}

interface GoalData {
  id: string;
  user_name: string;
  user_email: string;
  name: string;
  goal_type: "savings" | "emergency" | "group";
  target_amount: number;
  current_amount: number;
  status: "active" | "completed" | "cancelled";
  deadline: string | null;
  created_at: string;
}

interface FundData {
  id: string;
  name: string;
  category: string;
  annual_roi: number;
  risk_level: string;
  min_investment: number;
  is_active: boolean;
  description?: string;
  duration?: string;
  image?: string;
  application_start_date?: string;
  application_end_date?: string;
}

interface TransactionData {
  id: string;
  user_name: string;
  user_email?: string;
  transaction_type: string;
  amount: number;
  created_at: string;
  status: "completed" | "pending" | "failed";
  reference_number?: string;
  source?: string;
}

interface WithdrawalData {
  id: string;
  user_name: string;
  user_email: string;
  amount: number;
  method: string;
  created_at: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
}

interface ProviderData {
  id: string;
  name: string;
  code: string;
  country?: string;
  is_active: boolean;
  provider_type: "bank" | "mobile";
}

interface KPIData {
  total_users: number;
  active_users: number;
  new_users_this_month: number;
  total_savings: number;
  total_invested: number;
  platform_revenue: number;
  active_goals: number;
  pending_withdrawals: number;
  failed_deductions: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtCurrency(val: number | undefined | null) {
  return `TSh ${(val ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
function toArray<T>(res: any): T[] {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.results)) return res.results;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.users)) return res.users;
  if (Array.isArray(res?.items)) return res.items;
  // last resort: first array value found on the object
  if (res && typeof res === "object") {
    for (const key of Object.keys(res)) {
      if (Array.isArray(res[key])) return res[key];
    }
  }
  return [];
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-brand-500" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    active: "bg-success-light text-success",
    completed: "bg-success-light text-success",
    approved: "bg-success-light text-success",
    suspended: "bg-danger-light text-danger",
    deleted: "bg-danger-light text-danger",
    failed: "bg-danger-light text-danger",
    rejected: "bg-danger-light text-danger",
    cancelled: "bg-danger-light text-danger",
    pending: "bg-warning-light text-warning",
    inactive: "bg-slate-100 text-slate-500",
    emergency: "bg-orange-100 text-orange-600",
    savings: "bg-brand-50 text-brand-500",
    group: "bg-indigo-50 text-indigo-600",
  };
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${map[status] ?? "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );
}

function ProgressBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1">
      <div className="h-1.5 rounded-full bg-brand-500 transition-all" style={{ width: `${clamped}%` }} />
    </div>
  );
}

function Modal({ onClose, children, wide }: { onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full z-10 max-h-[90vh] overflow-y-auto p-7 ${wide ? "max-w-2xl" : "max-w-[440px]"}`}>
        {children}
      </div>
    </div>
  );
}

function BarChart({ data, months }: { data: number[]; months: string[] }) {
  const safe = (data || []).map(v => (isFinite(Number(v)) ? Number(v) : 0));
  if (safe.length === 0) return <div className="h-[130px] flex items-center justify-center text-slate-400 text-[13px]">No data</div>;
  const max = Math.max(...safe, 1);
  const h = 110; const w = 480; const bw = w / safe.length;
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full">
      {safe.map((v, i) => {
        const bh = Math.max((v / max) * h, 0);
        const x = i * bw + bw * 0.2;
        return (
          <g key={i}>
            <rect x={x} y={h - bh} width={bw * 0.6} height={bh} rx={3} fill="#6c63ff" opacity={i === safe.length - 1 ? 1 : 0.6} />
            <text x={x + bw * 0.3} y={h + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">{months[i] ?? ""}</text>
          </g>
        );
      })}
    </svg>
  );
}

function AreaChart({ data, months }: { data: number[]; months: string[] }) {
  const safe = (data || []).map(v => (isFinite(Number(v)) ? Number(v) : 0));
  if (safe.length === 0) return <div className="h-[130px] flex items-center justify-center text-slate-400 text-[13px]">No data</div>;
  const max = Math.max(...safe); const min = Math.min(...safe);
  const h = 110; const w = 480;
  const xOf = (i: number) => safe.length > 1 ? (i / (safe.length - 1)) * w : w / 2;
  const pts = safe.map((v, i): [number, number] => [xOf(i), h - ((v - min) / Math.max(max - min, 1)) * h]);
  const lineStr = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full">
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6c63ff" stopOpacity="0.2" /><stop offset="100%" stopColor="#6c63ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${lineStr} L${w},${h} L0,${h} Z`} fill="url(#ag)" />
      <path d={lineStr} fill="none" stroke="#6c63ff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={3} fill="#6c63ff" />
          {i % 3 === 0 && <text x={x} y={h + 14} textAnchor="middle" fontSize={9} fill="#94a3b8">{months[i] ?? ""}</text>}
        </g>
      ))}
    </svg>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab() {
  const defaultKpis: KPIData = { total_users: 0, active_users: 0, new_users_this_month: 0, total_savings: 0, total_invested: 0, platform_revenue: 0, active_goals: 0, pending_withdrawals: 0, failed_deductions: 0 };
  const [kpis, setKpis] = useState<KPIData>(defaultKpis);
  const [usersChart, setUsersChart] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [savingsChart, setSavingsChart] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true); setError(null);

      // Overview is required — let its error propagate
      const overview = await apiGet(API_ENDPOINTS.ADMIN.OVERVIEW);
      setKpis(prev => ({ ...prev, ...overview }));
      setAlerts(overview.system_alerts || []);

      // recent_activity may be embedded in the overview response
      if (overview.recent_activity) {
        setRecentActivity(toArray(overview.recent_activity).slice(0, 6));
      }

      // Charts — single combined endpoint, silently skip if not yet implemented
      const charts = await apiGet(API_ENDPOINTS.ADMIN.CHARTS).catch(() => null);
      if (charts) {
        const months: string[] = charts.months || charts.labels || [];
        const toNums = (arr: any[]) => (arr || []).map((v: any) => (isFinite(Number(v)) ? Number(v) : 0));
        setUsersChart({ labels: months, data: toNums(charts.users || charts.user_data || charts.user_signups || []) });
        setSavingsChart({ labels: months, data: toNums(charts.savings || charts.savings_data || charts.savings_volume || []) });
      }
    } catch (err: any) {
      const msg = err?.message || "";
      setError(msg.includes("403") || msg.includes("permission") || msg.includes("Admin") ? "Admin access required." : "Failed to load overview.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 30_000);
    return () => clearInterval(poll);
  }, [load]);

  if (isLoading) return <Spinner />;
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <div className="w-14 h-14 rounded-full bg-danger-light flex items-center justify-center text-danger"><AlertIcon size={24} /></div>
      <div className="text-slate-700 font-semibold">{error}</div>
      <button onClick={load} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold">Retry</button>
    </div>
  );

  const kpiCards = [
    { label: "Total Users", val: (kpis.total_users ?? 0).toLocaleString(), sub: `${kpis.new_users_this_month ?? 0} new this month`, Icon: UsersIcon, color: "text-brand-500", bg: "bg-brand-50" },
    { label: "Active Users", val: (kpis.active_users ?? 0).toLocaleString(), sub: "Currently active accounts", Icon: UsersIcon, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Total Savings", val: fmtCurrency(kpis.total_savings), sub: "Platform-wide savings", Icon: WalletIcon, color: "text-success", bg: "bg-success-light" },
    { label: "Total Invested", val: fmtCurrency(kpis.total_invested), sub: "Active investments", Icon: CoinsIcon, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Platform Revenue", val: fmtCurrency(kpis.platform_revenue), sub: "Fee income", Icon: TrendUpIcon, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Active Goals", val: (kpis.active_goals ?? 0).toLocaleString(), sub: "Across all users", Icon: TargetIcon, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Pending Withdrawals", val: (kpis.pending_withdrawals ?? 0).toString(), sub: "Needs review", Icon: DownloadIcon, color: "text-warning", bg: "bg-warning-light" },
    { label: "Failed Deductions", val: (kpis.failed_deductions ?? 0).toString(), sub: "Last 30 days", Icon: AlertIcon, color: "text-danger", bg: "bg-danger-light" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {kpiCards.map(({ label, val, sub, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${bg} ${color}`}><Icon size={16} /></div>
            <div className={`text-2xl font-extrabold mb-0.5 ${color}`}>{val}</div>
            <div className="text-[13px] font-semibold text-slate-700 mb-0.5">{label}</div>
            <div className="text-[11px] text-slate-400">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="font-bold text-[14px] text-slate-800 mb-0.5">User Registrations</div>
          <div className="text-[11px] text-slate-400 mb-4">Monthly new users</div>
          <BarChart data={usersChart.data} months={usersChart.labels} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="font-bold text-[14px] text-slate-800 mb-0.5">Cumulative Savings Volume</div>
          <div className="text-[11px] text-slate-400 mb-4">Total platform savings</div>
          <AreaChart data={savingsChart.data} months={savingsChart.labels} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="font-bold text-[14px] text-slate-800 mb-4">System Alerts</div>
          <div className="space-y-2.5">
            {alerts.length === 0 ? (
              <div className="text-[13px] text-slate-400">No active alerts</div>
            ) : alerts.map((a: any, i: number) => {
              const cls = a.level === "danger" ? { wrap: "bg-danger-light", text: "text-danger" } : a.level === "warning" ? { wrap: "bg-warning-light", text: "text-warning" } : { wrap: "bg-brand-50", text: "text-brand-500" };
              return (
                <div key={i} className={`flex items-start gap-3 rounded-xl p-3 ${cls.wrap}`}>
                  <span className={`shrink-0 mt-0.5 ${cls.text}`}><AlertIcon size={14} /></span>
                  <span className={`text-[12px] font-medium ${cls.text}`}>{a.message}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="font-bold text-[14px] text-slate-800 mb-4">Recent Activity</div>
          <div className="divide-y divide-slate-50">
            {recentActivity.length === 0 ? (
              <div className="text-[13px] text-slate-400 py-4">No recent activity</div>
            ) : recentActivity.map((t: any, i: number) => (
              <div key={t.id ?? i} className="flex items-center justify-between py-2.5 gap-3">
                <div>
                  <div className="text-[12px] font-semibold text-slate-800">{t.user_name || t.user}</div>
                  <div className="text-[11px] text-slate-400">{t.type || t.transaction_type} · {fmtDate(t.date || t.created_at)}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[12px] font-bold text-slate-800 mb-0.5">{typeof t.amount === "number" ? fmtCurrency(t.amount) : t.amount}</div>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── User Detail Modal ────────────────────────────────────────────────────────

function UserDetailModal({ userId, onClose, onUpdated }: { userId: string; onClose: () => void; onUpdated: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    apiGet(API_ENDPOINTS.ADMIN.USER_DETAIL(userId))
      .then(res => {
        const u = res?.data || res?.user || res?.result || res;
        setUser({
          ...u,
          full_name: u.full_name || u.name || [u.first_name, u.last_name].filter(Boolean).join(" ") || u.username || u.email || "—",
          email: u.email || "—",
          phone_number: u.phone_number || u.phone || "",
          member_status: u.member_status || u.status || (u.is_active === false ? "suspended" : "active"),
          is_staff: u.is_staff || u.is_admin || false,
          is_superuser: u.is_superuser || false,
          created_at: u.created_at || u.date_joined || u.joined_at || null,
          total_saved: u.total_saved ?? u.wallet?.total_balance ?? u.savings_balance ?? 0,
          goals_count: u.goals_count ?? u.goals ?? 0,
          wallet: u.wallet || null,
          active_investments: u.active_investments ?? u.investments_count ?? 0,
          total_transactions: u.total_transactions ?? u.transactions_count ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [userId]);

  async function toggleAdmin() {
    setAdminError("");
    setSaving(true);
    try {
      if (user.is_staff) {
        await apiPost(API_ENDPOINTS.ADMIN.REVOKE_ADMIN(userId));
      } else {
        await apiPost(API_ENDPOINTS.ADMIN.MAKE_ADMIN(userId));
      }
      setUser((p: any) => ({ ...p, is_staff: !p.is_staff }));
      onUpdated();
    } catch (err: any) {
      setAdminError(err?.message || "Action failed. Please try again.");
    } finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-slate-800">User Details</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
      </div>
      {isLoading ? <div className="py-12 text-center text-slate-400">Loading…</div> : !user ? <div className="py-12 text-center text-slate-400">User not found.</div> : (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center text-xl font-extrabold shrink-0">
              {(user.full_name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-extrabold text-slate-800">{user.full_name}</span>
                {user.is_superuser
                  ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 flex items-center gap-1"><ShieldIcon size={10} /> Super Admin</span>
                  : user.is_staff
                  ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-500 flex items-center gap-1"><ShieldIcon size={10} /> Admin</span>
                  : <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">User</span>}
              </div>
              <div className="text-[13px] text-slate-500">{user.email}</div>
              <div className="text-[12px] text-slate-400 flex items-center gap-1 mt-0.5"><PhoneIcon size={11} />{user.phone_number || "—"}</div>
            </div>
            <StatusBadge status={user.member_status || "pending"} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Joined", val: fmtDate(user.created_at) },
              { label: "Total Saved", val: fmtCurrency(user.total_saved) },
              { label: "Goals", val: (user.goals_count ?? 0).toString() },
              { label: "Wallet Balance", val: fmtCurrency(user.wallet?.available_balance) },
              { label: "Active Investments", val: (user.active_investments ?? 0).toString() },
              { label: "Total Transactions", val: (user.total_transactions ?? 0).toString() },
            ].map(({ label, val }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <div className="text-[11px] text-slate-400 mb-0.5">{label}</div>
                <div className="text-[14px] font-bold text-slate-800">{val}</div>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-[12px] font-bold text-slate-500 mb-3 uppercase tracking-wide">Admin Controls</div>
            {user.is_superuser ? (
              <div className="flex items-center gap-2 text-[12px] text-purple-600 bg-purple-50 rounded-lg px-3 py-2">
                <ShieldIcon size={13} />
                <span>This account has super admin privileges and cannot be modified here.</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800">{user.is_staff ? "Revoke Admin Privileges" : "Grant Admin Privileges"}</div>
                    <div className="text-[11px] text-slate-400">{user.is_staff ? "Remove this user's access to the admin dashboard" : "Allow this user to access the admin dashboard"}</div>
                  </div>
                  <button
                    onClick={toggleAdmin}
                    disabled={saving}
                    className={`px-4 py-2 rounded-lg text-[12px] font-bold transition-all ${user.is_staff ? "bg-danger-light text-danger hover:bg-danger hover:text-white" : "bg-brand-50 text-brand-500 hover:bg-brand-500 hover:text-white"}`}
                  >
                    {saving ? "Saving…" : user.is_staff ? "Revoke Admin" : "Make Admin"}
                  </button>
                </div>
                {adminError && <p className="text-[11px] text-danger mt-2">{adminError}</p>}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

// ─── Normalize user row from any backend shape ────────────────────────────────

function normalizeUser(u: any): UserData {
  return {
    id: u.id,
    full_name: u.full_name || u.name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email || "Unknown",
    email: u.email || "",
    phone_number: u.phone_number || u.phone || "",
    created_at: u.created_at || u.date_joined || "",
    member_status: u.member_status || u.status || (u.is_active === false ? "suspended" : "active"),
    is_staff: u.is_staff || u.is_admin || false,
    is_superuser: u.is_superuser || false,
    total_saved: u.total_saved ?? u.wallet?.total_balance ?? 0,
    goals_count: u.goals_count ?? u.goals ?? 0,
  };
}

// ─── Tab: Users ───────────────────────────────────────────────────────────────

function UsersTab() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (filter !== "all") {
        params.set("member_status", filter);
        params.set("status", filter);
      }
      const url = `${API_ENDPOINTS.ADMIN.USERS}?${params}`;
      const res = await apiGet(url);
      console.log("[Admin Users] raw response:", res);
      const raw = toArray<any>(res);
      console.log("[Admin Users] parsed array length:", raw.length);
      setUsers(raw.map(normalizeUser));
      setTotal(res?.count ?? res?.total ?? raw.length);
    } catch (err: any) {
      console.error("[Admin Users] load error:", err);
      setError(err?.message || "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, [search, filter, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleSuspend(id: string, current: string) {
    try {
      if (current === "active") {
        await apiPost(API_ENDPOINTS.ADMIN.SUSPEND_USER(id));
      } else {
        await apiPost(API_ENDPOINTS.ADMIN.ACTIVATE_USER(id));
      }
      setUsers(prev => prev.map(u => u.id === id ? { ...u, member_status: current === "active" ? "suspended" : "active" } : u));
    } catch { }
  }

  async function removeUser(id: string) {
    if (!confirm("Permanently delete this user? This cannot be undone.")) return;
    try {
      await apiDelete(API_ENDPOINTS.ADMIN.DELETE_USER(id));
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (isLoading) return <Spinner />;

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
      <div className="w-14 h-14 rounded-full bg-danger-light flex items-center justify-center text-danger"><AlertIcon size={24} /></div>
      <div className="text-slate-700 font-semibold text-center max-w-sm">{error}</div>
      <button onClick={load} className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold">Retry</button>
    </div>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon size={14} /></span>
          <input className="input-field pl-9! text-[13px]" placeholder="Search name, email, or phone…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
          {["all", "active", "pending", "suspended"].map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${filter === f ? "bg-white text-brand-500 shadow-sm" : "text-slate-500"}`}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={load} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors" title="Refresh">
          <RefreshIcon size={14} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[780px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["User", "Phone", "Joined", "Total Saved", "Goals", "Role", "Status", "Actions"].map(h => (
                <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-500 flex items-center justify-center text-[11px] font-extrabold shrink-0">
                      {(u.full_name || "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-slate-800">{u.full_name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-[12px] text-slate-500 whitespace-nowrap">
                  <span className="flex items-center gap-1"><PhoneIcon size={11} />{u.phone_number || "—"}</span>
                </td>
                <td className="px-4 py-3.5 text-[12px] text-slate-500 whitespace-nowrap">{fmtDate(u.created_at)}</td>
                <td className="px-4 py-3.5 text-[12px] font-semibold text-slate-800">{fmtCurrency(u.total_saved)}</td>
                <td className="px-4 py-3.5 text-[12px] text-slate-500">{u.goals_count ?? 0}</td>
                <td className="px-4 py-3.5">
                  {u.is_superuser
                    ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 flex items-center gap-1 w-fit"><ShieldIcon size={10} /> Super Admin</span>
                    : u.is_staff
                    ? <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-500 flex items-center gap-1 w-fit"><ShieldIcon size={10} /> Admin</span>
                    : <span className="text-[11px] text-slate-400">User</span>}
                </td>
                <td className="px-4 py-3.5"><StatusBadge status={u.member_status} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setSelectedUser(u.id)} title="View details"
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-400 hover:text-brand-500 flex items-center justify-center transition-all">
                      <EyeIcon size={13} />
                    </button>
                    <button onClick={() => toggleSuspend(u.id, u.member_status)}
                      title={u.member_status === "active" ? "Suspend" : "Activate"}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${u.member_status === "active" ? "bg-slate-100 hover:bg-warning-light text-slate-400 hover:text-warning" : "bg-success-light text-success hover:bg-success hover:text-white"}`}>
                      {u.member_status === "active" ? <BanIcon size={13} /> : <CheckIcon size={13} />}
                    </button>
                    <button onClick={() => removeUser(u.id)} title="Delete user"
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-danger-light text-slate-400 hover:text-danger flex items-center justify-center transition-all">
                      <TrashIcon size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-[13px]">
            {filter !== "all"
              ? <>No {filter} users found. <button className="text-brand-500 underline" onClick={() => setFilter("all")}>Clear filter</button></>
              : "No users found. Check the browser console (F12) for the raw API response."}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-slate-400">{total} total users</div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-500 disabled:opacity-40 hover:bg-slate-200">Prev</button>
            <span className="text-[12px] text-slate-500">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-500 disabled:opacity-40 hover:bg-slate-200">Next</button>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserDetailModal userId={selectedUser} onClose={() => setSelectedUser(null)} onUpdated={load} />
      )}
    </div>
  );
}

// ─── Tab: Goals ───────────────────────────────────────────────────────────────

function GoalsTab() {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (typeFilter !== "all") params.set("goal_type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await apiGet(`${API_ENDPOINTS.ADMIN.GOALS}?${params}`);
      setGoals(toArray<GoalData>(res));
      setTotal(res?.count || 0);
    } catch {
    } finally { setIsLoading(false); }
  }, [typeFilter, statusFilter, search, page]);

  useEffect(() => { load(); }, [load]);

  async function cancelGoal(id: string) {
    if (!confirm("Cancel this goal?")) return;
    try {
      await apiDelete(API_ENDPOINTS.ADMIN.GOAL_DETAIL(id));
      setGoals(prev => prev.filter(g => g.id !== id));
    } catch { }
  }

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon size={14} /></span>
          <input className="input-field pl-9! text-[13px]" placeholder="Search by goal name or user…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
          {["all", "savings", "emergency", "group"].map(f => (
            <button key={f} onClick={() => { setTypeFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${typeFilter === f ? "bg-white text-brand-500 shadow-sm" : "text-slate-500"}`}>
              {f === "all" ? "All Types" : f}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
          {["all", "active", "completed", "cancelled"].map(f => (
            <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${statusFilter === f ? "bg-white text-brand-500 shadow-sm" : "text-slate-500"}`}>
              {f === "all" ? "All Status" : f}
            </button>
          ))}
        </div>
        <button onClick={load} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
          <RefreshIcon size={14} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Goal", "Owner", "Type", "Target", "Progress", "Deadline", "Status", "Action"].map(h => (
                <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {goals.map(g => {
              const pct = g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0;
              return (
                <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="text-[13px] font-semibold text-slate-800">{g.name}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-[12px] font-semibold text-slate-700">{g.user_name}</div>
                    <div className="text-[11px] text-slate-400">{g.user_email}</div>
                  </td>
                  <td className="px-4 py-3.5"><StatusBadge status={g.goal_type} /></td>
                  <td className="px-4 py-3.5 text-[12px] font-semibold text-slate-800">{fmtCurrency(g.target_amount)}</td>
                  <td className="px-4 py-3.5 min-w-[120px]">
                    <div className="text-[11px] text-slate-500 mb-0.5">{fmtCurrency(g.current_amount)} <span className="text-slate-400">({pct}%)</span></div>
                    <ProgressBar pct={pct} />
                  </td>
                  <td className="px-4 py-3.5 text-[12px] text-slate-400 whitespace-nowrap">{fmtDate(g.deadline)}</td>
                  <td className="px-4 py-3.5"><StatusBadge status={g.status} /></td>
                  <td className="px-4 py-3.5">
                    {g.status === "active" && (
                      <button onClick={() => cancelGoal(g.id)}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-danger-light text-slate-400 hover:text-danger flex items-center justify-center transition-all" title="Cancel goal">
                        <XIcon size={13} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {goals.length === 0 && <div className="text-center py-12 text-slate-400 text-[13px]">No goals found.</div>}
      </div>
      <div className="mt-3 text-[11px] text-slate-400">{total} total goals</div>
    </div>
  );
}

// ─── Add / Edit Fund Modal ────────────────────────────────────────────────────

function FundFormModal({ fund, onClose, onSaved }: { fund?: FundData; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    name: fund?.name || "",
    category: fund?.category || "",
    annual_roi: fund ? String(fund.annual_roi) : "",
    risk_level: fund?.risk_level || "Medium",
    min_investment: fund ? String(fund.min_investment) : "",
    description: fund?.description || "",
    duration: fund?.duration || "",
    application_start_date: fund?.application_start_date?.slice(0, 10) || "",
    application_end_date: fund?.application_end_date?.slice(0, 10) || "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(fund?.image || null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const set = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const canSave = form.name && form.category && form.annual_roi && form.min_investment;

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setSaveError("Image must be under 5 MB."); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setSaveError("");
  }

  async function save() {
    if (!canSave) return;
    setSaving(true); setSaveError("");
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("category", form.category);
      fd.append("annual_roi", form.annual_roi);
      fd.append("risk_level", form.risk_level);
      fd.append("min_investment", form.min_investment);
      fd.append("description", form.description);
      fd.append("duration", form.duration);
      if (form.application_start_date) fd.append("application_start_date", form.application_start_date);
      if (form.application_end_date) fd.append("application_end_date", form.application_end_date);
      if (imageFile) fd.append("image", imageFile);

      if (fund) await apiUpload(API_ENDPOINTS.ADMIN.FUND_DETAIL(fund.id), "PATCH", fd);
      else await apiUpload(API_ENDPOINTS.ADMIN.FUNDS, "POST", fd);
      onSaved(); onClose();
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save fund.");
    } finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-slate-800">{fund ? "Edit Fund" : "Add Investment Fund"}</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
      </div>

      <div className="space-y-4 mb-5">
        {/* Cover image */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-2">Cover Image</label>
          <div className="flex items-start gap-4">
            <div className="w-32 h-20 rounded-xl border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center bg-slate-50 shrink-0">
              {imagePreview
                ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                : <span className="text-[11px] text-slate-400 text-center px-2">No image</span>}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-semibold text-slate-600 transition-colors">
                <PlusIcon size={12} /> {imagePreview ? "Change image" : "Upload image"}
                <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </label>
              <div className="text-[11px] text-slate-400 mt-1.5">JPG, PNG or WebP · max 5 MB</div>
              {imagePreview && (
                <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                  className="mt-1 text-[11px] text-danger hover:underline">Remove image</button>
              )}
            </div>
          </div>
        </div>

        {/* Basic info */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Fund Name</label>
          <input className="input-field" placeholder="e.g. Urban Growth Fund" value={form.name} onChange={e => set("name")(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Category</label>
            <select className="input-field" value={form.category} onChange={e => set("category")(e.target.value)}>
              <option value="">Select…</option>
              {["Real Estate", "Agriculture", "Technology", "Energy"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Annual ROI (%)</label>
            <input className="input-field" type="number" step="0.1" placeholder="12.5" value={form.annual_roi} onChange={e => set("annual_roi")(e.target.value)} />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Risk Level</label>
            <select className="input-field" value={form.risk_level} onChange={e => set("risk_level")(e.target.value)}>
              {["Low", "Medium", "High"].map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Min. Investment</label>
            <input className="input-field" type="number" placeholder="50" value={form.min_investment} onChange={e => set("min_investment")(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Duration</label>
          <input className="input-field" placeholder="e.g. 12–36 months" value={form.duration} onChange={e => set("duration")(e.target.value)} />
        </div>

        {/* Application window */}
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-2">Application Window</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Start Date</label>
              <input className="input-field" type="date" value={form.application_start_date} onChange={e => set("application_start_date")(e.target.value)} />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">End Date</label>
              <input className="input-field" type="date" value={form.application_end_date}
                min={form.application_start_date || undefined}
                onChange={e => set("application_end_date")(e.target.value)} />
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">Leave blank if applications are always open.</p>
        </div>

        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Description</label>
          <textarea className="input-field resize-none" rows={3} placeholder="Brief description of the fund…" value={form.description} onChange={e => set("description")(e.target.value)} />
        </div>

        {saveError && <div className="text-[12px] text-danger bg-danger-light rounded-lg px-3 py-2">{saveError}</div>}
      </div>

      <div className="flex gap-3">
        <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
        <button className="btn-primary flex-2" disabled={!canSave || saving} onClick={save}>
          {saving ? "Saving…" : fund ? "Save Changes" : "Add Fund"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Tab: Funds ───────────────────────────────────────────────────────────────

function FundsTab() {
  const [funds, setFunds] = useState<FundData[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editFund, setEditFund] = useState<FundData | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await apiGet(API_ENDPOINTS.ADMIN.FUNDS);
      setFunds(toArray<FundData>(res));
    } catch {
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleActive(id: string, current: boolean) {
    try {
      await apiPatch(API_ENDPOINTS.ADMIN.FUND_DETAIL(id), { is_active: !current });
      setFunds(prev => prev.map(f => f.id === id ? { ...f, is_active: !f.is_active } : f));
    } catch { }
  }

  async function deleteFund(id: string) {
    if (!confirm("Delete this fund?")) return;
    try {
      await apiDelete(API_ENDPOINTS.ADMIN.FUND_DETAIL(id));
      setFunds(prev => prev.filter(f => f.id !== id));
    } catch { }
  }

  const riskColor: Record<string, string> = { Low: "text-success bg-success-light", Medium: "text-warning bg-warning-light", High: "text-danger bg-danger-light" };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <p className="text-[13px] text-slate-500">
          {funds.filter(f => f.is_active).length} active · {funds.filter(f => !f.is_active).length} inactive
        </p>
        <div className="flex items-center gap-2">
          <button onClick={load} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><RefreshIcon size={14} /></button>
          <button className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl transition-colors" onClick={() => { setEditFund(undefined); setShowForm(true); }}>
            <PlusIcon size={14} /> Add Fund
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Fund", "Category", "Annual ROI", "Risk", "Min. Invest", "Duration", "Application Window", "Status", "Actions"].map(h => (
                <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {funds.map(f => (
              <tr key={f.id} className={`hover:bg-slate-50 transition-colors ${!f.is_active ? "opacity-60" : ""}`}>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    {f.image
                      ? <img src={f.image} alt={f.name} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-100" />
                      : <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0"><CoinsIcon size={14} /></div>}
                    <div>
                      <div className="text-[13px] font-semibold text-slate-800">{f.name}</div>
                      {f.description && <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{f.description}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-[12px] text-slate-500">{f.category}</td>
                <td className="px-4 py-3.5 text-[12px] font-bold text-success">+{f.annual_roi}%</td>
                <td className="px-4 py-3.5"><span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${riskColor[f.risk_level] || "bg-slate-100 text-slate-500"}`}>{f.risk_level}</span></td>
                <td className="px-4 py-3.5 text-[12px] text-slate-500">{fmtCurrency(f.min_investment)}</td>
                <td className="px-4 py-3.5 text-[12px] text-slate-500">{f.duration || "—"}</td>
                <td className="px-4 py-3.5 text-[11px] text-slate-500 whitespace-nowrap">
                  {f.application_start_date || f.application_end_date ? (
                    <div>
                      <div>{fmtDate(f.application_start_date)} →</div>
                      <div>{fmtDate(f.application_end_date)}</div>
                    </div>
                  ) : <span className="text-slate-300">Always open</span>}
                </td>
                <td className="px-4 py-3.5"><StatusBadge status={f.is_active ? "active" : "inactive"} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setEditFund(f); setShowForm(true); }}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-400 hover:text-brand-500 flex items-center justify-center transition-all">
                      <EditIcon size={13} />
                    </button>
                    <Toggle on={f.is_active} onToggle={() => toggleActive(f.id, f.is_active)} />
                    <button onClick={() => deleteFund(f.id)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-danger-light text-slate-400 hover:text-danger flex items-center justify-center transition-all">
                      <TrashIcon size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {funds.length === 0 && <div className="text-center py-12 text-slate-400 text-[13px]">No funds yet.</div>}
      </div>

      {showForm && <FundFormModal fund={editFund} onClose={() => setShowForm(false)} onSaved={load} />}
    </div>
  );
}

// ─── Tab: Transactions ────────────────────────────────────────────────────────

function TransactionsTab() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (typeFilter !== "all") params.set("transaction_type", typeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await apiGet(`${API_ENDPOINTS.ADMIN.TRANSACTIONS}?${params}`);
      setTransactions(toArray<TransactionData>(res));
      setTotal(res?.count || 0);
    } catch {
    } finally { setIsLoading(false); }
  }, [typeFilter, statusFilter, search, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 20);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><SearchIcon size={14} /></span>
          <input className="input-field pl-9! text-[13px]" placeholder="Search by user or reference…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {["all", "auto_save", "investment", "withdrawal", "deposit"].map(f => (
            <button key={f} onClick={() => { setTypeFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${typeFilter === f ? "bg-white text-brand-500 shadow-sm" : "text-slate-500"}`}>
              {f === "all" ? "All" : f.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {["all", "completed", "pending", "failed"].map(f => (
            <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${statusFilter === f ? "bg-white text-brand-500 shadow-sm" : "text-slate-500"}`}>
              {f === "all" ? "All Status" : f}
            </button>
          ))}
        </div>
        <button onClick={load} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><RefreshIcon size={14} /></button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["User", "Type", "Amount", "Reference", "Date", "Status"].map(h => (
                <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="text-[13px] font-semibold text-slate-800">{t.user_name}</div>
                  {t.user_email && <div className="text-[11px] text-slate-400">{t.user_email}</div>}
                </td>
                <td className="px-4 py-3.5 text-[12px] text-slate-500 capitalize">{(t.transaction_type || "").replace("_", " ")}</td>
                <td className="px-4 py-3.5 text-[13px] font-bold text-slate-800">{fmtCurrency(t.amount)}</td>
                <td className="px-4 py-3.5 text-[11px] text-slate-400 font-mono">{t.reference_number || "—"}</td>
                <td className="px-4 py-3.5 text-[12px] text-slate-400 whitespace-nowrap">{fmtDate(t.created_at)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={t.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {transactions.length === 0 && <div className="text-center py-12 text-slate-400 text-[13px]">No transactions found.</div>}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="text-[11px] text-slate-400">{total} total transactions</div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-500 disabled:opacity-40 hover:bg-slate-200">Prev</button>
            <span className="text-[12px] text-slate-500">Page {page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-500 disabled:opacity-40 hover:bg-slate-200">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Withdrawals ─────────────────────────────────────────────────────────

function WithdrawalsTab({ onBadgeChange }: { onBadgeChange: (n: number) => void }) {
  const [requests, setRequests] = useState<WithdrawalData[]>([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await apiGet(`${API_ENDPOINTS.ADMIN.WITHDRAWALS}?${params}`);
      const data = toArray<WithdrawalData>(res);
      setRequests(data);
      const pendingCount = data.filter((w: WithdrawalData) => w.status === "pending").length;
      onBadgeChange(pendingCount);
    } catch {
    } finally { setIsLoading(false); }
  }, [statusFilter, onBadgeChange]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: string) {
    try {
      await apiPost(API_ENDPOINTS.ADMIN.APPROVE_WITHDRAWAL(id));
      setRequests(prev => prev.map(w => w.id === id ? { ...w, status: "approved" } : w));
      onBadgeChange(requests.filter(w => w.status === "pending" && w.id !== id).length);
    } catch { }
  }

  async function reject(id: string) {
    try {
      await apiPost(API_ENDPOINTS.ADMIN.REJECT_WITHDRAWAL(id), { reason: rejectReason });
      setRequests(prev => prev.map(w => w.id === id ? { ...w, status: "rejected" } : w));
      setRejectModal(null); setRejectReason("");
      onBadgeChange(requests.filter(w => w.status === "pending" && w.id !== id).length);
    } catch { }
  }

  const pendingCount = requests.filter(w => w.status === "pending").length;

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {["pending", "approved", "rejected", "all"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold capitalize transition-all ${statusFilter === f ? "bg-white text-brand-500 shadow-sm" : "text-slate-500"}`}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
        <button onClick={load} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><RefreshIcon size={14} /></button>
      </div>

      {pendingCount > 0 && statusFilter === "pending" && (
        <div className="bg-warning-light border border-warning/20 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
          <span className="text-warning shrink-0"><AlertIcon size={14} /></span>
          <span className="text-[13px] text-warning font-semibold">{pendingCount} withdrawal request{pendingCount > 1 ? "s" : ""} awaiting review.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["User", "Amount", "Method", "Requested", "Status", "Actions"].map(h => (
                <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {requests.map(w => (
              <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5">
                  <div className="text-[13px] font-semibold text-slate-800">{w.user_name}</div>
                  <div className="text-[11px] text-slate-400">{w.user_email}</div>
                </td>
                <td className="px-4 py-3.5 text-[13px] font-bold text-slate-800">{fmtCurrency(w.amount)}</td>
                <td className="px-4 py-3.5 text-[12px] text-slate-500">{w.method}</td>
                <td className="px-4 py-3.5 text-[12px] text-slate-400 whitespace-nowrap">{fmtDate(w.created_at)}</td>
                <td className="px-4 py-3.5"><StatusBadge status={w.status} /></td>
                <td className="px-4 py-3.5">
                  {w.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => approve(w.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-light text-success text-[12px] font-semibold hover:bg-success hover:text-white transition-all">
                        <CheckIcon size={12} /> Approve
                      </button>
                      <button onClick={() => { setRejectModal(w.id); setRejectReason(""); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger-light text-danger text-[12px] font-semibold hover:bg-danger hover:text-white transition-all">
                        <XIcon size={12} /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-[12px] text-slate-400 italic">{w.status === "rejected" && w.rejection_reason ? w.rejection_reason : "Resolved"}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {requests.length === 0 && <div className="text-center py-12 text-slate-400 text-[13px]">No withdrawal requests.</div>}
      </div>

      {rejectModal && (
        <Modal onClose={() => setRejectModal(null)}>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-extrabold text-slate-800">Reject Withdrawal</h2>
            <button onClick={() => setRejectModal(null)} className="text-slate-400 text-xl">×</button>
          </div>
          <div className="mb-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Reason (optional)</label>
            <textarea className="input-field resize-none" rows={3} placeholder="Reason for rejection…" value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button className="btn-outline flex-1" onClick={() => setRejectModal(null)}>Cancel</button>
            <button className="flex-2 bg-danger text-white py-2.5 rounded-lg text-[13px] font-semibold hover:bg-red-700 transition-colors" onClick={() => reject(rejectModal)}>Confirm Reject</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Tab: Payment Providers ───────────────────────────────────────────────────

function ProviderFormModal({ provider, type, onClose, onSaved }: { provider?: ProviderData; type: "bank" | "mobile"; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ name: provider?.name || "", code: provider?.code || "", country: provider?.country || "" });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  async function save() {
    if (!form.name || !form.code) return;
    setSaving(true);
    try {
      const payload = { name: form.name, code: form.code, country: form.country, provider_type: type };
      if (provider) {
        const endpoint = type === "bank" ? API_ENDPOINTS.ADMIN.BANK_DETAIL(provider.id) : API_ENDPOINTS.ADMIN.MOBILE_PROVIDER_DETAIL(provider.id);
        await apiPatch(endpoint, payload);
      } else {
        const endpoint = type === "bank" ? API_ENDPOINTS.ADMIN.BANKS : API_ENDPOINTS.ADMIN.MOBILE_PROVIDERS;
        await apiPost(endpoint, payload);
      }
      onSaved(); onClose();
    } catch {
    } finally { setSaving(false); }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-slate-800">{provider ? "Edit" : "Add"} {type === "bank" ? "Bank" : "Mobile Money Provider"}</h2>
        <button onClick={onClose} className="text-slate-400 text-xl">×</button>
      </div>
      <div className="space-y-3 mb-5">
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">{type === "bank" ? "Bank Name" : "Provider Name"}</label>
          <input className="input-field" placeholder={type === "bank" ? "e.g. Access Bank" : "e.g. MTN Mobile Money"} value={form.name} onChange={e => set("name")(e.target.value)} />
        </div>
        <div>
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Code / Identifier</label>
          <input className="input-field" placeholder={type === "bank" ? "e.g. ACCESS" : "e.g. MTN"} value={form.code} onChange={e => set("code")(e.target.value)} />
        </div>
        {type === "mobile" && (
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Country</label>
            <input className="input-field" placeholder="e.g. Ghana, Kenya, Nigeria" value={form.country} onChange={e => set("country")(e.target.value)} />
          </div>
        )}
      </div>
      <div className="flex gap-3">
        <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
        <button className="btn-primary flex-2" disabled={!form.name || !form.code || saving} onClick={save}>{saving ? "Saving…" : provider ? "Save Changes" : "Add"}</button>
      </div>
    </Modal>
  );
}

function PaymentProvidersTab() {
  const [banks, setBanks] = useState<ProviderData[]>([]);
  const [mobileProv, setMobileProv] = useState<ProviderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formModal, setFormModal] = useState<{ type: "bank" | "mobile"; provider?: ProviderData } | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      const [banksRes, mobileRes] = await Promise.all([
        apiGet(API_ENDPOINTS.ADMIN.BANKS).catch(() => ({ results: [] })),
        apiGet(API_ENDPOINTS.ADMIN.MOBILE_PROVIDERS).catch(() => ({ results: [] })),
      ]);
      setBanks(toArray<ProviderData>(banksRes));
      setMobileProv(toArray<ProviderData>(mobileRes));
    } catch {
    } finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function toggleProvider(id: string, type: "bank" | "mobile", current: boolean) {
    try {
      const endpoint = type === "bank" ? API_ENDPOINTS.ADMIN.BANK_DETAIL(id) : API_ENDPOINTS.ADMIN.MOBILE_PROVIDER_DETAIL(id);
      await apiPatch(endpoint, { is_active: !current });
      if (type === "bank") setBanks(prev => prev.map(b => b.id === id ? { ...b, is_active: !b.is_active } : b));
      else setMobileProv(prev => prev.map(m => m.id === id ? { ...m, is_active: !m.is_active } : m));
    } catch { }
  }

  async function deleteProvider(id: string, type: "bank" | "mobile") {
    if (!confirm(`Delete this ${type === "bank" ? "bank" : "provider"}?`)) return;
    try {
      const endpoint = type === "bank" ? API_ENDPOINTS.ADMIN.BANK_DETAIL(id) : API_ENDPOINTS.ADMIN.MOBILE_PROVIDER_DETAIL(id);
      await apiDelete(endpoint);
      if (type === "bank") setBanks(prev => prev.filter(b => b.id !== id));
      else setMobileProv(prev => prev.filter(m => m.id !== id));
    } catch { }
  }

  const ProviderTable = ({ items, type }: { items: ProviderData[]; type: "bank" | "mobile" }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <div className="font-bold text-[14px] text-slate-800">{type === "bank" ? "Banks" : "Mobile Money Providers"}</div>
          <div className="text-[11px] text-slate-400">{items.filter(i => i.is_active).length} active of {items.length}</div>
        </div>
        <button onClick={() => setFormModal({ type })}
          className="flex items-center gap-1.5 bg-brand-500 hover:bg-brand-600 text-white text-[12px] font-semibold px-3 py-2 rounded-lg transition-colors">
          <PlusIcon size={12} /> Add {type === "bank" ? "Bank" : "Provider"}
        </button>
      </div>
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50">
            {["Name", "Code", ...(type === "mobile" ? ["Country"] : []), "Status", "Actions"].map(h => (
              <th key={h} className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wide px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {items.map(item => (
            <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${!item.is_active ? "opacity-60" : ""}`}>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${type === "bank" ? "bg-brand-50 text-brand-500" : "bg-teal-50 text-teal-600"}`}>
                    {type === "bank" ? <BuildingIcon size={14} /> : <PhoneIcon size={14} />}
                  </div>
                  <span className="text-[13px] font-semibold text-slate-800">{item.name}</span>
                </div>
              </td>
              <td className="px-4 py-3.5 text-[12px] font-mono text-slate-500">{item.code}</td>
              {type === "mobile" && <td className="px-4 py-3.5 text-[12px] text-slate-500">{item.country || "—"}</td>}
              <td className="px-4 py-3.5"><StatusBadge status={item.is_active ? "active" : "inactive"} /></td>
              <td className="px-4 py-3.5">
                <div className="flex items-center gap-2">
                  <button onClick={() => setFormModal({ type, provider: item })}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-brand-50 text-slate-400 hover:text-brand-500 flex items-center justify-center transition-all">
                    <EditIcon size={13} />
                  </button>
                  <Toggle on={item.is_active} onToggle={() => toggleProvider(item.id, type, item.is_active)} />
                  <button onClick={() => deleteProvider(item.id, type)}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-danger-light text-slate-400 hover:text-danger flex items-center justify-center transition-all">
                    <TrashIcon size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={type === "mobile" ? 5 : 4} className="text-center py-10 text-slate-400 text-[13px]">No {type === "bank" ? "banks" : "providers"} added yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  if (isLoading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={load} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><RefreshIcon size={14} /></button>
      </div>
      <ProviderTable items={banks} type="bank" />
      <ProviderTable items={mobileProv} type="mobile" />
      {formModal && (
        <ProviderFormModal type={formModal.type} provider={formModal.provider} onClose={() => setFormModal(null)} onSaved={load} />
      )}
    </div>
  );
}

// ─── Tab: Broadcast ───────────────────────────────────────────────────────────

function BroadcastTab() {
  const [form, setForm] = useState({ title: "", target_audience: "all", notif_type: "info", message: "" });
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [broadcasts, setBroadcasts] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const set = (k: keyof typeof form) => (v: string) => setForm(p => ({ ...p, [k]: v }));
  const canSend = form.title.trim() && form.message.trim();

  useEffect(() => {
    apiGet(API_ENDPOINTS.ADMIN.BROADCAST)
      .then(res => setBroadcasts(toArray(res).slice(0, 10)))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  async function send() {
    if (!canSend) return;
    setSending(true);
    try {
      const res = await apiPost(API_ENDPOINTS.ADMIN.BROADCAST, { title: form.title, message: form.message, target_audience: form.target_audience, notif_type: form.notif_type });
      setBroadcasts(prev => [res, ...prev].slice(0, 10));
      setForm({ title: "", target_audience: "all", notif_type: "info", message: "" });
      setJustSent(true);
      setTimeout(() => setJustSent(false), 3000);
    } catch {
    } finally { setSending(false); }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="font-bold text-[14px] text-slate-800 mb-4">Compose Notification</div>
        <div className="space-y-3 mb-5">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Title</label>
            <input className="input-field" placeholder="Notification title…" value={form.title} onChange={e => set("title")(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Target Audience</label>
              <select className="input-field" value={form.target_audience} onChange={e => set("target_audience")(e.target.value)}>
                <option value="all">All Users</option>
                <option value="active_investors">Active Investors</option>
                <option value="new_users">New Users (&lt;30 days)</option>
                <option value="failed_deductions">Users with Failed Deductions</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Type</label>
              <select className="input-field" value={form.notif_type} onChange={e => set("notif_type")(e.target.value)}>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="announcement">Announcement</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Message</label>
            <textarea className="input-field resize-none" rows={5} placeholder="Write your message…" value={form.message} onChange={e => set("message")(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="btn-outline flex-1 text-[13px]!" onClick={() => setForm({ title: "", target_audience: "all", notif_type: "info", message: "" })}>Clear</button>
          <button
            className={`flex-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all text-white ${justSent ? "bg-success" : canSend ? "bg-brand-500 hover:bg-brand-600" : "bg-slate-200 cursor-not-allowed"}`}
            disabled={(!canSend && !justSent) || sending}
            onClick={send}
          >
            {justSent ? "✓ Sent!" : sending ? "Sending…" : "Send Notification"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="font-bold text-[14px] text-slate-800 mb-4">Broadcast History</div>
        {loadingHistory ? (
          <div className="text-[13px] text-slate-400">Loading…</div>
        ) : broadcasts.length === 0 ? (
          <div className="text-[13px] text-slate-400">No broadcasts sent yet.</div>
        ) : (
          <div className="space-y-3">
            {broadcasts.map((b: any) => (
              <div key={b.id} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="text-[13px] font-semibold text-slate-800">{b.title}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${b.notif_type === "warning" ? "bg-warning-light text-warning" : b.notif_type === "maintenance" ? "bg-danger-light text-danger" : "bg-brand-100 text-brand-500"}`}>
                    {b.notif_type || "info"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mb-2">
                  → {b.target_audience?.replace("_", " ") || "All Users"} · {fmtDate(b.sent_at || b.created_at)}
                </div>
                <div className="text-[12px] text-slate-500 line-clamp-2">{b.message}</div>
                {b.reach_count != null && (
                  <div className="text-[11px] font-semibold text-slate-400 mt-2">{b.reach_count} users reached</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Platform Settings ───────────────────────────────────────────────────

const CURRENCIES = [
  { code: "TZS", symbol: "TSh", label: "Tanzanian Shilling" },
];

function PlatformSettingsTab() {
  const [settings, setSettings] = useState({
    min_saving_duration_months: 4,
    max_goals_per_user: 10,
    platform_fee_percentage: 3,
    maintenance_mode_enabled: false,
    bank_linking_enabled: true,
    mobile_money_enabled: true,
    default_currency: "TZS",
  });
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet(API_ENDPOINTS.ADMIN.SETTINGS)
      .then(res => setSettings(prev => ({ ...prev, ...res })))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function save() {
    try {
      await apiPatch(API_ENDPOINTS.ADMIN.SETTINGS, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { }
  }

  const SCard = ({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-4">
      <div className="font-bold text-[14px] text-slate-800 mb-0.5">{title}</div>
      <p className="text-[11px] text-slate-400 mb-4">{desc}</p>
      {children}
    </div>
  );

  if (isLoading) return <Spinner />;

  return (
    <div className="max-w-150">
      <SCard title="Saving Rules" desc="Platform-wide constraints applied to all users.">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Min. Duration (months)</label>
            <input className="input-field" type="number" min={1} value={settings.min_saving_duration_months}
              onChange={e => setSettings(p => ({ ...p, min_saving_duration_months: +e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Max Goals per User</label>
            <input className="input-field" type="number" min={1} value={settings.max_goals_per_user}
              onChange={e => setSettings(p => ({ ...p, max_goals_per_user: +e.target.value }))} />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block mb-1">Platform Fee (%)</label>
            <input className="input-field" type="number" min={0} step={0.1} value={settings.platform_fee_percentage}
              onChange={e => setSettings(p => ({ ...p, platform_fee_percentage: +e.target.value }))} />
          </div>
        </div>
      </SCard>

      <SCard title="Payment Methods" desc="Enable or disable funding source types platform-wide.">
        <div className="space-y-1">
          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-[13px] font-semibold text-slate-800">Bank Account Linking</div>
              <div className="text-[11px] text-slate-400">Allow users to connect bank accounts</div>
            </div>
            <Toggle on={settings.bank_linking_enabled} onToggle={() => setSettings(p => ({ ...p, bank_linking_enabled: !p.bank_linking_enabled }))} />
          </div>
          <div className="flex items-center justify-between py-3 border-t border-slate-100">
            <div>
              <div className="text-[13px] font-semibold text-slate-800">Mobile Money Linking</div>
              <div className="text-[11px] text-slate-400">Allow users to connect M-Pesa, MTN, Airtel Money, etc.</div>
            </div>
            <Toggle on={settings.mobile_money_enabled} onToggle={() => setSettings(p => ({ ...p, mobile_money_enabled: !p.mobile_money_enabled }))} />
          </div>
        </div>
      </SCard>

      <SCard title="Platform Currency" desc="Set the default currency displayed across the platform for all users.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CURRENCIES.map(c => (
            <button
              key={c.code}
              onClick={() => setSettings(p => ({ ...p, default_currency: c.code }))}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                settings.default_currency === c.code
                  ? "border-brand-500 bg-brand-50"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <span className={`text-[18px] font-extrabold w-8 shrink-0 ${settings.default_currency === c.code ? "text-brand-500" : "text-slate-400"}`}>
                {c.symbol}
              </span>
              <div>
                <div className={`text-[13px] font-bold ${settings.default_currency === c.code ? "text-brand-600" : "text-slate-700"}`}>{c.code}</div>
                <div className="text-[11px] text-slate-400">{c.label}</div>
              </div>
              {settings.default_currency === c.code && (
                <span className="ml-auto shrink-0 text-brand-500"><CheckIcon size={14} /></span>
              )}
            </button>
          ))}
        </div>
      </SCard>

      <div className="bg-white rounded-2xl border-2 border-danger-light shadow-sm p-5 mb-5">
        <div className="font-bold text-[14px] text-danger mb-0.5">Maintenance Mode</div>
        <p className="text-[11px] text-slate-400 mb-4">When enabled, all non-admin users see a maintenance page and cannot access platform features.</p>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-semibold text-slate-800">
              {settings.maintenance_mode_enabled ? "Maintenance is ON — platform is offline for users" : "Platform is running normally"}
            </div>
            <div className="text-[11px] text-slate-400">Toggle to bring the platform offline or online</div>
          </div>
          <Toggle on={settings.maintenance_mode_enabled} onToggle={() => setSettings(p => ({ ...p, maintenance_mode_enabled: !p.maintenance_mode_enabled }))} />
        </div>
        {settings.maintenance_mode_enabled && (
          <div className="mt-3 bg-danger-light rounded-xl px-4 py-3 text-[12px] text-danger font-semibold flex items-center gap-2">
            <AlertIcon size={13} /> Users currently cannot access the platform.
          </div>
        )}
      </div>

      <button onClick={save}
        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${saved ? "bg-success text-white" : "bg-brand-500 hover:bg-brand-600 text-white"}`}>
        {saved && <CheckIcon size={13} />}
        {saved ? "Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

// ─── Nav config ───────────────────────────────────────────────────────────────

const TAB_TITLES: Record<AdminTab, string> = {
  overview: "Overview",
  users: "User Management",
  goals: "Goals",
  funds: "Investment Funds",
  transactions: "Transaction History",
  withdrawals: "Withdrawal Requests",
  providers: "Payment Providers",
  broadcast: "Broadcast Notifications",
  settings: "Platform Settings",
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const [withdrawalBadge, setWithdrawalBadge] = useState(0);
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        setAdminUser({ name: u.full_name || "Admin", email: u.email || "" });
      }
    } catch { }
    // Pre-fetch pending withdrawal count
    apiGet(`${API_ENDPOINTS.ADMIN.WITHDRAWALS}?status=pending`)
      .then(res => setWithdrawalBadge(toArray(res).length))
      .catch(() => {});
  }, []);

  const NAV: { id: AdminTab; label: string; Icon: React.FC<{ size?: number }>; badge?: number }[] = [
    { id: "overview", label: "Overview", Icon: GridIcon },
    { id: "users", label: "Users", Icon: UsersIcon },
    { id: "goals", label: "Goals", Icon: TargetIcon },
    { id: "funds", label: "Investment Funds", Icon: CoinsIcon },
    { id: "transactions", label: "Transactions", Icon: ArrowsIcon },
    { id: "withdrawals", label: "Withdrawals", Icon: DownloadIcon, badge: withdrawalBadge || undefined },
    { id: "providers", label: "Payment Providers", Icon: BuildingIcon },
    { id: "broadcast", label: "Broadcast", Icon: BellIcon },
    { id: "settings", label: "Platform Settings", Icon: GearIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-slate-900/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`w-60 shrink-0 bg-slate-900 min-h-screen flex flex-col fixed top-0 left-0 z-30 transition-transform duration-200 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
                <WalletIcon size={15} />
              </div>
              <span className="font-extrabold text-white text-[15px] tracking-tight">SaveWise</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white p-1">
              <XIcon size={18} />
            </button>
          </div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-10">Admin Panel</div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ id, label, Icon, badge }) => (
            <button key={id} onClick={() => { setTab(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all text-left ${tab === id ? "bg-brand-500 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
              <Icon size={15} />
              <span className="flex-1">{label}</span>
              {badge != null && badge > 0 && (
                <span className="bg-warning text-white text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shrink-0">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-5 border-t border-white/10 pt-4 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-[11px] font-extrabold shrink-0">
              {adminUser?.name ? adminUser.name[0].toUpperCase() : "A"}
            </div>
            <div className="overflow-hidden">
              <div className="text-[12px] font-semibold text-white leading-none mb-0.5 truncate">{adminUser?.name || "Admin"}</div>
              <div className="text-[10px] text-slate-500 truncate">{adminUser?.email || ""}</div>
            </div>
          </div>
          <Link href="/dashboard"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold text-slate-400 hover:bg-white/5 hover:text-white transition-all">
            <LogOutIcon size={14} /> Back to App
          </Link>
        </div>
      </aside>

      <main className="flex-1 ml-0 md:ml-60 min-h-screen flex flex-col">
        <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-slate-100 px-4 sm:px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500 hover:text-slate-700 p-1">
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-extrabold text-slate-800">{TAB_TITLES[tab]}</h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">SaveWise Admin · {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setTab("broadcast")} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                <BellIcon size={16} />
              </button>
            </div>
            <div className="w-9 h-9 rounded-xl bg-brand-500 text-white flex items-center justify-center text-[12px] font-extrabold">
              {adminUser?.name ? adminUser.name[0].toUpperCase() : "A"}
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-8">
          {tab === "overview" && <OverviewTab />}
          {tab === "users" && <UsersTab />}
          {tab === "goals" && <GoalsTab />}
          {tab === "funds" && <FundsTab />}
          {tab === "transactions" && <TransactionsTab />}
          {tab === "withdrawals" && <WithdrawalsTab onBadgeChange={setWithdrawalBadge} />}
          {tab === "providers" && <PaymentProvidersTab />}
          {tab === "broadcast" && <BroadcastTab />}
          {tab === "settings" && <PlatformSettingsTab />}
        </div>
      </main>
    </div>
  );
}
