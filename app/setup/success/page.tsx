"use client";

import { useRouter } from "next/navigation";
import { CheckIcon } from "@/components/icons";

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center p-8 min-h-[calc(100vh-60px)]">
      <div className="text-center max-w-sm">
        <div className="relative w-[100px] h-[100px] mx-auto mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-brand-500 rounded-full top-1/2 left-1/2"
              style={{
                transform: `rotate(${i * 45}deg) translateY(-48px)`,
                opacity: 0.3 + i * 0.09,
              }}
            />
          ))}
          <div className="w-[100px] h-[100px] bg-success-light rounded-full flex items-center justify-center text-success mx-auto">
            <CheckIcon size={44} />
          </div>
        </div>

        <h1 className="text-[22px] font-extrabold text-slate-800 mb-2">
          Your autosaving is now active!
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          You&apos;re all set. We&apos;ll start saving automatically according to
          your preferences.
        </p>

        <button
          className="btn-primary"
          onClick={() => router.push("/dashboard")}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
