"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/lib/language-context";
import { useMutation } from "convex/react";
import { AlertCircle } from "lucide-react";
import { useState } from "react";

type User = {
  _id: Id<"users">;
  username: string;
  role: "teacher" | "moderator" | "admin";
  schoolId?: Id<"schools">;
  requirePasswordChange: boolean;
  createdAt: number;
};

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
      const user = await login({ username, password });
      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
            {t("Class Tracker", "ติดตามชั้นเรียน")}
          </h1>
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
              className="w-full bg-blue-500 text-white py-3.5 md:py-2.5 px-4 rounded-xl md:rounded-lg hover:bg-blue-600 active:scale-98 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed text-base md:text-sm touch-manipulation shadow-lg shadow-blue-500/20"
            >
              {loading
                ? t("Signing in...", "กำลังเข้าสู่ระบบ...")
                : t("Sign In", "เข้าสู่ระบบ")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
