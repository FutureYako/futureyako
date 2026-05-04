"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GoalsIcon, CalendarIcon, CheckIcon, CopyIcon, ArrowIcon } from "@/components/icons";
import { API_ENDPOINTS, apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { formatTsh } from "@/lib/currency";
import { useSettings } from "@/lib/settings-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type GoalType = "savings" | "emergency" | "group";
type GroupSubType = "loop" | "wedding" | "community" | "coinvest" | "custom";
type Visibility = "public" | "invite";
type WeightType = "Percentage" | "Fixed Amount";
type ContributionModel = "open" | "split";
type WithdrawalControl = "admin" | "consensus";

interface Participant {
  id: string;
  name: string;
  initials: string;
  amount: number;
}

interface Goal {
  id: string;
  type: GoalType;
  name: string;
  target: number;
  current: number;
  deadline?: string;
  locked: boolean;
  description?: string;
  groupSubType?: GroupSubType;
  visibility?: Visibility;
  contributionModel?: ContributionModel;
  withdrawalControl?: WithdrawalControl;
  participants?: Participant[];
  myContribution?: number;
  code?: string;
  status: string;
  created_at: string;
  updated_at: string;
  weight?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addMonths(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return d.toISOString().split("T")[0];
}

function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

function isAtLeast4MonthsAway(dateIso: string): boolean {
  const min = new Date();
  min.setMonth(min.getMonth() + 4);
  return new Date(dateIso + "T00:00:00") >= min;
}

function makeCode(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function inviteUrl(code: string): string {
  return `${typeof window !== "undefined" ? window.location.origin : "https://savewise.app"}/invite?code=${code}`;
}

async function nativeShare(goal: Goal) {
  const url = inviteUrl(goal.code!);
  const shareData = { title: goal.name, text: `Join our savings goal: ${goal.name}`, url };
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(url);
    }
  } catch {
    // user cancelled or API not available
  }
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_GOALS: Goal[] = [];

const QUICK_PICKS = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "2Y", months: 24 },
  { label: "3Y", months: 36 },
  { label: "4Y", months: 48 },
  { label: "5Y", months: 60 },
];

const GROUP_SUBTYPES: { value: GroupSubType; label: string; emoji: string; desc: string }[] = [
  { value: "loop", emoji: "🔄", label: "Loop Save", desc: "Rotating group contributions" },
  { value: "wedding", emoji: "💍", label: "Wedding / Event", desc: "Celebrate a milestone" },
  { value: "community", emoji: "🤝", label: "Community", desc: "Group project or cause" },
  { value: "coinvest", emoji: "💼", label: "Co-Investment", desc: "Equal share, shared goal" },
  { value: "custom", emoji: "✨", label: "Custom", desc: "Define your own goal" },
];

const SAVINGS_PALETTES = [
  { icon: "bg-brand-100 text-brand-500", bar: "bg-brand-500" },
  { icon: "bg-sky-100 text-sky-500", bar: "bg-sky-500" },
  { icon: "bg-indigo-100 text-indigo-500", bar: "bg-indigo-500" },
  { icon: "bg-success-light text-success", bar: "bg-success" },
];

// ─── Goal dialog ──────────────────────────────────────────────────────────────

