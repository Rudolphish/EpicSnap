// src\app\albums\page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { Download, Calendar, Image as ImageIcon, Home, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Skeleton from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { ImageModal } from "@/components/image-modal";
import { UploadModal } from "@/components/upload-modal";

interface Album {
  id: string;
  url: string;
  downloadUrl: string;
  created_at: string;
  title: string;
}

export default function AlbumsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // アルバム一覧を取得する関数
  const fetchAlbums = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push("/login");
        return;
      }

      // ユーザー情報を状態に保存
      setUser(session.user);

      // アルバムの取得
      const { data: screenshotsData, error: screenshotsError } = await supabase.from("albums").select("*").order("created_at", { ascending: false });

      console.log(JSON.stringify(screenshotsData, null, 2));

      if (!screenshotsError && screenshotsData) {
        setAlbums(screenshotsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("データの読み込み中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // モーダルの表示状態
  const isImageModalOpen = selectedImageIndex !== null;

  // モーダルを閉じる
  const closeImageModal = useCallback(() => {
    setSelectedImageIndex(null);
  }, []);

  const handleUploadSuccess = useCallback(async () => {
    setIsUploadModalOpen(false);
    // アルバム一覧を再読み込み
    await fetchAlbums();
  }, [fetchAlbums]);

  // 前の画像に移動
  const goToPrevImage = useCallback(() => {
    if (selectedImageIndex === null || selectedImageIndex <= 0) return;
    setSelectedImageIndex((prev) => (prev !== null ? prev - 1 : null));
  }, [selectedImageIndex]);

  // 次の画像に移動
  const goToNextImage = useCallback(() => {
    if (selectedImageIndex === null || selectedImageIndex >= albums.length - 1) return;
    setSelectedImageIndex((prev) => (prev !== null ? prev + 1 : null));
  }, [selectedImageIndex, albums.length]);

  // コンポーネントマウント時にアルバムを取得
  useEffect(() => {
    fetchAlbums();
  }, [fetchAlbums]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1b2838] text-[#c7d5e0]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <Skeleton className="h-9 w-48 mb-2 bg-[#2a3f5a]" />
              <Skeleton className="h-4 w-64 bg-[#2a3f5a]" />
            </div>
            <Skeleton className="h-9 w-32 bg-[#1a9fff]" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-[#2a3f5a] rounded border border-[#3d5568] overflow-hidden">
                <Skeleton className="w-full aspect-video bg-[#1f2a38]" />
                <div className="p-3">
                  <Skeleton className="h-5 w-4/5 mb-2 bg-[#3d5568]" />
                  <Skeleton className="h-3 w-1/2 bg-[#3d5568]" />
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b2838] text-[#c7d5e0]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">アルバム一覧</h1>
            <p className="text-[#8f98a0] text-sm">アップロードしたアルバムが表示されます</p>
          </div>
          <Button className="bg-[#1a9fff] hover:bg-[#00adee] text-white font-medium transition-colors" onClick={() => setIsUploadModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            新しいアルバム
          </Button>
        </div>

        {albums.length === 0 ? (
          <div className="text-center py-16 bg-[#2a3f5a] rounded border border-[#3d5568] shadow-lg">
            <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-[#2a3f5a] mb-4 border-2 border-dashed border-[#3d5568]">
              <ImageIcon className="h-10 w-10 text-[#5f98c5]" />
            </div>
            <h3 className="text-xl font-medium text-white mb-2">アルバムがありません</h3>
            <p className="text-[#8f98a0] mb-6 max-w-md mx-auto">新しいアルバムをアップロードして、コレクションを始めましょう</p>
            <Button className="bg-[#1a9fff] hover:bg-[#00adee] text-white font-medium transition-colors" asChild>
              <Link href="/albums/upload">
                <ImageIcon className="mr-2 h-4 w-4" />
                アルバムを作成
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {albums.map((album, index) => (
              <div
                key={album.id}
                className="group relative overflow-hidden rounded bg-[#2a3f5a] border border-[#3d5568] transition-all duration-200 hover:border-[#5f98c5] hover:shadow-[0_0_10px_rgba(31,195,238,0.3)] cursor-pointer"
                onClick={() => setSelectedImageIndex(index)}
              >
                <div className="relative w-full aspect-video overflow-hidden bg-[#1f2a38]">
                  <Image
                    src={album.url}
                    alt={album.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    priority={index < 4} // 最初の4枚を優先的に読み込む
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                    <Button
                      className="bg-[#1a9fff] hover:bg-[#00adee] text-white text-sm font-medium px-3 py-1.5 opacity-0 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={album.downloadUrl} download>
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        ダウンロード
                      </a>
                    </Button>
                  </div>
                </div>
                <div className="p-3">
                  <h2 className="font-medium text-white text-sm line-clamp-1 mb-1.5">{album.title}</h2>
                  <div className="flex items-center text-xs text-[#8f98a0]">
                    <Calendar className="mr-1.5 h-3 w-3 flex-shrink-0 text-[#5f98c5]" />
                    <span className="truncate">{album.created_at ? format(new Date(album.created_at), "yyyy/MM/dd HH:mm") : "--/--/-- --:--"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 画像表示モーダル */}
        {isImageModalOpen && selectedImageIndex !== null && (
          <ImageModal
            isOpen={isImageModalOpen}
            onClose={closeImageModal}
            imageUrl={albums[selectedImageIndex]?.url}
            downloadUrl={albums[selectedImageIndex]?.downloadUrl}
            title={albums[selectedImageIndex]?.title}
            onPrev={goToPrevImage}
            onNext={goToNextImage}
            hasPrev={selectedImageIndex > 0}
            hasNext={selectedImageIndex < albums.length - 1}
          />
        )}

        {/* アップロードモーダル */}
        <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={handleUploadSuccess} />
      </main>
    </div>
  );
}
