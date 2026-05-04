"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckIcon, WalletIcon } from "@/components/icons";
import { formatTsh } from "@/lib/currency";

// ─── Mock data (replace with API fetch by code) ────────────────────────────────

interface GoalPreview {
  code: string;
  name: string;
  description: string;
  subtype: string;
  subtypeEmoji: string;
  subtypeLabel: string;
  visibility: string;
  contributionModel: "open" | "split";
  withdrawalControl: "admin" | "consensus";
  target: number;
  current: number;
  deadline?: string;
  creator: { id: string; name: string; initials: string };
  participants: { id: string; name: string; initials: string; amount: number }[];
}

const MOCK_GOALS: Record<string, GoalPreview> = {
  WED2026: {
    code: "WED2026",
    name: "Mike's Wedding Fund",
    description: "Help us celebrate our big day! Every contribution counts towards an unforgettable celebration.",
    subtype: "wedding",
    subtypeEmoji: "💍",
    subtypeLabel: "Wedding / Event",
    visibility: "public",
    contributionModel: "open",
    withdrawalControl: "admin",
    target: 10000,
    current: 7200,
    deadline: "Aug 15, 2026",
    creator: { id: "u-mike", name: "Mike Johnson", initials: "MJ" },
    participants: [
      { id: "p1", name: "John Doe", initials: "JD", amount: 5000 },
      { id: "p2", name: "Greg Miller", initials: "GM", amount: 2000 },
      { id: "p3", name: "Sarah K.", initials: "SK", amount: 200 },
    ],
  },
  BIZ2026: {
    code: "BIZ2026",
    name: "Business Launch Fund",
    description: "We're pooling resources to launch our venture. Equal shares — contribute at your own pace.",
    subtype: "coinvest",
    subtypeEmoji: "💼",
    subtypeLabel: "Co-Investment",
    visibility: "invite",
    contributionModel: "split",
    withdrawalControl: "consensus",
    target: 10000000,
    current: 4500000,
    creator: { id: "u-john", name: "John Doe", initials: "JD" },
    participants: [
      { id: "q1", name: "John Doe", initials: "JD", amount: 1500000 },
      { id: "q2", name: "Aisha M.", initials: "AM", amount: 2000000 },
      { id: "q3", name: "Carlos R.", initials: "CR", amount: 800000 },
      { id: "q4", name: "Josh T.", initials: "JT", amount: 200000 },
      { id: "q5", name: "Fatima N.", initials: "FN", amount: 0 },
    ],
  },
};

