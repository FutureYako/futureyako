"use client";

import { useState, useEffect, useRef } from "react";
import { CheckIcon, BankIcon, PhoneIcon, UserIcon, SettingsIcon, WalletIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api";
import { useSettings } from "@/lib/settings-context";
import { useWebSocket } from "@/lib/websocket";

// ─── Inline icons ─────────────────────────────────────────────────────────────

const TrashIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);
const CameraIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "profile" | "account";

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string;
  date_of_birth: string | null;
  location: string;
  bio: string;
  avatar: string | null;
  avatar_color: string;
  member_status: string;
  initials: string;
  wallet_number: string | null;
  created_at: string;
}

interface FundingSource {
  id: string;
  source_type: "bank" | "mobile";
  name: string;
  masked_identifier: string;
  account_holder_name: string;
  is_primary: boolean;
  status: string;
}

interface SavingPref {
  amount_type: string;
  amount: number;
  frequency: string;
  duration_months: number;
}

interface Goal {
  id: string;
  name: string;
  type: string;
  current: number;
  target: number;
  status: string;
}

interface GoalData {
  id: string;
  current: number;
  status: string;
}

const TABS: { id: Tab; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "profile", label: "Profile", Icon: UserIcon },
  { id: "account", label: "Account", Icon: SettingsIcon },
];

const AVATAR_COLORS = [
  { bg: "bg-brand-500", hex: "#6c63ff" },
  { bg: "bg-teal-500", hex: "#14b8a6" },
  { bg: "bg-sky-500", hex: "#0ea5e9" },
  { bg: "bg-success", hex: "#22c55e" },
  { bg: "bg-warning", hex: "#f59e0b" },
  { bg: "bg-danger", hex: "#ef4444" },
  { bg: "bg-indigo-600", hex: "#4f46e5" },
  { bg: "bg-slate-700", hex: "#334155" },
];

const BANK_OPTIONS = [
  "Chase Bank", "Bank of America", "Wells Fargo",
  "Citibank", "US Bank", "Capital One", "TD Bank", "PNC Bank",
];

