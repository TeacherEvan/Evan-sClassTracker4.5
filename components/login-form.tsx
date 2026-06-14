"use client";

import { GeometricBorder } from "@/components/geometric-border";
import { Logo } from "@/components/logo";
import { api } from "@/convex/_generated/api";
import { useLanguage } from "@/lib/language-context";
import type { User } from "@/lib/types";
import { useMutation } from "convex/react";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

interface LoginFormProps {
  onLoginSuccess: (user: User) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const { t } = useLanguage();
  const login = useMutation(api.users.login);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Pass user agent and browser language for login tracking and auto-detection
      const userAgent =
        typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
      const browserLanguage =
        typeof navigator !== "undefined" ? navigator.language : "en";
      const user = await login({
        username,
        password,
        userAgent,
        browserLanguage,
      });
      // Guardian role check removed - type system prevents guardian role (migrated to provider system)
      onLoginSuccess(user as User);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-black relative overflow-hidden">
      {/* Animated fish school background - Disabled for performance testing */}
      {/* <FishSchoolBackground /> */}

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 relative shadow-[0_0_40px_rgba(255,215,0,0.6)]">
          {/* Geometric/Henna Border replacing the simple gold border */}
          <GeometricBorder />

          {/* Logo with Slogan */}
          <div className="mb-8 relative z-20">
            <Logo size="md" showSlogan={true} />
          </div>

          <p className="text-gray-600 dark:text-gray-400 text-center mb-8">
            {t("Sign in to your account", "เข้าสู่ระบบบัญชีของคุณ")}
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium mb-2"
              >
                {t("Username", "ชื่อผู้ใช้")}
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 touch-manipulation transition-shadow"
                required
                disabled={loading}
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                {t("Password", "รหัสผ่าน")}
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 touch-manipulation transition-shadow"
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 md:py-2.5 px-4 rounded-xl md:rounded-lg hover:from-blue-600 hover:to-blue-700 active:scale-98 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm touch-manipulation shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] overflow-hidden group"
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              {/* Button content with spinner */}
              <span className="relative flex items-center justify-center gap-2">
                {loading && (
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {loading
                  ? t("Signing in...", "กำลังเข้าสู่ระบบ...")
                  : t("Sign In", "เข้าสู่ระบบ")}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
