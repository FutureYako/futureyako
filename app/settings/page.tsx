"use client";

import { useState, useEffect, useRef } from "react";
import { CheckIcon, EyeIcon, BellIcon, SettingsIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPatch, apiPost, apiDelete } from "@/lib/api";
import { useSettings, Currency, Language, Theme } from "@/lib/settings-context";

// ─── Inline icons ─────────────────────────────────────────────────────────────

const ShieldIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const LockIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const MonitorIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);
const LogOutIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const DownloadIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const TrashIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "notifications" | "security" | "preferences" | "privacy";

interface NotificationPrefs {
  autosave_ok: boolean;
  autosave_fail: boolean;
  wallet_updates: boolean;
  goal_milestone: boolean;
  goal_deadline: boolean;
  weekly_report: boolean;
  newsletter: boolean;
  product_updates: boolean;
}

interface LoginSession {
  id: string;
  device_name: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

interface LoginHistoryItem {
  id: string;
  device: string;
  location: string;
  login_at: string;
  is_successful: boolean;
}

const TABS: { id: Tab; label: string; Icon: React.FC<{ size?: number }> }[] = [
  { id: "notifications", label: "Notifications", Icon: BellIcon },
  { id: "security", label: "Security", Icon: ShieldIcon },
  { id: "preferences", label: "Preferences", Icon: SettingsIcon },
  { id: "privacy", label: "Privacy & Data", Icon: LockIcon },
];

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "TZS", label: "TZS (TSh)" },
];

const LANGUAGES: { value: Language; label: string }[] = [
  { value: "en-us", label: "English (US)" },
  { value: "en-gb", label: "English (UK)" },
  { value: "fr", label: "French" },
  { value: "es", label: "Spanish" },
  { value: "sw", label: "Swahili" },
  { value: "ar", label: "Arabic" },
];

