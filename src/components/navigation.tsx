// src/components/navigation.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";

export function Navigation() {
  const pathname = usePathname();

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
        <Button onClick={handleSignOut} variant="outline" className="bg-blue-600 hover:bg-blue-700 border-blue-500 text-white hover:text-white">
          Sign Out
        </Button>
      </nav>
    </header>
  );
}
