"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Image as ImageIcon, Album } from "lucide-react";
import { toast } from "sonner";

type Screenshot = {
  id: string;
  created_at: string;
  url: string;
  title: string;
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

// アップロードモーダルのコンポーネント
function UploadModal({ isOpen, onClose, onUploadSuccess }: { isOpen: boolean; onClose: () => void; onUploadSuccess: () => void }) {
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [availableAlbums, setAvailableAlbums] = useState<Album[]>([]);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // プレビュー用のURLを生成
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;

    setIsUploading(true);

    try {
      // 1. ファイルをアップロード
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("screenshots").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) throw uploadError;

      // 2. 公開URLを取得
      const {
        data: { publicUrl },
      } = supabase.storage.from("screenshots").getPublicUrl(filePath);

      // 3. スクリーンショットをデータベースに保存
      const { data: screenshotData, error: screenshotError } = await supabase
        .from("screenshots")
        .insert([
          {
            user_id: user.id,
            title: title || `スクリーンショット ${new Date().toLocaleString()}`,
            file_name: file.name,
            file_path: filePath,
            url: publicUrl,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (screenshotError) throw screenshotError;

      // 4. アルバムが選択されていれば、中間テーブルに登録
      if (selectedAlbumId && screenshotData) {
        const { error: albumScreenshotError } = await supabase.from("album_screenshots").insert([
          {
            album_id: selectedAlbumId,
            screenshot_id: screenshotData.id,
          },
        ]);

        if (albumScreenshotError) throw albumScreenshotError;
      }

      toast.success("スクリーンショットをアップロードしました");
      onUploadSuccess();
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      let errorMessage = "不明なエラーが発生しました";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      toast.error(`アップロード中にエラーが発生しました: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  // モーダルが閉じるときにプレビューURLを解放
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const fetchAlbums = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // 1. オーナーとしてのアルバムを取得
        const { data: ownedAlbums, error: ownedError } = await supabase.from("albums").select("*").eq("owner_id", user.id);

        if (ownedError) throw ownedError;

        // 2. メンバーとしてのアルバムを取得
        const { data: memberAlbums, error: memberError } = await supabase
          .from("album_members")
          .select(
            `
            album_id,
            albums!inner(*)
          `
          )
          .eq("user_id", user.id);

        if (memberError) throw memberError;

        // 3. 結果をマージ
        const allAlbums = [...(ownedAlbums || []), ...(memberAlbums?.map((member) => member.albums) || [])];

        // 4. 重複を削除
        const uniqueAlbums = Array.from(new Map(allAlbums.map((album) => [album.id, album])).values());

        setAvailableAlbums(uniqueAlbums);
      } catch (error) {
        console.error("アルバムの取得に失敗しました:", error);
        toast.error("アルバムの取得に失敗しました");
      }
    };

    fetchAlbums();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-md mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">スクリーンショットをアップロード</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* プレビューエリア */}
            <div className="relative aspect-video bg-gray-700/50 rounded-lg overflow-hidden border-2 border-dashed border-gray-600 flex items-center justify-center">
              {previewUrl ? (
                <img src={previewUrl} alt="プレビュー" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6">
                  <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-400">画像をドラッグ＆ドロップ</p>
                  <p className="text-xs text-gray-500 mt-1">または</p>
                </div>
              )}
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
                required
              />
            </div>

            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                タイトル（任意）
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="スクリーンショットのタイトル"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isUploading}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={!file || isUploading}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-medium rounded-md shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    アップロード中...
                  </>
                ) : (
                  "アップロード"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [user, setUser] = useState<any>(null);

  // セッション確認とデータ読み込み
  useEffect(() => {
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

        // ユーザー情報を状態に保存
        setUser(session.user);

        // スクリーンショットの取得
        const { data: screenshotsData, error: screenshotsError } = await supabase
          .from("screenshots")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(4);

        console.log(JSON.stringify(screenshotsData, null, 2));

        if (!screenshotsError && screenshotsData) {
          setScreenshots(screenshotsData);
        }

        // アルバムの取得
        const { data: albumsData, error: albumsError } = await supabase
          .from("albums")
          .select(`*,album_screenshots!inner(screenshot_id,screenshots(id))`)
          .order("created_at", { ascending: false })
          .limit(3);

        if (albumsData) {
          const albumsWithCounts = albumsData.map((album) => ({
            ...album,
            screenshot_count: album.album_screenshots?.length || 0,
          }));
          setAlbums(albumsWithCounts);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("データの読み込み中にエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleUploadSuccess = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("ユーザーが認証されていません");
      }

      const { data, error } = await supabase
        .from("screenshots")
        .select("*")
        .eq("user_id", user.id) // 現在のユーザーのみをフィルタリング
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("Fetched screenshots:", data);
      setScreenshots(data || []);
    } catch (error) {
      console.error("Error fetching screenshots:", error);
      let errorMessage = "不明なエラーが発生しました";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }
      toast.error(`スクリーンショットの取得に失敗しました: ${errorMessage}`);
    }
  };

  // スクリーンショット一覧を取得する関数
  const fetchScreenshots = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.from("screenshots").select("*").eq("user_id", user.id).order("created_at", { ascending: false });

      if (error) throw error;

      setScreenshots(data || []);
    } catch (error) {
      console.error("Error fetching screenshots:", error);
    }
  };

  // スクリーンショットのアップロード
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // ストレージにアップロード
      const { error: uploadError } = await supabase.storage.from("screenshots").upload(filePath, file);

      if (uploadError) throw uploadError;

      // データベースに記録
      const { error: dbError } = await supabase.from("screenshots").insert([
        {
          title: title || file.name.split(".")[0],
          url: filePath,
          user_id: (await supabase.auth.getSession()).data.session?.user.id,
        },
      ]);

      if (dbError) throw dbError;

      // 成功メッセージ
      toast.success("アップロード完了", {
        description: "スクリーンショットをアップロードしました",
      });

      // フォームをリセット
      setFile(null);
      setTitle("");

      // 一覧を更新
      const { data: newScreenshots } = await supabase.from("screenshots").select("*").order("created_at", { ascending: false }).limit(4);

      if (newScreenshots) {
        setScreenshots(newScreenshots);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("アップロードエラー", {
        description: "ファイルのアップロード中にエラーが発生しました",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-gray-100 p-4 md:p-8">
      {/* ヘッダー */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">EpicSnap</h1>
          <p className="text-gray-400">最近のアクティビティとクイックアクション</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => router.push("/albums/new")}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 transition-all duration-200 shadow-lg shadow-blue-500/20"
          >
            <Plus className="mr-2 h-4 w-4" /> アルバムを作成
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsModalOpen(true)}
            className="border-blue-400 text-blue-300 hover:bg-blue-500/10 hover:text-blue-200 transition-colors"
          >
            <Upload className="mr-2 h-4 w-4" /> アップロード
          </Button>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* アルバム一覧 */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Album className="h-5 w-5 text-blue-400" />
              マイアルバム
            </CardTitle>
            <CardDescription className="text-gray-400">最近作成したアルバム</CardDescription>
          </CardHeader>
          <CardContent>{/* アルバム一覧のコンテンツ */}</CardContent>
        </Card>

        {/* 最近のスクリーンショット */}
        <Card className="col-span-1 md:col-span-2 bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-cyan-400" />
              最近のスクリーンショット
            </CardTitle>
            <CardDescription className="text-gray-400">最近アップロードしたスクリーンショット</CardDescription>
          </CardHeader>
          <CardContent>
            {screenshots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {screenshots.map((screenshot) => (
                  <div
                    key={screenshot.id}
                    className="group relative aspect-video rounded-lg overflow-hidden bg-gray-700/50 hover:bg-gray-600/50 transition-colors duration-200"
                  >
                    <img src={screenshot.url} alt={screenshot.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                      <div className="w-full">
                        <p className="text-sm font-medium text-white truncate">{screenshot.title}</p>
                        <p className="text-xs text-gray-300">{new Date(screenshot.created_at).toLocaleDateString("ja-JP")}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>アップロードされたスクリーンショットはありません</p>
                <Button variant="link" className="mt-2 text-blue-400" onClick={() => setIsModalOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  今すぐアップロード
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* アクティビティ */}
        <Card className="col-span-1 md:col-span-2 lg:col-span-1 bg-gray-800/50 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold">最近のアクティビティ</CardTitle>
          </CardHeader>
          <CardContent>{/* アクティビティ一覧のコンテンツ */}</CardContent>
        </Card>
      </div>

      {/* アップロードモーダル */}
      <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUploadSuccess={fetchScreenshots} />

      {/* <UploadModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUploadSuccess={fetchScreenshots} user={user} /> */}
    </div>
  );
}
