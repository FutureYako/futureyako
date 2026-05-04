"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserIcon, EyeIcon } from "@/components/icons";
import { API_ENDPOINTS, apiPost, apiGet } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    try {
      const response = await apiPost(API_ENDPOINTS.AUTH.LOGIN, {
        email: formData.email,
        password: formData.password,
      });

      // Handle 2FA requirement
      if (response.requires_2fa) {
        // Store temp token and redirect to 2FA verification
        localStorage.setItem('temp_token', response.temp_token);
        router.push('/login/2fa');
        return;
      }

      // Store tokens and user data
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      const isAdmin = response.user?.is_staff || response.user?.is_superuser;
      if (isAdmin) {
        router.push("/admin");
        return;
      }

      // Resume incomplete onboarding if not yet finished
      try {
        const onboarding = await apiGet(API_ENDPOINTS.USER.ONBOARDING);
        if (!onboarding.completed) {
          router.push(onboarding.current_step === "funding_source" ? "/link-sources" : "/saving-preferences");
          return;
        }
      } catch {
        // onboarding check failed — fall through to dashboard
      }

      router.push("/dashboard");
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
        setErrors({ general: error.message || 'Invalid email or password' });
      }
    } finally {
      setIsLoading(false);
    }
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

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input 
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Email or Phone" 
                required 
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>
            <div className="relative">
              <input
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field pr-10 ${errors.password ? 'border-red-500' : ''}`}
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
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-brand-500 text-[13px] font-medium hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
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
