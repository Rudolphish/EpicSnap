// src/app/page.tsx
"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Gamepad2, Camera, Share2, Trophy, Users, Zap } from "lucide-react";

export default function Home() {
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/game-pattern.jpg')] opacity-25" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:flex lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
              <span className="block bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">EpicSnap</span>
              <span className="block">ゲーマーのためのスクリーンショット共有</span>
            </h1>
            <p className="mt-6 max-w-lg text-xl text-gray-300">
              あなたのゲームプレイを世界に共有しよう。EpicSnapは、ゲーマーが手軽にスクリーンショットを共有し、コミュニティとつながるためのプラットフォームです。
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              {!session ? (
                <>
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-8 py-6 text-lg font-semibold"
                  >
                    <Link href="/login">今すぐ始める</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700/50 hover:text-white px-8 py-6 text-lg font-semibold"
                    asChild
                  >
                    <Link href="#features">特徴を見る</Link>
                  </Button>
                </>
              ) : (
                <Button
                  asChild
                  className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-8 py-6 text-lg font-semibold"
                >
                  <Link href="/dashboard">ダッシュボードへ</Link>
                </Button>
              )}
            </div>
          </div>
          <div className="mt-16 lg:mt-0">
            <div className="relative rounded-2xl bg-gray-800/50 backdrop-blur-sm p-2 border border-gray-700 shadow-2xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl opacity-30 blur" />
              <img
                className="relative rounded-lg"
                src="/images/game-screenshot-placeholder.jpg"
                alt="ゲームスクリーンショットの例"
                width={600}
                height={400}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gray-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">EpicSnapの特徴</h2>
            <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-300">ゲーマーのための機能が満載</p>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: <Camera className="h-8 w-8 text-blue-400" />,
                  title: "簡単共有",
                  description: "ワンクリックでスクリーンショットをアップロードし、コミュニティと共有できます。",
                },
                {
                  icon: <Gamepad2 className="h-8 w-8 text-purple-400" />,
                  title: "ゲーム別整理",
                  description: "プレイしているゲームごとにスクリーンショットを自動で整理。",
                },
                {
                  icon: <Trophy className="h-8 w-8 text-yellow-400" />,
                  title: "アチーブメント共有",
                  description: "ゲーム内の特別な瞬間を記録して自慢しよう。",
                },
                {
                  icon: <Share2 className="h-8 w-8 text-green-400" />,
                  title: "ソーシャル連携",
                  description: "TwitterやDiscordと連携して、簡単に共有できます。",
                },
                {
                  icon: <Users className="h-8 w-8 text-red-400" />,
                  title: "コミュニティ",
                  description: "同じゲームをプレイする仲間とつながりましょう。",
                },
                {
                  icon: <Zap className="h-8 w-8 text-orange-400" />,
                  title: "高速アップロード",
                  description: "高解像度の画像も高速でアップロード可能。",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="rounded-2xl bg-gray-800/50 p-8 backdrop-blur-sm border border-gray-700 hover:border-blue-500/50 transition-all duration-300"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700">{feature.icon}</div>
                  <h3 className="mt-6 text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!session && (
        <section className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gray-800/50 px-6 py-16 sm:p-16">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">今すぐ無料ではじめよう</h2>
                <p className="mx-auto mt-4 max-w-2xl text-xl text-gray-300">
                  EpicSnapに登録して、あなたのゲームプレイを世界中のゲーマーと共有しましょう。
                </p>
                <div className="mt-8 flex justify-center">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white px-8 py-6 text-lg font-semibold"
                  >
                    <Link href="/signup">無料でアカウントを作成</Link>
                  </Button>
                </div>
                <p className="mt-4 text-sm text-gray-400">
                  すでにアカウントをお持ちですか？{" "}
                  <Link href="/login" className="font-medium text-blue-400 hover:text-blue-300">
                    ログイン
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