// ─── Mock session (replace with real auth context) ────────────────────────────
// null  → not logged in
// object → logged-in user
const MOCK_SESSION: { id: string; name: string; email: string; initials: string } | null = {
  id: "p1",
  name: "John Doe",
  email: "john.doe@email.com",
  initials: "JD",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(current: number, target: number) {
  return target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
}

function fmt(n: number) {
  return n >= 1_000_000
    ? `TSh ${(n / 1_000_000).toFixed(1)}M`
    : formatTsh(n);
}

// ─── Main content ──────────────────────────────────────────────────────────────

function InviteContent() {
  const router = useRouter();
  const params = useSearchParams();
  const code = (params.get("code") ?? "").toUpperCase();

  const goal = MOCK_GOALS[code];
  const session = MOCK_SESSION;

  const [joined, setJoined] = useState(false);

  // Determine state
  const isCreator = session && goal && goal.creator.id === session.id;
  const isParticipant = session && goal && goal.participants.some((p) => p.id === session.id);
  const splitShare = goal?.contributionModel === "split" && goal.participants.length > 0
    ? Math.round(goal.target / goal.participants.length)
    : 0;

  // ── Not found ──
  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="card p-10 w-full max-w-[400px] text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h2 className="text-lg font-extrabold text-slate-800 mb-1">Goal not found</h2>
          <p className="text-[13px] text-slate-400 mb-6">
            This invite link may have expired or is invalid.
          </p>
          <Link href="/" className="btn-primary text-center block">
            Go to SaveWise
          </Link>
        </div>
      </div>
    );
  }

  const progress = pct(goal.current, goal.target);

  // ── Joined success ──
  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[#f5f4ff]">
        <div className="card p-10 w-full max-w-[420px] text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
            <CheckIcon size={28} className="text-teal-500" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-800 mb-1">You&apos;re in!</h2>
          <p className="text-[13px] text-slate-500 mb-2">
            You&apos;ve joined <span className="font-semibold text-slate-800">{goal.name}</span>.
          </p>
          {goal.contributionModel === "split" && (
            <p className="text-[13px] text-slate-400 mb-6">
              Your share target is <span className="font-bold text-teal-600">{fmt(splitShare)}</span>.
              Contribute at your own pace — every deposit counts.
            </p>
          )}
          {goal.contributionModel === "open" && (
            <p className="text-[13px] text-slate-400 mb-6">
              Your contribution starts at TSh 0. Add funds anytime from your Goals page.
            </p>
          )}
          <button className="btn-primary" onClick={() => router.push("/goals")}>
            View in My Goals
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4ff] flex flex-col items-center justify-center px-4 py-10">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-7">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center text-white">
          <WalletIcon size={16} />
        </div>
        <span className="font-extrabold text-base text-slate-800">SaveWise</span>
      </Link>

      <div className="card w-full max-w-[460px] overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-br from-teal-500 to-teal-400 p-6 text-white text-center">
          <div className="text-4xl mb-2">{goal.subtypeEmoji}</div>
          <div className="text-[11px] font-semibold opacity-75 uppercase tracking-widest mb-1">
            You&apos;re invited to join
          </div>
          <h1 className="text-xl font-extrabold mb-1">{goal.name}</h1>
          <p className="text-[12px] opacity-75">
            Created by {goal.creator.name}
          </p>
        </div>

        <div className="p-6">
          {/* Description */}
          {goal.description && (
            <p className="text-[13px] text-slate-500 mb-4">{goal.description}</p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            <span className="text-[11px] font-semibold bg-teal-100 text-teal-600 px-2.5 py-1 rounded-full">
              {goal.subtypeEmoji} {goal.subtypeLabel}
            </span>
            <span className="text-[11px] font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full">
              {goal.contributionModel === "split" ? "⚖️ Equal Split" : "💸 Open Contributions"}
            </span>
            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              goal.withdrawalControl === "admin"
                ? "bg-warning-light text-warning"
                : "bg-success-light text-success"
            }`}>
              {goal.withdrawalControl === "admin" ? "👤 Admin Withdraws" : "🤝 Group Consensus"}
            </span>
          </div>

          {/* Progress */}
          <div className="bg-slate-50 rounded-xl p-4 mb-5">
            <div className="flex justify-between items-baseline mb-2">
              <span className="text-xl font-extrabold text-slate-800">{fmt(goal.current)}</span>
              <span className="text-[12px] text-slate-400">of {fmt(goal.target)} goal</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-teal-500 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{progress}% raised · {goal.participants.length} contributors</span>
              {goal.deadline && <span>Deadline: {goal.deadline}</span>}
            </div>
          </div>

          {/* Split share info */}
          {goal.contributionModel === "split" && (
            <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 mb-5">
              <div className="text-[12px] font-bold text-teal-600 mb-0.5">Equal Split</div>
              <div className="text-[12px] text-slate-600">
                {goal.participants.length} participants · your share target:{" "}
                <span className="font-bold text-slate-800">{fmt(splitShare)}</span>.
                Pay in as many installments as you like.
              </div>
            </div>
          )}

          {/* Governance notice */}
          <div className={`rounded-xl p-3 mb-5 text-[12px] ${
            goal.withdrawalControl === "admin"
              ? "bg-warning-light"
              : "bg-success-light"
          }`}>
            {goal.withdrawalControl === "admin" ? (
              <span className="text-slate-700">
                <span className="font-bold text-warning">👤 Admin-controlled — </span>
                The creator can withdraw and manage funds at any time.
              </span>
            ) : (
              <span className="text-slate-700">
                <span className="font-bold text-success">🤝 Group consensus — </span>
                Funds can only be released when all participants agree.
              </span>
            )}
          </div>

          {/* ── Auth-aware join section ── */}

          {/* Creator */}
          {isCreator && (
            <div className="text-center py-4 border-t border-slate-100">
              <div className="text-sm font-bold text-slate-800 mb-1">You created this group</div>
              <p className="text-[13px] text-slate-400 mb-4">
                Share this link with others so they can join and contribute.
              </p>
              <button className="btn-primary" onClick={() => router.push("/goals")}>
                View in My Goals
              </button>
            </div>
          )}

          {/* Already a participant */}
          {!isCreator && isParticipant && (
            <div className="text-center py-4 border-t border-slate-100">
              <div className="w-10 h-10 rounded-full bg-success-light flex items-center justify-center mx-auto mb-2">
                <CheckIcon size={18} className="text-success" />
              </div>
              <div className="text-sm font-bold text-slate-800 mb-1">You&apos;re already in this group</div>
              <p className="text-[13px] text-slate-400 mb-4">
                Logged in as <span className="font-semibold text-slate-700">{session!.name}</span>.
                You&apos;ve contributed {fmt(goal.participants.find((p) => p.id === session!.id)?.amount ?? 0)} so far.
              </p>
              <button className="btn-primary" onClick={() => router.push("/goals")}>
                View My Contribution
              </button>
            </div>
          )}

          {/* Logged in — ready to join */}
          {!isCreator && !isParticipant && session && (
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3 bg-brand-50 rounded-xl p-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-brand-500 text-white flex items-center justify-center text-[12px] font-extrabold flex-shrink-0">
                  {session.initials}
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-slate-800">Joining as</div>
                  <div className="text-sm font-bold text-brand-500">{session.name}</div>
                  <div className="text-[11px] text-slate-400">{session.email}</div>
                </div>
              </div>
              <p className="text-[12px] text-slate-400 mb-4 text-center">
                Not you?{" "}
                <Link href="/login" className="text-brand-500 font-semibold hover:underline">
                  Switch account
                </Link>
              </p>
              <button
                className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition-colors"
                onClick={() => setJoined(true)}
              >
                Join {goal.name} →
              </button>
            </div>
          )}

          {/* Not logged in */}
          {!session && (
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[13px] text-slate-500 text-center mb-4">
                You need a SaveWise account to join this group goal.
              </p>
              <div className="flex gap-3">
                <Link
                  href={`/signup?redirect=/invite?code=${code}`}
                  className="flex-1 text-center bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-lg transition-colors text-sm"
                >
                  Create Account
                </Link>
                <Link
                  href={`/login?redirect=/invite?code=${code}`}
                  className="flex-1 text-center btn-outline"
                >
                  Log In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 mt-6 text-center">
        SaveWise · Your money, your goals.{" "}
        <Link href="/" className="text-brand-500 hover:underline">Learn more</Link>
      </p>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense>
      <InviteContent />
    </Suspense>
  );
}
