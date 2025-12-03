"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { Home, Image as ImageIcon, ChevronDown, LogOut, UserCog, CreditCard, ChevronRight, Plus, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { UploadModal } from "./upload-modal";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  currentPath: string;
}

const NavLink = ({ href, icon, label, currentPath }: NavLinkProps) => {
  const isActive = currentPath === href || (href !== "/" && currentPath.startsWith(href));

  return (
    <Link
      href={href}
      className={cn(
        "text-sm font-medium flex items-center px-3 py-2 rounded transition-colors",
        isActive ? "text-white bg-[#1a9fff] hover:bg-[#1a9fff]/90" : "text-[#b8b6b4] hover:bg-[#2a3f5a] hover:text-white"
      )}
    >
      <span className="mr-1.5">{icon}</span>
      {label}
    </Link>
  );
};

const DropdownMenu = ({
  isOpen,
  onClose,
  userEmail,
  onSignOut,
}: {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  onSignOut: () => void;
}) => {
  return (
    <div
      className={cn(
        "absolute right-0 mt-2 w-64 rounded-lg bg-[#2a3f5a] shadow-xl border border-[#3d5568] overflow-hidden transition-all duration-200 ease-in-out",
        isOpen ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-2">
        {/* ユーザー情報セクション */}
        <div className="px-4 py-3 border-b border-[#3d5568] mb-1">
          <p className="text-sm font-medium text-white truncate">{userEmail || "ゲストユーザー"}</p>
          <p className="text-xs text-[#8f98a0]">無料プラン</p>
        </div>

        {/* メニューアイテム */}
        <Link
          href="/settings/profile"
          className="flex items-center justify-between px-4 py-3 text-sm text-[#c7d5e0] hover:bg-[#3d5568] hover:text-white rounded-md transition-colors"
        >
          <div className="flex items-center">
            <UserCog className="mr-3 h-5 w-5 text-[#8f98a0]" />
            ユーザー設定
          </div>
          <ChevronRight className="h-4 w-4 text-[#8f98a0]" />
        </Link>

        <Link
          href="/settings/subscription"
          className="flex items-center justify-between px-4 py-3 text-sm text-[#c7d5e0] hover:bg-[#3d5568] hover:text-white rounded-md transition-colors"
        >
          <div className="flex items-center">
            <CreditCard className="mr-3 h-5 w-5 text-[#8f98a0]" />
            サブスクリプション
          </div>
          <ChevronRight className="h-4 w-4 text-[#8f98a0]" />
        </Link>

        <div className="border-t border-[#3d5568] my-1" />

        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-left text-[#ff6b6b] hover:bg-[#3d5568] rounded-md transition-colors"
        >
          <div className="flex items-center">
            <LogOut className="mr-3 h-5 w-5" />
            ログアウト
          </div>
        </button>
      </div>
    </div>
  );
};

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email || null);
    };

    fetchUser();

    // ドキュメント全体のクリックを監視して、メニューの外側をクリックしたら閉じる
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    // キーダウンイベントを追加（ESCキーでメニューを閉じる）
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("ログアウトに失敗しました");
    } else {
      router.push("/login");
      router.refresh();
    }
  };

  const handleUploadSuccess = () => {
    setIsUploadModalOpen(false);
    // 現在のページがスクリーンショット一覧の場合はリフレッシュ
    if (pathname === "/screenshots") {
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#3d5568] bg-[#171a21] shadow-sm">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-white">EpicSnap</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-1">
            <NavLink href="/dashboard" icon={<Home className="h-4 w-4" />} label="ダッシュボード" currentPath={pathname} />
            <NavLink href="/screenshots" icon={<ImageIcon className="h-4 w-4" />} label="スクリーンショット" currentPath={pathname} />
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <Button size="sm" className="bg-[#1a9fff] hover:bg-[#1a9fff]/90 text-white" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="mr-1.5 h-4 w-4" />
            アップロード
          </Button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="flex items-center space-x-2 text-sm font-medium text-[#b8b6b4] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a9fff] focus:ring-offset-2 focus:ring-offset-[#171a21] rounded-md p-1"
              aria-expanded={isMenuOpen}
              aria-haspopup="true"
            >
              <div className="h-8 w-8 rounded-full bg-[#1a9fff] flex items-center justify-center text-white font-medium">
                {userEmail?.charAt(0).toUpperCase() || "U"}
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isMenuOpen ? "rotate-180" : "")} />
            </button>

            <DropdownMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} userEmail={userEmail} onSignOut={handleSignOut} />
          </div>
        </div>
      </div>

      {/* アップロードモーダル */}
      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={handleUploadSuccess} />
    </header>
  );
}
