"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserIcon, EyeIcon } from "@/components/icons";

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/link-sources");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-8">
      <div className="max-w-[420px] w-full">
        <div className="card p-9">
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-brand-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-brand-500">
              <UserIcon size={26} />
            </div>
            <h1 className="text-[22px] font-extrabold text-slate-800 mb-1.5">
              Welcome back!
            </h1>
            <p className="text-slate-500 text-sm">Login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input className="input-field" placeholder="Email or Phone" required />
            </div>
            <div className="relative">
              <input
                className="input-field pr-10"
                type={showPw ? "text" : "password"}
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                aria-label="Toggle password visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <EyeIcon size={16} />
              </button>
            </div>
            <div className="text-right">
              <Link
                href="#"
                className="text-brand-500 text-[13px] font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <button type="submit" className="btn-primary">
              Login
            </button>
          </form>

          <p className="text-center mt-4 text-[13px] text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-brand-500 font-semibold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
