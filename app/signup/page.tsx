"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { WalletIcon } from "@/components/icons";
import { API_ENDPOINTS, apiPost } from "@/lib/api";

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    password: "",
    confirm_password: "",
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
      const response = await apiPost(API_ENDPOINTS.AUTH.SIGNUP, {
        full_name: formData.full_name,
        email: formData.email,
        phone_number: formData.phone_number,
        password: formData.password,
        confirm_password: formData.confirm_password,
      });

      // Store tokens in localStorage (in production, use httpOnly cookies)
      if (response.access && response.refresh) {
        localStorage.setItem('access_token', response.access);
        localStorage.setItem('refresh_token', response.refresh);
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      // Redirect to onboarding flow
      router.push("/link-sources");
    } catch (error: any) {
      if (error.message && typeof error.message === 'object') {
        // Handle validation errors
        const validationErrors: Record<string, string> = {};
        Object.keys(error.message).forEach(key => {
          validationErrors[key] = Array.isArray(error.message[key]) 
            ? error.message[key][0] 
            : error.message[key];
        });
        setErrors(validationErrors);
      } else {
        setErrors({ general: error.message || 'An error occurred during signup' });
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
              <WalletIcon size={26} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Create account</h2>
            <p className="text-gray-600 mt-2">Start your savings journey today</p>
          </div>
          
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                <input 
                  type="text" 
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className={`input-field ${errors.full_name ? 'border-red-500' : ''}`}
                  placeholder="John Doe" 
                />
                {errors.full_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="you@example.com" 
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
                <input 
                  type="tel" 
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className={`input-field ${errors.phone_number ? 'border-red-500' : ''}`}
                  placeholder="+234 800 000 0000" 
                />
                {errors.phone_number && (
                  <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="••••••••" 
                />
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">
                    {Array.isArray(errors.password) ? errors.password.join(' ') : errors.password}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Must be at least 8 characters with 1 uppercase, 1 number, and 1 special character
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
                <input 
                  type="password" 
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className={`input-field ${errors.confirm_password ? 'border-red-500' : ''}`}
                  placeholder="••••••••" 
                />
                {errors.confirm_password && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirm_password}</p>
                )}
              </div>
            </div>
            <button 
              type="submit" 
              className="btn-primary mt-6"
              disabled={isLoading}
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="text-brand-500 hover:text-brand-600 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="text-gray-500 text-xs">
            By creating an account, you agree to our{" "}
            <Link href="#" className="text-brand-500 hover:text-brand-600">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="#" className="text-brand-500 hover:text-brand-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