const PROVIDER_OPTIONS = [
  "M-Pesa", "Airtel Money", "MTN Mobile Money",
  "Tigo Pesa", "Orange Money", "Wave",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useSaved(): [boolean, () => void] {
  const [saved, setSaved] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  function trigger() {
    if (t.current) clearTimeout(t.current);
    setSaved(true);
    t.current = setTimeout(() => setSaved(false), 2500);
  }
  return [saved, trigger];
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionCard({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 mb-4">
      <div className="font-bold text-[15px] text-slate-800 mb-0.5">{title}</div>
      {desc && <p className="text-[12px] text-slate-400 mb-4">{desc}</p>}
      {!desc && <div className="mb-4" />}
      {children}
    </div>
  );
}

function SaveBtn({ saved, onClick, label = "Save Changes", loading = false }: { saved: boolean; onClick: () => void; label?: string; loading?: boolean }) {
  return (
    <button
      className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
        saved ? "bg-success text-white" : "bg-brand-500 hover:bg-brand-600 text-white"
      }`}
      onClick={onClick}
      disabled={loading}
    >
      {saved && <CheckIcon size={13} />}
      {saved ? "Saved!" : loading ? "Saving..." : label}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative card w-full max-w-110 z-10 max-h-[92vh] overflow-y-auto p-7">
        {children}
      </div>
    </div>
  );
}

function AddAccountModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [type, setType] = useState<"bank" | "mobile">("bank");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [holderName, setHolderName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canAdd = name.trim() !== "" && number.trim() !== "" && holderName.trim() !== "";

  async function handleAdd() {
    setIsSaving(true);
    setError(null);
    try {
      await apiPost(API_ENDPOINTS.WALLETS.FUNDING_SOURCES, {
        source_type: type,
        name: name,
        account_identifier: number,
        account_holder_name: holderName,
        is_primary: false,
      });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to link account");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-slate-800">Link New Account</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
      </div>
      <div className="flex bg-slate-100 rounded-lg p-1 gap-1 mb-4">
        {(["bank", "mobile"] as const).map((t) => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-all ${type === t ? "bg-brand-500 text-white" : "text-slate-500 hover:text-slate-700"}`}>
            {t === "bank" ? "Bank Account" : "Mobile Money"}
          </button>
        ))}
      </div>
      <div className="space-y-3 mb-5">
        <div>
          <label className="label-sm">{type === "bank" ? "Bank Name" : "Provider"}</label>
          {type === "bank" ? (
            <select className="input-field" value={name} onChange={(e) => setName(e.target.value)}>
              <option value="">Select your bank…</option>
              {BANK_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          ) : (
            <select className="input-field" value={name} onChange={(e) => setName(e.target.value)}>
              <option value="">Select your provider…</option>
              {PROVIDER_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}
        </div>
        <div>
          <label className="label-sm">{type === "bank" ? "Account Number" : "Phone Number"}</label>
          <input className="input-field" placeholder={type === "bank" ? "Enter account number" : "+1 (555) 000-0000"} value={number} onChange={(e) => setNumber(e.target.value)} />
        </div>
        <div>
          <label className="label-sm">Account Holder Name</label>
          <input className="input-field" placeholder="Name on the account" value={holderName} onChange={(e) => setHolderName(e.target.value)} />
        </div>
      </div>
      {error && <div className="text-[12px] text-danger mb-3">{error}</div>}
      <div className="flex gap-3">
        <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
        <button className="btn-primary flex-2" disabled={!canAdd || isSaving} onClick={handleAdd}>
          {isSaving ? "Linking..." : "Link Account"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Tab: Profile ─────────────────────────────────────────────────────────────

function ProfileTab({ user, onRefresh }: { user: UserProfile; onRefresh: () => void }) {
  const [avatarColor, setAvatarColor] = useState(user.avatar_color || "#6c63ff");
  const [form, setForm] = useState({
    name: user.full_name || "",
    email: user.email || "",
    phone: user.phone_number || "",
    dob: user.date_of_birth || "",
    location: user.location || "",
    bio: user.bio || "",
  });
  const [saved, triggerSave] = useSaved();
  const [isSaving, setIsSaving] = useState(false);
  const set = (k: keyof typeof form) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    setIsSaving(true);
    try {
      await apiPatch(API_ENDPOINTS.USER.PROFILE, {
        full_name: form.name,
        phone_number: form.phone,
        date_of_birth: form.dob || null,
        location: form.location,
        bio: form.bio,
        avatar_color: avatarColor,
      });
      triggerSave();
      onRefresh();
    } catch (err) {
      console.error("Failed to save profile:", err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <SectionCard title="Profile Photo" desc="Choose a colour or upload a custom avatar.">
        <div className="flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-full text-white flex items-center justify-center text-2xl font-extrabold shrink-0"
            style={{ background: avatarColor }}
          >
            {user.initials || "?"}
          </div>
          <div>
            <div className="flex flex-wrap gap-2 mb-3">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setAvatarColor(c.hex)}
                  className={`w-7 h-7 rounded-full transition-all ${c.bg} ${avatarColor === c.hex ? "ring-2 ring-offset-2 ring-slate-500 scale-110" : "hover:scale-110"}`}
                />
              ))}
            </div>
            <button className="flex items-center gap-2 text-[13px] text-brand-500 font-semibold hover:underline">
              <CameraIcon size={13} /> Upload photo
            </button>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Personal Information" desc="Update your name, contact details, and bio.">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label-sm">Full Name</label>
            <input className="input-field" value={form.name} onChange={(e) => set("name")(e.target.value)} />
          </div>
          <div>
            <label className="label-sm">Email Address</label>
            <input className="input-field bg-slate-50" type="email" value={form.email} readOnly />
          </div>
          <div>
            <label className="label-sm">Phone Number</label>
            <input className="input-field" type="tel" value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
          </div>
          <div>
            <label className="label-sm">Date of Birth</label>
            <input className="input-field" type="date" value={form.dob} onChange={(e) => set("dob")(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-sm">Location</label>
            <input className="input-field" placeholder="City, Country" value={form.location} onChange={(e) => set("location")(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="label-sm">Bio</label>
            <textarea className="input-field resize-none" rows={3} value={form.bio} onChange={(e) => set("bio")(e.target.value)} />
          </div>
        </div>
        <SaveBtn saved={saved} onClick={handleSave} loading={isSaving} />
      </SectionCard>
    </>
  );
}

// ─── Tab: Account ─────────────────────────────────────────────────────────────

function AccountTab({ fundingSources, savingPrefs, onRefresh }: { fundingSources: FundingSource[]; savingPrefs: SavingPref | null; onRefresh: () => void }) {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);
  const [prefsSaved, triggerPrefsSave] = useSaved();
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);

  const [prefsForm, setPrefsForm] = useState({
    amount: String(savingPrefs?.amount || 10),
    type: (savingPrefs?.amount_type === "Fixed Amount" ? "Fixed Amount" : "Percentage"),
    freq: savingPrefs?.frequency || "Monthly",
    duration: String(savingPrefs?.duration_months || 6),
  });

  function setPrimary(id: string) {
    apiPatch(`${API_ENDPOINTS.WALLETS.FUNDING_SOURCES}${id}/`, { is_primary: true })
      .then(() => onRefresh())
      .catch(() => {});
  }

  function removeAccount(id: string) {
    apiDelete(`${API_ENDPOINTS.WALLETS.FUNDING_SOURCES}${id}/`)
      .then(() => onRefresh())
      .catch(() => {});
  }

  async function handleSavePrefs() {
    setIsSavingPrefs(true);
    try {
      await apiPatch(API_ENDPOINTS.AUTOSAVE.PREFERENCES, {
        amount_type: prefsForm.type,
        amount: parseFloat(prefsForm.amount),
        frequency: prefsForm.freq,
        duration_months: parseInt(prefsForm.duration),
      });
      triggerPrefsSave();
      setTimeout(() => setEditingPrefs(false), 1500);
      onRefresh();
    } catch (err) {
      console.error("Failed to save prefs:", err);
    } finally {
      setIsSavingPrefs(false);
    }
  }


  return (
    <>
      <SectionCard title="Linked Accounts" desc="Manage the funding sources connected to your wallet.">
        {fundingSources.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-sm">No linked accounts</div>
        ) : (
          <div className="divide-y divide-slate-100 mb-4">
            {fundingSources.map((a) => {
              const Icon = a.source_type === "bank" ? BankIcon : PhoneIcon;
              return (
                <div key={a.id} className="flex items-center justify-between py-3.5 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.source_type === "bank" ? "bg-brand-100 text-brand-500" : "bg-teal-100 text-teal-600"}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-slate-800">{a.name}</span>
                        {a.is_primary && <span className="text-[10px] bg-brand-100 text-brand-500 font-bold px-1.5 py-0.5 rounded-full">Primary</span>}
                      </div>
                      <div className="text-[11px] text-slate-400">{a.masked_identifier}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {!a.is_primary && (
                      <button onClick={() => setPrimary(a.id)} className="text-[12px] text-brand-500 font-semibold hover:underline">
                        Set primary
                      </button>
                    )}
                    <button onClick={() => removeAccount(a.id)} className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-danger-light text-slate-400 hover:text-danger flex items-center justify-center transition-all">
                      <TrashIcon size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <button className="btn-outline w-auto! text-[13px]" onClick={() => setShowAddAccount(true)}>
          + Link New Account
        </button>
      </SectionCard>

      <SectionCard title="Saving Preferences" desc="Adjust your auto-save amount, frequency, and duration.">
        {!editingPrefs ? (
          <div className="divide-y divide-slate-100">
            {[
              { label: "Amount", val: `${prefsForm.amount}${prefsForm.type === "Percentage" ? "% of income" : " (fixed)"}` },
              { label: "Frequency", val: prefsForm.freq },
              { label: "Duration", val: `${prefsForm.duration} months` },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-center py-3">
                <span className="text-[13px] text-slate-500">{r.label}</span>
                <span className="text-[13px] font-semibold text-slate-800">{r.val}</span>
              </div>
            ))}
            <div className="pt-4">
              <button className="btn-outline w-auto! text-[13px]" onClick={() => setEditingPrefs(true)}>
                Edit Preferences
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="label-sm">Amount Type</label>
              <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                {(["Percentage", "Fixed Amount"] as const).map((t) => (
                  <button key={t} onClick={() => setPrefsForm((p) => ({ ...p, type: t }))}
                    className={`flex-1 py-1.5 rounded-md text-[13px] font-medium transition-all ${prefsForm.type === t ? "bg-brand-500 text-white" : "text-slate-500"}`}>
                    {t === "Percentage" ? "Percentage" : "Fixed Amount"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-sm">{prefsForm.type === "Percentage" ? "Percentage of Income" : "Fixed Amount per Cycle"}</label>
              <div className="flex items-center gap-2">
                <input className="input-field w-28!" type="number" value={prefsForm.amount}
                  onChange={(e) => setPrefsForm((p) => ({ ...p, amount: e.target.value }))} />
                <span className="text-slate-500 text-sm">{prefsForm.type === "Percentage" ? "% of income" : "per cycle"}</span>
              </div>
            </div>
            <div>
              <label className="label-sm">Frequency</label>
              <div className="flex flex-wrap gap-1.5">
                {["Daily", "Weekly", "Monthly", "Every 2 Months"].map((f) => (
                  <button key={f} onClick={() => setPrefsForm((p) => ({ ...p, freq: f }))}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border-[1.5px] transition-all ${prefsForm.freq === f ? "border-brand-500 text-brand-500 bg-brand-50" : "border-slate-200 text-slate-500 bg-white hover:border-slate-300"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label-sm">Duration (months, min 4)</label>
              <input className="input-field w-28!" type="number" min={4} value={prefsForm.duration}
                onChange={(e) => setPrefsForm((p) => ({ ...p, duration: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-1">
              <button className="btn-outline flex-1 text-[13px]!" onClick={() => setEditingPrefs(false)}>Cancel</button>
              <SaveBtn saved={prefsSaved} onClick={handleSavePrefs} loading={isSavingPrefs} label="Save Preferences" />
            </div>
          </div>
        )}
      </SectionCard>

      {showAddAccount && <AddAccountModal onClose={() => setShowAddAccount(false)} onSaved={onRefresh} />}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { formatCurrency, t } = useSettings();
  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [fundingSources, setFundingSources] = useState<FundingSource[]>([]);
  const [savingPrefs, setSavingPrefs] = useState<SavingPref | null>(null);
  const [totalSaved, setTotalSaved] = useState(0);
  const [goalsCompleted, setGoalsCompleted] = useState(0);
  const [activeGoals, setActiveGoals] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [goalsData, setGoalsData] = useState<GoalData[]>([]);

  // WebSocket connection for real-time updates
  const { isConnected: goalsConnected, subscribe: subscribeToGoals } = useWebSocket('goals');

  useEffect(() => {
    loadProfileData();
    const interval = setInterval(loadProfileData, 30000); // Refresh every 30 seconds as fallback
    
    // Refresh when tab becomes visible (user switches back to profile)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadProfileData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Subscribe to goal updates via WebSocket (only if connected)
    let unsubscribeGoalUpdate: (() => void) | null = null;
    let unsubscribeContribution: (() => void) | null = null;
    
    if (goalsConnected) {
      unsubscribeGoalUpdate = subscribeToGoals('goal_update', (data: any) => {
        // Update total saved when goals are updated
        setTotalSaved((prev: number) => {
          const goalIndex = goalsData.findIndex((g: GoalData) => g.id === data.id);
          if (goalIndex !== -1) {
            const oldCurrent = parseFloat(String(goalsData[goalIndex].current || 0));
            const newCurrent = parseFloat(String(data.current || 0));
            return prev - oldCurrent + newCurrent;
          }
          return prev;
        });
        
        // Update goals data
        setGoalsData((prev: GoalData[]) => prev.map((g: GoalData) => 
          g.id === data.id ? { ...g, current: parseFloat(String(data.current)), status: data.status } : g
        ));
      });

      unsubscribeContribution = subscribeToGoals('contribution_received', (data: any) => {
        // Refresh data when contribution is received
        loadProfileData();
      });
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (unsubscribeGoalUpdate) unsubscribeGoalUpdate();
      if (unsubscribeContribution) unsubscribeContribution();
    };
  }, [subscribeToGoals, goalsConnected]);

  const loadProfileData = async () => {
    if (!localStorage.getItem("access_token")) {
      setIsLoading(false);
      return;
    }

    try {
      const [userRes, sourcesRes, prefsRes, goalsRes] = await Promise.all([
        apiGet(API_ENDPOINTS.USER.PROFILE),
        apiGet(API_ENDPOINTS.WALLETS.FUNDING_SOURCES),
        apiGet(API_ENDPOINTS.AUTOSAVE.PREFERENCES).catch(() => null),
        apiGet(API_ENDPOINTS.GOALS.LIST).catch(() => null),
      ]);

      setUser(userRes);

      const sources = (sourcesRes.results || sourcesRes || []).filter(
        (s: any) => s.status !== "inactive"
      );
      setFundingSources(sources);

      if (prefsRes) {
        const amountType = prefsRes.amount_type === "Fixed Amount" ? "Fixed Amount" : "Percentage";
        const freq = prefsRes.frequency || "Monthly";
        setSavingPrefs({
          amount_type: amountType,
          amount: parseFloat(prefsRes.amount) || 0,
          frequency: freq,
          duration_months: prefsRes.duration_months || 6,
        });
      }

      if (goalsRes) {
        const goals = goalsRes.results || goalsRes || [];
        setActiveGoals(goals.filter((g: Goal) => g.status === "active").length);
        setGoalsCompleted(goals.filter((g: Goal) => g.status === "completed").length);
        setTotalSaved(goals.filter((g: Goal) => g.status === "active").reduce((s: number, g: Goal) => s + (g.current || 0), 0));
        setGoalsData(goals.map((g: Goal) => ({ id: g.id, current: g.current, status: g.status })));
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-100">
        <div className="text-slate-500">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 sm:p-8 flex items-center justify-center min-h-100">
        <div className="text-slate-500">Please log in to view your profile.</div>
      </div>
    );
  }

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "N/A";

  const stats = [
    { label: t("profile.total_saved"), val: formatCurrency(totalSaved), color: "text-brand-500" },
    { label: t("profile.goals_completed"), val: String(goalsCompleted), color: "text-success" },
    { label: t("profile.active_goals"), val: String(activeGoals), color: "text-slate-800" },
    { label: t("profile.member_since"), val: memberSince, color: "text-slate-600" },
  ];

  return (
    <div className="p-4 sm:p-8 max-w-200 mx-auto w-full">
      {/* Hero */}
      <div className="card p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-5 mb-5">
          <div
            className="w-16 h-16 rounded-full text-white flex items-center justify-center text-xl font-extrabold shrink-0"
            style={{ background: user.avatar_color || "#6c63ff" }}
          >
            {user.initials || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-extrabold text-slate-800">{user.full_name}</div>
            <div className="text-sm text-slate-500">{user.email}</div>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="bg-brand-100 text-brand-500 text-[11px] font-bold px-2.5 py-0.5 rounded-full">SaveWise {t("profile.member")}</span>
              {user.wallet_number && (
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <WalletIcon size={11} /> {user.wallet_number}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
              <div className="text-[11px] text-slate-400 mb-0.5">{s.label}</div>
              <div className={`text-base font-extrabold ${s.color}`}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] font-semibold transition-all ${
              tab === id ? "bg-white text-brand-500 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === "profile" && <ProfileTab user={user} onRefresh={loadProfileData} />}
      {tab === "account" && <AccountTab key={savingPrefs?.amount || "no-prefs"} fundingSources={fundingSources} savingPrefs={savingPrefs} onRefresh={loadProfileData} />}
    </div>
  );
}
