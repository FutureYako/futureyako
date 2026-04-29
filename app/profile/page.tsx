"use client";

const stats = [
  { label: "Total Saved", val: "$2,450.00", color: "text-brand-500" },
  { label: "Goals Completed", val: "3", color: "text-success" },
  { label: "Member Since", val: "Jan 2024", color: "text-slate-800" },
];

export default function ProfilePage() {
  return (
    <div className="p-8">
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-slate-800">Profile</h1>
        <p className="text-slate-500 text-sm">Manage your personal information</p>
      </div>

      <div className="card p-6 mb-5 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-brand-500 text-white flex items-center justify-center text-2xl font-extrabold flex-shrink-0">
          JD
        </div>
        <div>
          <div className="text-lg font-extrabold text-slate-800">John Doe</div>
          <div className="text-sm text-slate-500">john.doe@email.com</div>
          <div className="mt-2">
            <span className="bg-brand-100 text-brand-500 text-[11px] font-semibold px-2.5 py-1 rounded-full">
              SaveWise Member
            </span>
          </div>
        </div>
        <button className="ml-auto btn-outline !w-auto">Edit Photo</button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-slate-500 mb-1">{s.label}</div>
            <div className={`text-xl font-extrabold ${s.color}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="font-bold text-sm text-slate-800 mb-5">Personal Information</div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label-sm">Full Name</label>
            <input className="input-field" defaultValue="John Doe" />
          </div>
          <div>
            <label className="label-sm">Email Address</label>
            <input className="input-field" defaultValue="john.doe@email.com" type="email" />
          </div>
          <div>
            <label className="label-sm">Phone Number</label>
            <input className="input-field" defaultValue="+1 (555) 000-0000" type="tel" />
          </div>
          <div>
            <label className="label-sm">Location</label>
            <input className="input-field" defaultValue="New York, USA" />
          </div>
        </div>
        <div className="mb-5">
          <label className="label-sm">Bio</label>
          <textarea
            className="input-field resize-none"
            rows={3}
            defaultValue="Saving for a better tomorrow."
          />
        </div>
        <button className="btn-primary !w-auto px-8">Save Changes</button>
      </div>
    </div>
  );
}
