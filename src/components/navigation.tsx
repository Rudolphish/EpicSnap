// src/components/navigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { User } from "@supabase/supabase-js";

export function Navigation() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Screenshots", href: "/screenshots" },
    { name: "Community", href: "/community" },
  ];

  return (
    <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50">
      <nav className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            EpicSnap
          </Link>
          <div className="ml-8 flex space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-700/50">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-white">{user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700 text-white" align="end">
                <div className="px-2 py-1.5 text-sm font-medium">
                  <div className="truncate">{user.email}</div>
                </div>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem className="hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
                  ユーザー設定
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-700 focus:bg-gray-700 cursor-pointer">
                  サブスクリプション設定
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem 
                  onClick={handleSignOut}
                  className="text-red-400 hover:bg-gray-700 focus:bg-gray-700 cursor-pointer"
                >
                  ログアウト
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
    </header>
  );
}
