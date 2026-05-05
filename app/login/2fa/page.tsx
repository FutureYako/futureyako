"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserIcon } from "@/components/icons";
import { API_ENDPOINTS, apiPost } from "@/lib/api";

export default function TwoFactorAuthPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const tempToken = localStorage.getItem('temp_token');
      
      if (!tempToken) {
        throw new Error('Session expired. Please login again.');
      }

      const response = await apiPost(API_ENDPOINTS.AUTH.LOGIN_2FA, {
        temp_token: tempToken,
        code: code,
      });

      // Clear temp token
      localStorage.removeItem('temp_token');

      // Store tokens and user data
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      const isAdmin = response.user?.is_staff || response.user?.is_superuser;
      router.push(isAdmin ? "/admin" : "/dashboard");
    } catch (error: any) {
      if (error.message && typeof error.message === 'object') {
        const validationErrors: Record<string, string> = {};
        Object.keys(error.message).forEach(key => {
          validationErrors[key] = Array.isArray(error.message[key]) 
            ? error.message[key][0] 
            : error.message[key];
        });
        setErrors(validationErrors);
      } else {
        setErrors({ code: error.message || 'Invalid verification code' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    localStorage.removeItem('temp_token');
    router.push('/login');
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
              Two-Factor Authentication
            </h1>
            <p className="text-slate-500 text-sm">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-center mb-4">
                <div className="flex gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <div
                      key={index}
                      className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center text-xl font-semibold"
                    >
                      {code[index] || ''}
                    </div>
                  ))}
                </div>
              </div>
              <input
                name="code"
                value={code}
                onChange={handleChange}
                className={`input-field text-center text-2xl font-mono tracking-widest ${errors.code ? 'border-red-500' : ''}`}
                placeholder="000000"
                maxLength={6}
                required
                autoComplete="one-time-code"
              />
              {errors.code && (
                <p className="text-red-500 text-xs mt-1">{errors.code}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || code.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </button>

            <button
              type="button"
              onClick={handleBack}
              className="btn-outline w-full"
            >
              Back to Login
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="text-slate-500 text-sm">
              Can't access your authenticator?{" "}
              <button
                onClick={() => router.push('/login/backup')}
                className="text-brand-500 font-medium hover:underline"
              >
                Use backup code
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
