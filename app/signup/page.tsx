"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { WalletIcon } from "@/components/icons";

export default function SignUpPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="max-w-[420px] w-full">
        <div className="card p-9">
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-brand-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-brand-500">
              <WalletIcon size={26} />
            </div>
            <h1 className="text-[22px] font-extrabold text-slate-800 mb-1.5">
              Create your account
            </h1>
            <p className="text-slate-500 text-sm">
              Start your journey to financial freedom
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-sm">Full Name</label>
              <input className="input-field" placeholder="John Doe" required />
            </div>
            <div>
              <label className="label-sm">Email Address</label>
              <input
                className="input-field"
                type="email"
                placeholder="john@example.com"
                required
              />
            </div>
            <div>
              <label className="label-sm">Phone Number</label>
              <input className="input-field" placeholder="+255 700 000 000" required />
            </div>
            <div>
              <label className="label-sm">Create Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn-primary mt-2">
              Sign Up
            </button>
          </form>

          <p className="text-center mt-4 text-[13px] text-slate-500">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-500 font-semibold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
