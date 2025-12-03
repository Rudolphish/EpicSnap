"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Upload, Image as ImageIcon, Album } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/header";
import { UploadModal } from "@/components/upload-modal";

// 型定義
type Screenshot = {
  id: string;
  created_at: string;
  url: string;
  title: string;
  file_path: string;
  imageUrl?: string; // 画像の公開URLを格納するためのオプショナルなプロパティ
};

type Album = {
  id: string;
  title: string;
  created_at: string;
  album_screenshots?: Array<{
    screenshot_id: string;
    screenshots: { id: string };
  }>;
  screenshot_count?: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [title, setTitle] = useState("");
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      const filePath = `${session.user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("screenshots").upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: screenshotData, error: screenshotError } = await supabase
        .from("screenshots")
        .insert([
          {
            user_id: session.user.id,
            title: title || file.name.split(".")[0],
            file_path: filePath,
            url: filePath,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (screenshotError) throw screenshotError;

      if (selectedAlbumId && screenshotData) {
        const { error: albumScreenshotError } = await supabase.from("album_screenshots").insert([
          {
            album_id: selectedAlbumId,
            screenshot_id: screenshotData.id,
          },
        ]);

        if (albumScreenshotError) throw albumScreenshotError;
      }

      toast.success("アップロードが完了しました");
      handleUploadSuccess();
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error("アップロードエラー:", error);
      toast.error("アップロード中にエラーが発生しました");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchData();
    toast.success("アップロードが完了しました！");
  };

  const fetchData = async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.push("/login");
        return;
      }

      // スクリーンショットの取得
      const { data: screenshotsData, error: screenshotsError } = await supabase
        .from("screenshots")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(8);

      if (screenshotsError) throw screenshotsError;

      // 画像のURLを取得
      const screenshotsWithUrl =
        screenshotsData?.map((screenshot) => ({
          ...screenshot,
          // Storageから公開URLを取得
          imageUrl: supabase.storage.from("screenshots").getPublicUrl(screenshot.file_path).data.publicUrl,
        })) || [];

      // アルバムの取得
      const { data: albumsData, error: albumsError } = await supabase
        .from("albums")
        .select("*, album_screenshots(count)")
        .eq("owner_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (albumsError) throw albumsError;

      // アルバムに含まれるスクリーンショットの数を計算
      const albumsWithCount =
        albumsData?.map((album) => ({
          ...album,
          screenshot_count: album.album_screenshots?.[0]?.count || 0,
        })) || [];

      setScreenshots(screenshotsWithUrl);
      setAlbums(albumsWithCount);
    } catch (error) {
      console.error("データの取得中にエラーが発生しました:", error);
      toast.error("データの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a9fff]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1b2838] text-[#c7d5e0]">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">ダッシュボード</h1>
          <Button onClick={() => setIsUploadModalOpen(true)} className="bg-[#1a9fff] hover:bg-[#00adee] text-white font-medium">
            <Upload className="mr-2 h-4 w-4" />
            アップロード
          </Button>
        </div>

        {/* スクリーンショット一覧 */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4">最近のスクリーンショット</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {screenshots.map((screenshot) => (
              <Card key={screenshot.id} className="bg-[#2a3f5a] border-[#3d5568] overflow-hidden">
                <div className="aspect-video bg-gray-800 flex items-center justify-center overflow-hidden">
                  {screenshot.imageUrl ? (
                    <img src={screenshot.imageUrl} alt={screenshot.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-500" />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-white truncate">{screenshot.title}</h3>
                  <p className="text-sm text-gray-400">{new Date(screenshot.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* アルバム一覧 */}
        <div>
          <h2 className="text-xl font-semibold mb-4">アルバム</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {albums.map((album) => (
              <Card key={album.id} className="bg-[#2a3f5a] border-[#3d5568] hover:border-[#1a9fff] transition-colors">
                <CardHeader className="p-4">
                  <div className="flex items-center space-x-3">
                    <Album className="h-5 w-5 text-[#1a9fff]" />
                    <CardTitle className="text-lg font-semibold text-white">{album.title}</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">{album.screenshot_count || 0} 枚の画像</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <UploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} onUploadSuccess={handleUploadSuccess} />
    </div>
  );
}
