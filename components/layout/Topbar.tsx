"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { BellIcon, ChevronDown } from "@/components/icons";
import { API_ENDPOINTS, apiGet } from "@/lib/api";

interface User {
  full_name?: string;
  first_name?: string;
  last_name?: string;
}

export default function Topbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      // Don't fetch if no auth token
      if (!localStorage.getItem('access_token')) return;

      try {
        const data = await apiGet(API_ENDPOINTS.USER.PROFILE);
        setUser(data);
      } catch {
        // Token invalid or expired — silently ignore
      }
    };

    fetchUser();
  }, []);

  const getInitials = () => {
    if (!user) return "?";
    if (user.full_name) {
      const parts = user.full_name.split(" ");
      return parts.length > 1 
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : user.full_name.slice(0, 2).toUpperCase();
    }
    if (user.first_name && user.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    return "?";
  };

  const getDisplayName = () => {
    if (!user) return "Loading...";
    return user.full_name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || "User";
  };

  return (
    <header className="bg-white border-b border-slate-200 flex items-center justify-between px-8 h-[60px]">
      <div className="text-sm text-slate-500">
        {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}
      </div>
      <div className="flex items-center gap-4">
        <button
          aria-label="Notifications"
          className="relative text-slate-500 hover:text-slate-700 transition-colors"
        >
          <BellIcon size={18} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-danger rounded-full" />
        </button>
        <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer">
          <div className="w-[34px] h-[34px] rounded-full bg-brand-500 text-white flex items-center justify-center text-[13px] font-bold">
            {getInitials()}
          </div>
          <span className="text-sm font-semibold text-slate-800">{getDisplayName()}</span>
          <ChevronDown size={14} className="text-slate-500" />
        </Link>
      </div>
    </header>
  );
}
