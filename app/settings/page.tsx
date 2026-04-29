"use client";

import { useState } from "react";

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
        on ? "bg-brand-500" : "bg-slate-200"
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${
          on ? "left-5" : "left-0.5"
        }`}
      />
    </button>
  );
}

type NotifKey = "email" | "push" | "autosave" | "goals";

const NOTIF_ITEMS: { key: NotifKey; label: string; desc: string }[] = [
  { key: "email", label: "Email Notifications", desc: "Receive updates and reports via email" },
  { key: "push", label: "Push Notifications", desc: "Alerts for transactions and auto-saves" },
  { key: "autosave", label: "Auto-save Reminders", desc: "Get notified when auto-save runs" },
  { key: "goals", label: "Goal Milestones", desc: "Celebrate when you hit a savings goal" },
];

export default function SettingsPage() {
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>({
    email: true,
    push: true,
    autosave: true,
    goals: false,
  });

  const toggle = (key: NotifKey) =>
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="p-8">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm">Manage your account preferences</p>
      </div>

      <div className="card p-6 mb-5">
        <div className="font-bold text-sm text-slate-800 mb-1">Notifications</div>
        <p className="text-[12px] text-slate-400 mb-4">Choose what you want to be notified about</p>
        <div className="divide-y divide-slate-100">
          {NOTIF_ITEMS.map(({ key, label, desc }) => (
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

      <div className="card p-6 mb-5">
        <div className="font-bold text-sm text-slate-800 mb-1">Security</div>
        <p className="text-[12px] text-slate-400 mb-4">Keep your account secure</p>
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="text-sm font-semibold text-slate-800">Password</div>
              <div className="text-[12px] text-slate-400">Last changed 3 months ago</div>
            </div>
            <button className="btn-outline !w-auto">Change Password</button>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="text-sm font-semibold text-slate-800">Two-Factor Authentication</div>
              <div className="text-[12px] text-slate-400">Add an extra layer of security to your account</div>
            </div>
            <button className="btn-outline !w-auto">Enable 2FA</button>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="text-sm font-semibold text-slate-800">Active Sessions</div>
              <div className="text-[12px] text-slate-400">1 device currently logged in</div>
            </div>
            <button className="btn-outline !w-auto">Manage</button>
          </div>
        </div>
      </div>

      <div className="card p-6 mb-5">
        <div className="font-bold text-sm text-slate-800 mb-1">Preferences</div>
        <p className="text-[12px] text-slate-400 mb-4">Customise how SaveWise works for you</p>
        <div className="divide-y divide-slate-100">
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="text-sm font-semibold text-slate-800">Currency</div>
              <div className="text-[12px] text-slate-400">US Dollar (USD)</div>
            </div>
            <button className="btn-outline !w-auto">Change</button>
          </div>
          <div className="flex items-center justify-between py-3.5">
            <div>
              <div className="text-sm font-semibold text-slate-800">Language</div>
              <div className="text-[12px] text-slate-400">English (US)</div>
            </div>
            <button className="btn-outline !w-auto">Change</button>
          </div>
        </div>
      </div>

      <div className="card p-6 border border-danger-light">
        <div className="font-bold text-sm text-danger mb-1">Danger Zone</div>
        <p className="text-[12px] text-slate-400 mb-4">Irreversible actions — proceed with caution</p>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">Delete Account</div>
            <div className="text-[12px] text-slate-400">Permanently remove your account and all data</div>
          </div>
          <button className="bg-danger hover:bg-red-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors flex-shrink-0">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