const THEMES: { value: Theme; label: string }[] = [
  { value: "Light", label: "Light" },
  { value: "Dark", label: "Dark" },
  { value: "System", label: "System" },
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

function pwStrength(pw: string) {
  if (!pw) return null;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const labels = ["Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-danger", "bg-warning", "bg-yellow-400", "bg-success"];
  const text = ["text-danger", "text-warning", "text-yellow-500", "text-success"];
  return { score: s, label: labels[s - 1] ?? "Weak", barColor: colors[s - 1] ?? "bg-danger", textColor: text[s - 1] ?? "text-danger" };
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${on ? "bg-brand-500" : "bg-slate-200"}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${on ? "left-5" : "left-0.5"}`} />
    </button>
  );
}

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

function PasswordInput({
  label, value, onChange, show, onToggleShow, placeholder = "••••••••",
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggleShow: () => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="label-sm">{label}</label>
      <div className="relative">
        <input
          className="input-field pr-11!"
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <EyeIcon size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

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

function ChangePasswordModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const strength = pwStrength(form.next);
  const canSave = form.current && form.next.length >= 8 && form.next === form.confirm;

  async function handleSubmit() {
    setIsSubmitting(true);
    setError(null);
    try {
      await apiPost(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        current_password: form.current,
        new_password: form.next,
        confirm_password: form.confirm,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-slate-800">Change Password</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
      </div>
      <div className="space-y-4 mb-5">
        <PasswordInput label="Current Password" value={form.current} onChange={(v) => setForm((p) => ({ ...p, current: v }))} show={show.current} onToggleShow={() => setShow((p) => ({ ...p, current: !p.current }))} />
        <div>
          <PasswordInput label="New Password" value={form.next} onChange={(v) => setForm((p) => ({ ...p, next: v }))} show={show.next} onToggleShow={() => setShow((p) => ({ ...p, next: !p.next }))} placeholder="Min. 8 characters" />
          {strength && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className={`h-1 flex-1 rounded-full transition-all ${n <= strength.score ? strength.barColor : "bg-slate-200"}`} />
                ))}
              </div>
              <span className={`text-[11px] font-semibold ${strength.textColor}`}>{strength.label} password</span>
            </div>
          )}
        </div>
        <PasswordInput label="Confirm New Password" value={form.confirm} onChange={(v) => setForm((p) => ({ ...p, confirm: v }))} show={show.confirm} onToggleShow={() => setShow((p) => ({ ...p, confirm: !p.confirm }))} />
        {form.confirm && form.next !== form.confirm && (
          <p className="text-[11px] text-danger font-semibold">Passwords do not match.</p>
        )}
        {error && <p className="text-[11px] text-danger font-semibold">{error}</p>}
      </div>
      <div className="flex gap-3">
        <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
        <button className="btn-primary flex-2" disabled={!canSave || isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </div>
    </Modal>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const confirmed = text === "DELETE";

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await apiDelete(API_ENDPOINTS.USER.PROFILE);
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      window.location.href = "/login";
    } catch (err) {
      console.error("Failed to delete account:", err);
      setIsDeleting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-extrabold text-danger">Delete Account</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
      </div>
      <div className="bg-danger-light border border-danger/20 rounded-xl p-4 mb-5">
        <p className="text-[13px] text-slate-700 leading-relaxed">
          This will permanently delete your SaveWise account, all linked funding sources, your savings wallet, and all associated data. <strong>This action cannot be undone.</strong>
        </p>
      </div>
      <div className="mb-5">
        <label className="label-sm">Type <strong>DELETE</strong> to confirm</label>
        <input className="input-field" placeholder="DELETE" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      <div className="flex gap-3">
        <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
        <button
          disabled={!confirmed || isDeleting}
          onClick={handleDelete}
          className="flex-2 py-3 rounded-lg text-sm font-semibold transition-colors text-white disabled:opacity-40 disabled:cursor-not-allowed bg-danger hover:bg-red-600">
          {isDeleting ? "Deleting..." : "Permanently Delete"}
        </button>
      </div>
    </Modal>
  );
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────

function NotificationsTab() {
  const [notifs, setNotifs] = useState<NotificationPrefs>({
    autosave_ok: true, autosave_fail: true, wallet_updates: true,
    goal_milestone: true, goal_deadline: true, weekly_report: false,
    newsletter: false, product_updates: true,
  });
  const [saved, triggerSave] = useSaved();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotificationPrefs();
  }, []);

  async function loadNotificationPrefs() {
    try {
      const data = await apiGet(API_ENDPOINTS.USER.NOTIFICATION_PREFS);
      setNotifs({
        autosave_ok: data.autosave_ok ?? true,
        autosave_fail: data.autosave_fail ?? true,
        wallet_updates: data.wallet_updates ?? true,
        goal_milestone: data.goal_milestone ?? true,
        goal_deadline: data.goal_deadline ?? true,
        weekly_report: data.weekly_report ?? false,
        newsletter: data.newsletter ?? false,
        product_updates: data.product_updates ?? true,
      });
    } catch (err) {
      console.error("Failed to load notification prefs:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await apiPatch(API_ENDPOINTS.USER.NOTIFICATION_PREFS, notifs);
      triggerSave();
    } catch (err) {
      console.error("Failed to save notification prefs:", err);
    } finally {
      setIsSaving(false);
    }
  }

  const toggle = (k: keyof NotificationPrefs) => setNotifs((p) => ({ ...p, [k]: !p[k] }));

  const NOTIF_GROUPS = [
    {
      group: "Account Activity",
      items: [
        { key: "autosave_ok" as const, label: "Successful Auto-Save", desc: "Notified each time a deduction completes" },
        { key: "autosave_fail" as const, label: "Failed Deduction", desc: "Alert when a deduction attempt fails" },
        { key: "wallet_updates" as const, label: "Wallet Updates", desc: "Deposits, withdrawals, and wallet changes" },
      ],
    },
    {
      group: "Savings & Goals",
      items: [
        { key: "goal_milestone" as const, label: "Goal Milestones", desc: "Celebrate hitting 25%, 50%, 75%, and 100%" },
        { key: "goal_deadline" as const, label: "Deadline Reminders", desc: "Reminder 7 and 30 days before a goal deadline" },
        { key: "weekly_report" as const, label: "Weekly Savings Report", desc: "A summary of your savings activity each week" },
      ],
    },
    {
      group: "General",
      items: [
        { key: "newsletter" as const, label: "Email Newsletter", desc: "Tips, insights, and financial news" },
        { key: "product_updates" as const, label: "Product Updates", desc: "New features and improvements to SaveWise" },
      ],
    },
  ];

  if (isLoading) {
    return <div className="p-6 text-center text-slate-400">Loading...</div>;
  }

  return (
    <SectionCard title="Notification Preferences" desc="Choose what you want to be notified about and how.">
      {NOTIF_GROUPS.map(({ group, items }) => (
        <div key={group} className="mb-5">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-2">{group}</div>
          <div className="divide-y divide-slate-100">
            {items.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-3.5 gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-800">{label}</div>
                  <div className="text-[12px] text-slate-400">{desc}</div>
                </div>
                <Toggle on={notifs[key]} onToggle={() => toggle(key)} />
              </div>
            ))}
          </div>
        </div>
      ))}
      <SaveBtn saved={saved} onClick={handleSave} loading={isSaving} label="Save Preferences" />
    </SectionCard>
  );
}

// ─── Tab: Security ────────────────────────────────────────────────────────────

function SecurityTab() {
  const [showPwModal, setShowPwModal] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pwChanged, setPwChanged] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  async function loadSecurityData() {
    try {
      const [twoFaRes, sessionsRes, historyRes] = await Promise.all([
        apiGet(API_ENDPOINTS.TWO_FACTOR.STATUS).catch(() => null),
        apiGet(API_ENDPOINTS.USER.SESSIONS).catch(() => null),
        apiGet(API_ENDPOINTS.USER.LOGIN_HISTORY).catch(() => null),
      ]);

      if (twoFaRes) {
        setTwoFA(twoFaRes.is_enabled || false);
      }
      if (sessionsRes) {
        setSessions(sessionsRes.results || sessionsRes || []);
      }
      if (historyRes) {
        setHistory(historyRes.results || historyRes || []);
      }
    } catch (err) {
      console.error("Failed to load security data:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function terminateSession(id: string) {
    try {
      await apiDelete(`${API_ENDPOINTS.USER.SESSIONS}${id}/`);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Failed to terminate session:", err);
    }
  }

  if (isLoading) {
    return <div className="p-6 text-center text-slate-400">Loading...</div>;
  }

  return (
    <>
      <SectionCard title="Password" desc="Use a strong password you haven't used elsewhere.">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">Current Password</div>
            <div className="text-[12px] text-slate-400">
              {pwChanged ? "Password changed recently" : "Last changed more than 3 months ago"}
            </div>
          </div>
          <button className="btn-outline w-auto!" onClick={() => setShowPwModal(true)}>
            Change Password
          </button>
        </div>
      </SectionCard>

      <SectionCard title="Two-Factor Authentication" desc="Add an extra layer of security to your sign-in.">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-semibold text-slate-800">Authenticator App</div>
            <div className="text-[12px] text-slate-400">
              {twoFA ? "2FA is active — your account is protected." : "Not yet configured."}
            </div>
          </div>
          <Toggle on={twoFA} onToggle={() => { if (!twoFA) window.location.href = "/2fa-setup"; else setTwoFA(false); }} />
        </div>
        {twoFA && (
          <div className="flex items-center gap-2 bg-success-light rounded-lg px-3 py-2 text-[12px] text-success font-semibold">
            <CheckIcon size={12} /> Two-factor authentication is enabled
          </div>
        )}
      </SectionCard>

      <SectionCard title="Active Sessions" desc="Devices currently signed in to your account.">
        {sessions.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-sm">No active sessions found</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-3.5 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.is_current ? "bg-brand-100 text-brand-500" : "bg-slate-100 text-slate-400"}`}>
                    <MonitorIcon size={16} />
                  </div>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800 flex items-center gap-2">
                      {s.device_name}
                      {s.is_current && <span className="text-[10px] bg-success-light text-success font-bold px-1.5 py-0.5 rounded-full">This device</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">{s.location || "Unknown location"} · {new Date(s.last_active).toLocaleString()}</div>
                  </div>
                </div>
                {!s.is_current && (
                  <button
                    onClick={() => terminateSession(s.id)}
                    className="text-[12px] text-danger font-semibold hover:underline flex items-center gap-1 shrink-0"
                  >
                    <LogOutIcon size={12} /> Sign out
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Login History" desc="Recent sign-in activity on your account.">
        {history.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-sm">No login history found</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.slice(0, 10).map((h) => (
              <div key={h.id} className="flex items-start justify-between py-3 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${h.is_successful ? "bg-success" : "bg-danger"}`} />
                  <div>
                    <div className={`text-[13px] font-semibold ${h.is_successful ? "text-slate-800" : "text-danger"}`}>
                      {h.is_successful ? "Successful login" : "Failed login attempt"}
                    </div>
                    <div className="text-[11px] text-slate-400">{h.device} · {h.location || "Unknown location"}</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 shrink-0">{new Date(h.login_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {showPwModal && <ChangePasswordModal onClose={() => setShowPwModal(false)} onSuccess={() => setPwChanged(true)} />}
    </>
  );
}

// ─── Tab: Preferences ─────────────────────────────────────────────────────────

function PreferencesTab() {
  const { settings, updateSettings, isLoading } = useSettings();
  const [saved, triggerSave] = useSaved();
  const [isSaving, setIsSaving] = useState(false);

  // Local state for form
  const [currency, setCurrency] = useState(settings.currency);
  const [language, setLanguage] = useState(settings.language);
  const [theme, setTheme] = useState(settings.theme);
  const [layout, setLayout] = useState({
    stats: settings.dashboard_show_stats,
    activity: settings.dashboard_show_activity,
    goals: settings.dashboard_show_goals,
  });

  // Update local state when settings load
  useEffect(() => {
    setCurrency(settings.currency);
    setLanguage(settings.language);
    setTheme(settings.theme);
    setLayout({
      stats: settings.dashboard_show_stats,
      activity: settings.dashboard_show_activity,
      goals: settings.dashboard_show_goals,
    });
  }, [settings]);

  async function handleSaveDisplay() {
    setIsSaving(true);
    try {
      await updateSettings({
        currency,
        language,
        theme,
      });
      triggerSave();
    } catch (err) {
      console.error("Failed to save display settings:", err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveLayout() {
    setIsSaving(true);
    try {
      await updateSettings({
        dashboard_show_stats: layout.stats,
        dashboard_show_activity: layout.activity,
        dashboard_show_goals: layout.goals,
      });
      triggerSave();
    } catch (err) {
      console.error("Failed to save layout settings:", err);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="p-6 text-center text-slate-400">Loading...</div>;
  }

  return (
    <>
      <SectionCard title="Display Preferences" desc="Customise currency, language, and appearance.">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label-sm">Currency</label>
            <select className="input-field" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
              {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label-sm">Language</label>
            <select className="input-field" value={language} onChange={(e) => setLanguage(e.target.value as Language)}>
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label-sm">Theme</label>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button key={t.value} onClick={() => setTheme(t.value)}
                  className={`px-4 py-2 rounded-lg text-[13px] font-semibold border-[1.5px] transition-all ${theme === t.value ? "border-brand-500 text-brand-500 bg-brand-50" : "border-slate-200 text-slate-500 hover:border-slate-300"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <SaveBtn saved={saved} onClick={handleSaveDisplay} loading={isSaving} />
      </SectionCard>

      <SectionCard title="Dashboard Layout" desc="Choose how information is arranged on your dashboard.">
        <div className="divide-y divide-slate-100 mb-4">
          <div className="flex items-center justify-between py-3.5 gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-800">Show quick stats bar</div>
              <div className="text-[12px] text-slate-400">Display key numbers at the top of the dashboard</div>
            </div>
            <Toggle on={layout.stats} onToggle={() => setLayout((p) => ({ ...p, stats: !p.stats }))} />
          </div>
          <div className="flex items-center justify-between py-3.5 gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-800">Show recent activity feed</div>
              <div className="text-[12px] text-slate-400">A scrollable log of your latest transactions</div>
            </div>
            <Toggle on={layout.activity} onToggle={() => setLayout((p) => ({ ...p, activity: !p.activity }))} />
          </div>
          <div className="flex items-center justify-between py-3.5 gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-800">Show goal progress cards</div>
              <div className="text-[12px] text-slate-400">Visual progress cards for each savings goal</div>
            </div>
            <Toggle on={layout.goals} onToggle={() => setLayout((p) => ({ ...p, goals: !p.goals }))} />
          </div>
        </div>
        <SaveBtn saved={saved} onClick={handleSaveLayout} loading={isSaving} label="Save Layout" />
      </SectionCard>
    </>
  );
}

// ─── Tab: Privacy & Data ──────────────────────────────────────────────────────

function PrivacyTab() {
  const { settings, updateSettings } = useSettings();
  const [privacy, setPrivacy] = useState({
    analytics: settings.analytics_enabled,
    tips: settings.personalized_tips_enabled,
    marketing: settings.marketing_enabled,
  });
  const [showDelete, setShowDelete] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saved, triggerSave] = useSaved();
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setPrivacy({
      analytics: settings.analytics_enabled,
      tips: settings.personalized_tips_enabled,
      marketing: settings.marketing_enabled,
    });
  }, [settings]);

  async function handleSavePrivacy() {
    setIsSaving(true);
    try {
      await updateSettings({
        analytics_enabled: privacy.analytics,
        personalized_tips_enabled: privacy.tips,
        marketing_enabled: privacy.marketing,
      });
      triggerSave();
    } catch (err) {
      console.error("Failed to save privacy settings:", err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleExport() {
    setIsExporting(true);
    try {
      const data = await apiGet(API_ENDPOINTS.TRANSACTIONS.EXPORT);
      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `savewise-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to export data:", err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <SectionCard title="Your Data" desc="Control how SaveWise uses and stores your data.">
        <div className="divide-y divide-slate-100 mb-4">
          <div className="flex items-center justify-between py-3.5 gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-800">Analytics & Crash Reports</div>
              <div className="text-[12px] text-slate-400">Help improve SaveWise by sharing anonymous usage data</div>
            </div>
            <Toggle on={privacy.analytics} onToggle={() => setPrivacy((p) => ({ ...p, analytics: !p.analytics }))} />
          </div>
          <div className="flex items-center justify-between py-3.5 gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-800">Personalised Tips</div>
              <div className="text-[12px] text-slate-400">Receive savings tips tailored to your habits</div>
            </div>
            <Toggle on={privacy.tips} onToggle={() => setPrivacy((p) => ({ ...p, tips: !p.tips }))} />
          </div>
          <div className="flex items-center justify-between py-3.5 gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-800">Marketing Communications</div>
              <div className="text-[12px] text-slate-400">Promotional emails and in-app messages from SaveWise</div>
            </div>
            <Toggle on={privacy.marketing} onToggle={() => setPrivacy((p) => ({ ...p, marketing: !p.marketing }))} />
          </div>
        </div>
        <SaveBtn saved={saved} onClick={handleSavePrivacy} loading={isSaving} label="Save Privacy Settings" />
      </SectionCard>

      <SectionCard title="Data Export" desc="Download a copy of all your SaveWise data.">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">Export My Data</div>
            <div className="text-[12px] text-slate-400">Includes transactions, goals, and account history (JSON & CSV)</div>
          </div>
          <button className="flex items-center gap-2 w-auto! btn-outline text-[13px]!" onClick={handleExport} disabled={isExporting}>
            <DownloadIcon size={13} /> {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </SectionCard>

      <div className="card p-6 mb-4 border-2 border-danger-light">
        <div className="font-bold text-[15px] text-danger mb-0.5">Danger Zone</div>
        <p className="text-[12px] text-slate-400 mb-4">Irreversible actions — proceed with caution.</p>
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="text-sm font-semibold text-slate-800">Close Account</div>
              <div className="text-[12px] text-slate-400">Temporarily suspend your account</div>
            </div>
            <button className="w-auto! btn-outline text-[13px]!" onClick={() => alert("Contact support to close your account")}>Close Account</button>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="text-sm font-semibold text-slate-800">Delete Account</div>
              <div className="text-[12px] text-slate-400">Permanently remove your account and all data</div>
            </div>
            <button
              onClick={() => setShowDelete(true)}
              className="flex items-center gap-2 shrink-0 bg-danger hover:bg-red-600 text-white font-semibold text-[13px] px-4 py-2 rounded-lg transition-colors"
            >
              <TrashIcon size={13} /> Delete Account
            </button>
          </div>
        </div>
      </div>

      {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("notifications");

  return (
    <div className="p-8 max-w-200 mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm">Manage notifications, security, and account preferences</p>
      </div>

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

      {tab === "notifications" && <NotificationsTab />}
      {tab === "security" && <SecurityTab />}
      {tab === "preferences" && <PreferencesTab />}
      {tab === "privacy" && <PrivacyTab />}
    </div>
  );
}