function GoalDialog({
  onClose,
  onSave,
  savingsCount,
}: {
  onClose: () => void;
  onSave: (g: Omit<Goal, "id">) => void;
  savingsCount: number;
}) {
  const [goalType, setGoalType] = useState<GoalType>("savings");

  // Savings / emergency fields
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [weightType, setWeightType] = useState<WeightType>("Percentage");
  const [weight, setWeight] = useState("20");
  const [deadline, setDeadline] = useState("");
  const [locked, setLocked] = useState(false);
  const [quickPick, setQuickPick] = useState<string | null>(null);

  // Group-specific fields
  const [groupSubType, setGroupSubType] = useState<GroupSubType>("loop");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");
  const [contributionModel, setContributionModel] = useState<ContributionModel>("open");
  const [withdrawalControl, setWithdrawalControl] = useState<WithdrawalControl>("admin");

  const isSavings = goalType === "savings";
  const isGroup = goalType === "group";

  const canSave =
    name.trim() !== "" &&
    target.trim() !== "" &&
    (isSavings ? deadline !== "" && isAtLeast4MonthsAway(deadline) && locked : true);

  function handleQuickPick(months: number, label: string) {
    setDeadline(addMonths(months));
    setQuickPick(label);
  }

  function handleSave() {
    if (isGroup) {
      onSave({
        type: "group",
        name: name.trim(),
        description: description.trim(),
        groupSubType,
        visibility,
        contributionModel,
        withdrawalControl,
        target: parseFloat(target.replace(/,/g, "")) || 0,
        current: 0,
        deadline: deadline || undefined,
        locked: false,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } else {
      const palette = SAVINGS_PALETTES[savingsCount % SAVINGS_PALETTES.length];
      onSave({
        type: goalType,
        name: name.trim(),
        target: parseFloat(target.replace(/,/g, "")) || 0,
        current: 0,
        deadline: isSavings ? deadline : undefined,
        locked: isSavings ? locked : false,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        weight: weightType === "Percentage" ? `${weight}%` : formatTsh(Number(weight) || 0),
        ...palette,
      } as Omit<Goal, "id">);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative card w-full max-w-[520px] z-10 flex flex-col max-h-[92vh] overflow-y-auto">
        <div className="p-7 pb-0">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Add a goal</h2>
              <p className="text-slate-500 text-[13px] mt-0.5">Choose a goal type to get started</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5">×</button>
          </div>

          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            {(
              [
                { value: "savings", emoji: "🎯", label: "Savings Goal", desc: "Fixed deadline · lock-in" },
                { value: "emergency", emoji: "🛡️", label: "Emergency Fund", desc: "No deadline · always accessible" },
                { value: "group", emoji: "👥", label: "Group Goal", desc: "Invite others to contribute" },
              ] as { value: GoalType; emoji: string; label: string; desc: string }[]
            ).map((t) => (
              <button
                key={t.value}
                onClick={() => setGoalType(t.value)}
                className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                  goalType === t.value
                    ? t.value === "savings"
                      ? "border-brand-500 bg-brand-50"
                      : t.value === "emergency"
                      ? "border-warning bg-warning-light"
                      : "border-teal-500 bg-teal-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="text-xl mb-1.5">{t.emoji}</div>
                <div className="font-bold text-[13px] text-slate-800">{t.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="px-7 pb-7 space-y-4">
          {/* ── Shared fields ── */}
          <div>
            <label className="label-sm">
              {isGroup ? "Group Name" : isSavings ? "Goal Name" : "Fund Name"}
            </label>
            <input
              className="input-field"
              placeholder={
                isGroup ? "e.g. Mike's Wedding Fund" : isSavings ? "e.g. Buy a Car" : "e.g. Emergency Fund"
              }
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {isGroup && (
            <div>
              <label className="label-sm">Description</label>
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Tell others what this goal is for…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="label-sm">
              Target Amount
              {goalType === "emergency" && (
                <span className="text-slate-400 font-normal ml-1">(soft target)</span>
              )}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">TSh</span>
              <input
                className="input-field !pl-14"
                placeholder="5,000.00"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
          </div>

          {/* ── Group sub-type ── */}
          {isGroup && (
            <>
              <div>
                <label className="label-sm">Group Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {GROUP_SUBTYPES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setGroupSubType(s.value)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                        groupSubType === s.value
                          ? "border-teal-500 bg-teal-50"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-lg">{s.emoji}</span>
                      <div>
                        <div className="text-[13px] font-bold text-slate-800">{s.label}</div>
                        <div className="text-[10px] text-slate-400">{s.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label-sm">Visibility</label>
                <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                  {(["public", "invite"] as Visibility[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setVisibility(v)}
                      className={`flex-1 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                        visibility === v ? "bg-teal-500 text-white" : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {v === "public" ? "🌐 Public" : "🔒 Invite Only"}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {visibility === "public"
                    ? "Anyone with the link can see and join this goal"
                    : "Only people you invite directly can join"}
                </p>
              </div>

              {/* Contribution model */}
              <div>
                <label className="label-sm">Contribution Model</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "open", emoji: "💸", label: "Open", desc: "Anyone contributes any amount" },
                    { value: "split", emoji: "⚖️", label: "Equal Split", desc: "Divide target equally per participant" },
                  ] as { value: ContributionModel; emoji: string; label: string; desc: string }[]).map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setContributionModel(m.value)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                        contributionModel === m.value ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-lg">{m.emoji}</span>
                      <div>
                        <div className="text-[13px] font-bold text-slate-800">{m.label}</div>
                        <div className="text-[10px] text-slate-400">{m.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                {contributionModel === "split" && (
                  <p className="text-[11px] text-teal-600 font-semibold mt-1.5">
                    Each person gets an equal share target. They can contribute in installments at any pace.
                  </p>
                )}
              </div>

              {/* Withdrawal control */}
              <div>
                <label className="label-sm">Withdrawal Control</label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "admin", emoji: "👤", label: "Admin Can Withdraw", desc: "Creator manages funds freely" },
                    { value: "consensus", emoji: "🤝", label: "Group Consensus", desc: "All must agree to release funds" },
                  ] as { value: WithdrawalControl; emoji: string; label: string; desc: string }[]).map((w) => (
                    <button
                      key={w.value}
                      onClick={() => setWithdrawalControl(w.value)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                        withdrawalControl === w.value ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-lg">{w.emoji}</span>
                      <div>
                        <div className="text-[13px] font-bold text-slate-800">{w.label}</div>
                        <div className="text-[10px] text-slate-400">{w.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {withdrawalControl === "admin"
                    ? "Best for events — the organiser can collect and use funds at any time."
                    : "Best for co-investments — funds are only released when all participants agree."}
                </p>
              </div>
            </>
          )}

          {/* ── Savings weight ── */}
          {!isGroup && goalType !== "emergency" && (
            <div>
              <label className="label-sm">Savings Weight</label>
              <div className="flex bg-slate-100 rounded-lg p-1 gap-1 mb-2">
                {(["Percentage", "Fixed Amount"] as WeightType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setWeightType(t)}
                    className={`flex-1 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                      weightType === t ? "bg-brand-500 text-white" : "text-slate-500"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input className="input-field !w-20" value={weight} onChange={(e) => setWeight(e.target.value)} />
                <span className="text-slate-500 text-sm">
                  {weightType === "Percentage" ? "% of total savings" : "fixed TSh per cycle"}
                </span>
              </div>
            </div>
          )}

          {/* ── Deadline ── */}
          {(isSavings || isGroup) && (
            <div>
              <label className="label-sm">
                Deadline{isGroup && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(isSavings ? QUICK_PICKS.filter((q) => q.months >= 4) : QUICK_PICKS).map(({ label, months }) => (
                  <button
                    key={label}
                    onClick={() => handleQuickPick(months, label)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                      quickPick === label
                        ? isGroup ? "bg-teal-500 text-white border-teal-500" : "bg-brand-500 text-white border-brand-500"
                        : "bg-white text-slate-500 border-slate-200 hover:border-brand-300 hover:text-brand-500"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {isSavings && (
                <p className="text-[11px] text-slate-400 mb-1.5">
                  Savings goals require a minimum 4-month deadline.
                </p>
              )}
              <div className="relative">
                <input
                  type="date"
                  className="input-field"
                  min={isSavings ? addMonths(4) : todayIso()}
                  value={deadline}
                  onChange={(e) => { setDeadline(e.target.value); setQuickPick(null); }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <CalendarIcon size={16} />
                </span>
              </div>
              {deadline && isSavings && !isAtLeast4MonthsAway(deadline) && (
                <p className="text-[11px] text-danger font-semibold mt-1">
                  Deadline must be at least 4 months from today.
                </p>
              )}
              {deadline && (!isSavings || isAtLeast4MonthsAway(deadline)) && (
                <p className={`text-[11px] font-semibold mt-1 ${isGroup ? "text-teal-500" : "text-brand-500"}`}>
                  Deadline set: {fmtDate(deadline)}
                </p>
              )}
            </div>
          )}

          {/* ── Lock-in (savings only) ── */}
          {isSavings && (
            <div
              className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${
                locked ? "border-brand-500 bg-brand-50" : "border-slate-200"
              }`}
              onClick={() => setLocked((v) => !v)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-slate-800">🔒 Lock-in Goal</div>
                  <div className="text-[12px] text-slate-400 mt-0.5">
                    Funds cannot be withdrawn before the deadline, regardless of progress
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4 ${locked ? "bg-brand-500" : "bg-slate-200"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${locked ? "left-5" : "left-0.5"}`} />
                </div>
              </div>
            </div>
          )}

          {/* ── Emergency info ── */}
          {goalType === "emergency" && (
            <div className="bg-warning-light border border-warning/30 rounded-xl p-4">
              <div className="text-sm font-bold text-warning mb-1">Always accessible</div>
              <div className="text-[12px] text-slate-600">
                Emergency funds have no deadline and can be withdrawn at any time. Never locked.
              </div>
            </div>
          )}

          {/* ── Group info ── */}
          {isGroup && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
              <div className="text-sm font-bold text-teal-600 mb-1">How group goals work</div>
              <div className="text-[12px] text-slate-600 space-y-1">
                <div>• Share the link and invite people to contribute</div>
                <div>• All contributions are visible to all participants</div>
                <div>• You manage when and how funds are released</div>
              </div>
            </div>
          )}

          {isSavings && !locked && (
            <p className="text-[11px] text-slate-400 text-center -mb-1">
              Enable <span className="font-semibold text-slate-600">Lock-in Goal</span> above to save
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
            <button className="btn-primary flex-[2]" disabled={!canSave} onClick={handleSave}>
              {isGroup ? "Create Group Goal" : "Save Goal"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Group detail modal ───────────────────────────────────────────────────────

function GroupDetailModal({ goal, onClose }: { goal: Goal; onClose: () => void }) {
  const { formatCurrency, t } = useSettings();
  const [copied, setCopied] = useState(false);
  const [contributing, setContributing] = useState(false);
  const [amount, setAmount] = useState("");
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  const url = inviteUrl(goal.code!);
  const subtype = GROUP_SUBTYPES.find((s) => s.value === goal.groupSubType);
  const isSplit = goal.contributionModel === "split";
  const participantCount = goal.participants?.length ?? 1;
  const shareTarget = isSplit && participantCount > 0 ? Math.round(goal.target / participantCount) : 0;

  function handleCopy() {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative card w-full max-w-[500px] z-10 max-h-[92vh] overflow-y-auto">
        <div className="p-7">
          {/* Header */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{subtype?.emoji ?? "👥"}</span>
                <h2 className="text-lg font-extrabold text-slate-800">{goal.name}</h2>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold bg-teal-100 text-teal-600 px-2 py-0.5 rounded-full">
                  {subtype?.label ?? "Group"}
                </span>
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {goal.visibility === "public" ? "🌐 Public" : "🔒 Invite Only"}
                </span>
                <span className="text-[11px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {goal.contributionModel === "split" ? "⚖️ Equal Split" : "💸 Open"}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  goal.withdrawalControl === "admin"
                    ? "bg-warning-light text-warning"
                    : "bg-success-light text-success"
                }`}>
                  {goal.withdrawalControl === "admin" ? "👤 Admin Withdraws" : "🤝 Consensus"}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
          </div>

          {goal.description && (
            <p className="text-[13px] text-slate-500 mt-2 mb-4">{goal.description}</p>
          )}

          {/* Progress */}
          <div className="bg-slate-50 rounded-xl p-4 mb-5">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xl font-black text-slate-800">{formatCurrency(goal.current)}</span>
              <span className="text-sm text-slate-400">of {formatCurrency(goal.target)} goal</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{pct}% raised</span>
              {goal.deadline && <span>Deadline: {fmtDate(goal.deadline)}</span>}
            </div>
          </div>

          {/* Participants */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-sm text-slate-800">
                Participants ({goal.participants?.length ?? 0})
              </div>
              <span className="text-[11px] text-slate-400">All amounts are public</span>
            </div>
            {isSplit && (
              <p className="text-[11px] text-teal-600 font-semibold mb-3">
                Equal split · each owes {formatCurrency(shareTarget)}
              </p>
            )}
            <div className="divide-y divide-slate-100">
              {(goal.participants ?? [])
                .sort((a, b) => b.amount - a.amount)
                .map((p, i) => {
                  const pctShare = isSplit && shareTarget > 0
                    ? Math.min(100, Math.round((p.amount / shareTarget) * 100))
                    : null;
                  const colors = ["bg-brand-500", "bg-teal-500", "bg-success", "bg-warning", "bg-indigo-500"];
                  const barColors = ["bg-brand-500", "bg-teal-400", "bg-success", "bg-warning", "bg-indigo-400"];
                  return (
                    <div key={p.id} className="py-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-extrabold text-white flex-shrink-0 ${colors[i % 5]}`}>
                            {p.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <div className="text-[13px] font-semibold text-slate-800">{p.name}</div>
                              {(p.id === "p1" || p.id === "q1") && (
                                <span className="text-[10px] bg-brand-100 text-brand-500 font-bold px-1.5 py-0.5 rounded-full">You</span>
                              )}
                            </div>
                            {isSplit && pctShare !== null && (
                              <div className={`text-[10px] font-semibold ${pctShare >= 100 ? "text-success" : pctShare < 30 ? "text-danger" : "text-warning"}`}>
                                {pctShare >= 100 ? "✓ Share complete" : `${pctShare}% of share · ${formatCurrency(shareTarget - p.amount)} remaining`}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[13px] font-bold text-slate-800">
                            {p.amount > 0 ? formatCurrency(p.amount) : <span className="text-slate-400">{formatCurrency(0)}</span>}
                          </span>
                          {isSplit && <div className="text-[10px] text-slate-400">of {formatCurrency(shareTarget)}</div>}
                        </div>
                      </div>
                      {isSplit && pctShare !== null && (
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden ml-10">
                          <div
                            className={`h-full rounded-full transition-all ${barColors[i % 5]}`}
                            style={{ width: `${pctShare}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              {(!goal.participants || goal.participants.length === 0) && (
                <p className="text-[13px] text-slate-400 py-4 text-center">No participants yet. Share the link to invite people.</p>
              )}
            </div>
          </div>

          {/* Contribute */}
          {contributing ? (
            <div className="mb-4 p-4 bg-slate-50 rounded-xl">
              <div className="label-sm">Contribution Amount</div>
              <div className="relative mb-3">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">TSh</span>
                <input
                  className="input-field !pl-14"
                  placeholder="100.00"
                  value={amount}
                  autoFocus
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button className="btn-outline flex-1" onClick={() => setContributing(false)}>Cancel</button>
                <button className="btn-primary flex-[2]" disabled={!amount}>Contribute</button>
              </div>
            </div>
          ) : (
            <button
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition-colors mb-3"
              onClick={() => setContributing(true)}
            >
              Contribute to this Goal
            </button>
          )}

          {/* Share link */}
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-500 mb-2">Invite Link</div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-[12px] text-slate-500 truncate font-mono">
                {url}
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all flex-shrink-0 ${
                  copied ? "bg-success-light text-success" : "bg-brand-50 text-brand-500 hover:bg-brand-100"
                }`}
              >
                {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => nativeShare(goal)}
              className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold text-[13px] py-2.5 rounded-lg transition-colors"
            >
              Share via Device ↗
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit goal dialog ─────────────────────────────────────────────────────────

function EditGoalDialog({
  goal,
  onClose,
  onSave,
}: {
  goal: Goal;
  onClose: () => void;
  onSave: (data: Partial<Goal>) => void;
}) {
  const isSavings = goal.type === "savings";
  const isGroup = goal.type === "group";
  const isEmergency = goal.type === "emergency";

  const initialWeightType: WeightType = (goal.weight || "").includes("%") ? "Percentage" : "Fixed Amount";
  const initialWeightVal = (goal.weight || "20").replace(/[%TSh,\s]/g, "").trim() || "20";

  const [name, setName] = useState(goal.name);
  const [target, setTarget] = useState(String(goal.target));
  const [deadline, setDeadline] = useState(goal.deadline || "");
  const [locked, setLocked] = useState(goal.locked);
  const [description, setDescription] = useState(goal.description || "");
  const [weightType, setWeightType] = useState<WeightType>(initialWeightType);
  const [weight, setWeight] = useState(initialWeightVal);
  const [quickPick, setQuickPick] = useState<string | null>(null);

  const canSave =
    name.trim() !== "" &&
    target.trim() !== "" &&
    (isSavings ? deadline !== "" && isAtLeast4MonthsAway(deadline) && locked : true);

  function handleSave() {
    const data: Partial<Goal> = {
      name: name.trim(),
      target: parseFloat(target.replace(/,/g, "")) || 0,
    };
    if (isSavings) {
      data.deadline = deadline;
      data.locked = locked;
      data.weight = weightType === "Percentage" ? `${weight}%` : formatTsh(Number(weight) || 0);
    }
    if (isEmergency) {
      data.weight = weightType === "Percentage" ? `${weight}%` : formatTsh(Number(weight) || 0);
    }
    if (isGroup) {
      data.deadline = deadline || undefined;
      data.description = description;
    }
    onSave(data);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative card w-full max-w-[480px] z-10 flex flex-col max-h-[92vh] overflow-y-auto">
        <div className="p-7">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Edit goal</h2>
              <p className="text-slate-500 text-[13px] mt-0.5">
                {isGroup ? "Group goal" : isSavings ? "Savings goal" : "Emergency fund"}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none mt-0.5">×</button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label-sm">{isGroup ? "Group Name" : isSavings ? "Goal Name" : "Fund Name"}</label>
              <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            {isGroup && (
              <div>
                <label className="label-sm">Description</label>
                <textarea
                  className="input-field resize-none"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="label-sm">
                Target Amount{isEmergency && <span className="text-slate-400 font-normal ml-1">(soft target)</span>}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">TSh</span>
                <input
                  className="input-field !pl-14"
                  placeholder="5,000.00"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
            </div>

            {!isGroup && (
              <div>
                <label className="label-sm">Savings Weight</label>
                <div className="flex bg-slate-100 rounded-lg p-1 gap-1 mb-2">
                  {(["Percentage", "Fixed Amount"] as WeightType[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setWeightType(t)}
                      className={`flex-1 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                        weightType === t ? "bg-brand-500 text-white" : "text-slate-500"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input className="input-field !w-20" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  <span className="text-slate-500 text-sm">
                    {weightType === "Percentage" ? "% of total savings" : "fixed TSh per cycle"}
                  </span>
                </div>
              </div>
            )}

            {(isSavings || isGroup) && (
              <div>
                <label className="label-sm">
                  Deadline{isGroup && <span className="text-slate-400 font-normal ml-1">(optional)</span>}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(isSavings ? QUICK_PICKS.filter((q) => q.months >= 4) : QUICK_PICKS).map(({ label, months }) => (
                    <button
                      key={label}
                      onClick={() => { setDeadline(addMonths(months)); setQuickPick(label); }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                        quickPick === label
                          ? isGroup ? "bg-teal-500 text-white border-teal-500" : "bg-brand-500 text-white border-brand-500"
                          : "bg-white text-slate-500 border-slate-200 hover:border-brand-300 hover:text-brand-500"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {isSavings && (
                  <p className="text-[11px] text-slate-400 mb-1.5">Savings goals require a minimum 4-month deadline.</p>
                )}
                <div className="relative">
                  <input
                    type="date"
                    className="input-field"
                    min={isSavings ? addMonths(4) : todayIso()}
                    value={deadline}
                    onChange={(e) => { setDeadline(e.target.value); setQuickPick(null); }}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <CalendarIcon size={16} />
                  </span>
                </div>
                {deadline && isSavings && !isAtLeast4MonthsAway(deadline) && (
                  <p className="text-[11px] text-danger font-semibold mt-1">Deadline must be at least 4 months from today.</p>
                )}
              </div>
            )}

            {isSavings && (
              <div
                className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${locked ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}
                onClick={() => setLocked((v) => !v)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-slate-800">🔒 Lock-in Goal</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">Funds cannot be withdrawn before the deadline</div>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4 ${locked ? "bg-brand-500" : "bg-slate-200"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${locked ? "left-5" : "left-0.5"}`} />
                  </div>
                </div>
              </div>
            )}

            {isSavings && !locked && (
              <p className="text-[11px] text-slate-400 text-center -mb-1">
                Enable <span className="font-semibold text-slate-600">Lock-in Goal</span> above to save
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button className="btn-outline flex-1" onClick={onClose}>Cancel</button>
              <button className="btn-primary flex-[2]" disabled={!canSave} onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Goal card (savings / emergency) ─────────────────────────────────────────

const PALETTES = [
  { icon: "bg-brand-100 text-brand-500", bar: "bg-brand-500" },
  { icon: "bg-sky-100 text-sky-500", bar: "bg-sky-500" },
  { icon: "bg-indigo-100 text-indigo-500", bar: "bg-indigo-500" },
  { icon: "bg-success-light text-success", bar: "bg-success" },
];

function GoalCard({ goal, index, onRemove, onEdit }: { goal: Goal; index: number; onRemove: () => void; onEdit: () => void }) {
  const { formatCurrency, t } = useSettings();
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const isEmergency = goal.type === "emergency";
  const palette = isEmergency ? { icon: "bg-warning-light text-warning", bar: "bg-warning" } : PALETTES[index % PALETTES.length];

  return (
    <div className={`card p-5 ${isEmergency ? "border border-warning/20" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${palette.icon}`}>
            <GoalsIcon size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <div className="font-bold text-sm text-slate-800">{goal.name}</div>
              {goal.locked && <span className="text-[10px]">🔒</span>}
            </div>
            <div className="text-[11px] text-slate-400">Weight: {goal.weight}</div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isEmergency ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning-light text-warning">Emergency</span>
          ) : (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pct >= 30 ? "bg-success-light text-success" : "bg-warning-light text-warning"}`}>
              {pct >= 30 ? "On Track" : "Behind"}
            </span>
          )}
          {goal.locked && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-500">Locked</span>}
        </div>
      </div>
      <div className="mb-3">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-[13px] font-extrabold text-slate-800">{formatCurrency(goal.current)}</span>
          <span className="text-[11px] text-slate-400">of {formatCurrency(goal.target)}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${palette.bar}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[11px] text-slate-400 mt-1">{pct}% complete</div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        {isEmergency ? (
          <div className="flex items-center gap-1 text-[11px] text-warning font-semibold">
            <CheckIcon size={11} /> Accessible anytime
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <CalendarIcon size={11} />
            <span>{goal.deadline ? fmtDate(goal.deadline) : "—"}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="text-[11px] text-brand-400 hover:text-brand-600 transition-colors">Edit</button>
          <button onClick={onRemove} className="text-[11px] text-slate-300 hover:text-danger transition-colors">Remove</button>
        </div>
      </div>
    </div>
  );
}

// ─── Group goal card ──────────────────────────────────────────────────────────

function GroupGoalCard({ goal, onRemove, onView, onEdit }: { goal: Goal; onRemove: () => void; onView: () => void; onEdit: () => void }) {
  const { formatCurrency, t } = useSettings();
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const subtype = GROUP_SUBTYPES.find((s) => s.value === goal.groupSubType);
  const participantCount = goal.participants?.length ?? 0;

  return (
    <div className="card p-5 border border-teal-100">
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-teal-100 text-teal-600 text-base">
            {subtype?.emoji ?? "👥"}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm text-slate-800 truncate">{goal.name}</div>
            <div className="text-[11px] text-slate-400">{subtype?.label} · {goal.visibility === "public" ? "Public" : "Invite Only"}</div>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-600 flex-shrink-0 ml-2">
          Group
        </span>
      </div>

      {goal.description && (
        <p className="text-[12px] text-slate-400 mb-3 line-clamp-1">{goal.description}</p>
      )}

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-[13px] font-extrabold text-slate-800">{formatCurrency(goal.current)}</span>
          <span className="text-[11px] text-slate-400">of {formatCurrency(goal.target)}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <div className="text-[11px] text-slate-400 mt-1">{pct}% raised</div>
      </div>

      {/* Participants row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {(goal.participants ?? []).slice(0, 4).map((p, i) => (
              <div
                key={p.id}
                className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-extrabold text-white ${
                  ["bg-brand-500", "bg-teal-500", "bg-success", "bg-warning"][i % 4]
                }`}
              >
                {p.initials}
              </div>
            ))}
            {participantCount > 4 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">
                +{participantCount - 4}
              </div>
            )}
          </div>
          <span className="text-[11px] text-slate-400">{participantCount} participant{participantCount !== 1 ? "s" : ""}</span>
        </div>
        <span className="text-[11px] text-teal-600 font-semibold">
          Your: {formatCurrency(goal.myContribution ?? 0)}
          {goal.contributionModel === "split" && participantCount > 0 && (
            <span className="text-slate-400 font-normal"> / {formatCurrency(Math.round(goal.target / participantCount))}</span>
          )}
        </span>
      </div>

      {/* Governance badges */}
      <div className="flex gap-1.5 mb-3">
        <span className="text-[10px] font-semibold bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
          {goal.contributionModel === "split" ? "⚖️ Equal Split" : "💸 Open"}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          goal.withdrawalControl === "admin" ? "bg-warning-light text-warning" : "bg-success-light text-success"
        }`}>
          {goal.withdrawalControl === "admin" ? "👤 Admin Withdraws" : "🤝 Consensus"}
        </span>
      </div>

      {/* Footer */}
      <div className="flex gap-2 pt-3 border-t border-slate-100">
        <button
          onClick={onView}
          className="flex-1 bg-teal-50 hover:bg-teal-100 text-teal-600 font-semibold text-[12px] py-2 rounded-lg transition-colors"
        >
          View Details
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-2 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-500 text-[12px] font-semibold transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => nativeShare(goal)}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-[12px] font-semibold transition-colors"
        >
          <ArrowIcon size={12} />
          Share
        </button>
        <button onClick={onRemove} className="text-[11px] text-slate-300 hover:text-danger transition-colors px-2">
          ✕
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const { formatCurrency, t } = useSettings();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [detailGoal, setDetailGoal] = useState<Goal | null>(null);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const response = await apiGet(API_ENDPOINTS.GOALS.LIST);
      setGoals(response.results || []);
    } catch (err: any) {
      console.error('Goals fetch error:', err);
      setError(err.message || 'Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const savingsCount = goals.filter((g) => g.type === "savings").length;
  const savingsGoals = goals.filter((g) => g.type === "savings");
  const emergencyGoals = goals.filter((g) => g.type === "emergency");
  const groupGoals = goals.filter((g) => g.type === "group");

  const totalTarget = goals.filter((g) => g.type !== "group").reduce((s, g) => s + g.target, 0);
  const totalSaved = goals.filter((g) => g.type !== "group").reduce((s, g) => s + g.current, 0);

  async function handleAdd(g: Omit<Goal, "id">) {
    try {
      const goalData = {
        name: g.name,
        type: g.type,
        target: g.target,
        deadline: g.deadline || null,
        description: g.description || "",
        locked: g.locked,
        weight: g.weight,
        groupSubType: g.groupSubType || "",
        visibility: g.visibility || "invite",
        contributionModel: g.contributionModel || "",
        withdrawalControl: g.withdrawalControl || "",
      };
      
      const response = await apiPost(API_ENDPOINTS.GOALS.LIST, goalData);
      setGoals(prev => [...prev, response]);
    } catch (err: any) {
      console.error('Goal creation error:', err);
      setError(err.message || 'Failed to create goal');
    }
  }

  async function handleRemove(id: string) {
    try {
      await apiDelete(API_ENDPOINTS.GOALS.DETAIL(id));
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err: any) {
      console.error('Goal delete error:', err);
      setError(err.message || 'Failed to delete goal');
    }
  }

  async function handleEdit(id: string, data: Partial<Goal>) {
    try {
      const response = await apiPatch(API_ENDPOINTS.GOALS.DETAIL(id), data);
      setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...response } : g)));
      setEditGoal(null);
    } catch (err: any) {
      console.error('Goal update error:', err);
      setError(err.message || 'Failed to update goal');
    }
  }

  return (
    <>
      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">{t("goals.title")}</h1>
            <p className="text-slate-500 text-sm">{t("goals.track_manage")}</p>
          </div>
          {goals.length > 0 && (
            <button className="btn-primary !w-auto px-5" onClick={() => setShowDialog(true)}>
              + {t("goals.create_goal")}
            </button>
          )}
        </div>

        {goals.length === 0 ? (
          <div className="card p-14 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <GoalsIcon size={28} className="text-brand-300" />
            </div>
            <h2 className="text-base font-extrabold text-slate-800 mb-1">{t("goals.no_goals")}</h2>
            <p className="text-[13px] text-slate-400 max-w-[300px] mb-6">
              {t("goals.create_description")}
            </p>
            <button className="btn-primary !w-auto px-8" onClick={() => setShowDialog(true)}>
              {t("goals.set_first_goal")}
            </button>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="card p-4">
                <div className="text-xs text-slate-500 mb-1">{t("goals.total_goals")}</div>
                <div className="text-xl font-extrabold text-slate-800">{goals.length}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-slate-500 mb-1">{t("goals.total_saved")}</div>
                <div className="text-xl font-extrabold text-brand-500">{formatCurrency(totalSaved)}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-slate-500 mb-1">{t("goals.total_target")}</div>
                <div className="text-xl font-extrabold text-slate-800">{formatCurrency(totalTarget)}</div>
              </div>
              <div className="card p-4">
                <div className="text-xs text-slate-500 mb-1">{t("goals.group_goals")}</div>
                <div className="text-xl font-extrabold text-teal-500">{groupGoals.length}</div>
              </div>
            </div>

            {/* Savings goals */}
            {savingsGoals.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Savings Goals</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savingsGoals.map((g, i) => (
                    <GoalCard key={g.id} goal={g} index={i} onRemove={() => handleRemove(g.id)} onEdit={() => setEditGoal(g)} />
                  ))}
                </div>
              </div>
            )}

            {/* Emergency funds */}
            {emergencyGoals.length > 0 && (
              <div className="mb-6">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Emergency Funds</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {emergencyGoals.map((g, i) => (
                    <GoalCard key={g.id} goal={g} index={i} onRemove={() => handleRemove(g.id)} onEdit={() => setEditGoal(g)} />
                  ))}
                </div>
              </div>
            )}

            {/* Group goals */}
            {groupGoals.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Group Goals</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {groupGoals.map((g) => (
                    <GroupGoalCard
                      key={g.id}
                      goal={g}
                      onRemove={() => handleRemove(g.id)}
                      onView={() => setDetailGoal(g)}
                      onEdit={() => setEditGoal(g)}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showDialog && (
        <GoalDialog onClose={() => setShowDialog(false)} onSave={handleAdd} savingsCount={savingsCount} />
      )}

      {detailGoal && (
        <GroupDetailModal goal={detailGoal} onClose={() => setDetailGoal(null)} />
      )}

      {editGoal && (
        <EditGoalDialog
          goal={editGoal}
          onClose={() => setEditGoal(null)}
          onSave={(data) => handleEdit(editGoal.id, data)}
        />
      )}
    </>
  );
}
