// src/app/signup/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      // メール確認が必要な場合
      if (data?.user?.identities?.length === 0) {
        alert("このメールアドレスは既に登録されています。");
      } else {
        alert("確認メールを送信しました。メールを確認してください。");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      const errorMessage = error instanceof Error ? error.message : "予期せぬエラーが発生しました";
      alert("サインアップ中にエラーが発生しました: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800/50 p-8 shadow-2xl backdrop-blur-sm">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">アカウントを作成</h2>
        </div>
        {error && <div className="rounded-md bg-red-500/20 p-4 text-sm text-red-300">{error}</div>}
        <form className="mt-8 space-y-6" onSubmit={handleSignUp}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="sr-only">
                メールアドレス
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="メールアドレス"
                className="w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                パスワード
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード（6文字以上）"
                className="w-full bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                minLength={6}
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? "アカウント作成中..." : "アカウントを作成"}
            </Button>
          </div>
        </form>
        <div className="text-center text-sm text-gray-400">
          すでにアカウントをお持ちですか？{" "}
          <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
            ログイン
          </Link>
        </div>
      </div>
    </div>
  );
}
