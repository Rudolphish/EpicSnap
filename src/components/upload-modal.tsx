"use client";

import { useState, useRef, useEffect } from "react";
import { X, Upload, Image as ImageIcon, Video, File, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
}

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // ドラッグ&ドロップのイベントハンドラ
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (file: File) => {
    // ファイルタイプの検証（画像と動画のみ許可）
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
    if (!validTypes.includes(file.type)) {
      toast.error("サポートされていないファイル形式です。画像または動画を選択してください。");
      return;
    }

    // ファイルサイズの制限（50MB）
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("ファイルサイズが大きすぎます。50MB以下のファイルを選択してください。");
      return;
    }

    // ファイル名から拡張子を除いたものをデフォルトのタイトルに設定
    const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
    setTitle(fileNameWithoutExt);
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. ファイルをアップロード
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `screenshots/${fileName}`;

      // アップロード進捗を監視（Supabase Storage v2ではonProgressオプションがサポートされていないため、別の方法で進捗を表示）
      const { error: uploadError } = await supabase.storage.from("screenshots").upload(filePath, selectedFile, {
        cacheControl: "3600",
        upsert: false,
      });

      // アップロード完了時に進捗を100%に設定
      setUploadProgress(100);

      if (uploadError) throw uploadError;

      // 2. アップロードしたファイルの公開URLを取得
      const {
        data: { publicUrl },
      } = supabase.storage.from("screenshots").getPublicUrl(filePath);

      // 3. データベースにメタデータを保存
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("ユーザーが認証されていません");
      }

      const { error: dbError } = await supabase.from("screenshots").insert([
        {
          user_id: user.id,
          url: publicUrl,
          file_path: filePath,
          title: title.trim(),
          description: description.trim() || null,
          file_type: selectedFile.type,
          file_size: selectedFile.size,
        },
      ]);

      if (dbError) throw dbError;

      // アップロード成功時の処理
      toast.success("アップロードが完了しました！");

      // フォームをリセット
      setSelectedFile(null);
      setTitle("");
      setDescription("");

      // コールバックを実行
      onUploadSuccess?.();
      onClose();
    } catch (error) {
      console.error("アップロードエラー:", error);
      toast.error("アップロード中にエラーが発生しました。");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setTitle("");
    setDescription("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // モーダル外をクリックしたときに閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      // モーダルが開かれたときにフォームをリセット
      if (!isOpen) {
        setSelectedFile(null);
        setTitle("");
        setDescription("");
        setUploadProgress(0);
      }
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-6 w-6 text-blue-400" />;
    if (type.startsWith("video/")) return <Video className="h-6 w-6 text-purple-400" />;
    return <File className="h-6 w-6 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl bg-[#1b2838] rounded-lg shadow-xl border border-[#3d5568] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between p-4 border-b border-[#3d5568] bg-[#2a3f5a]">
          <h2 className="text-lg font-semibold text-white">{selectedFile ? "アップロードの詳細" : "ファイルをアップロード"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="閉じる" disabled={isUploading}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {!selectedFile ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? "border-blue-400 bg-blue-900/20" : "border-[#3d5568] hover:border-[#5f98c5]"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="p-3 bg-[#2a3f5a] rounded-full">
                  <FileUp className="h-8 w-8 text-[#5f98c5]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">ファイルをドラッグ＆ドロップするか、クリックして選択</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WEBP, MP4, WEBM (最大50MB)</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="bg-[#2a3f5a] border-[#3d5568] text-white hover:bg-[#3d5568] hover:border-[#5f98c5]"
                >
                  ファイルを選択
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*" />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* ファイル情報 */}
              <div className="flex items-start space-x-4 p-4 bg-[#2a3f5a] rounded-lg border border-[#3d5568]">
                <div className="flex-shrink-0 p-2 bg-[#1f2a38] rounded-md">{getFileIcon(selectedFile.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-gray-400 hover:text-white transition-colors"
                  aria-label="削除"
                  disabled={isUploading}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 進捗バー */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="w-full bg-[#2a3f5a] rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 text-right">{Math.round(uploadProgress)}% アップロード中...</p>
                </div>
              )}

              {/* タイトルと説明 */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2a3f5a] border border-[#3d5568] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a9fff] focus:border-transparent"
                    placeholder="スクリーンショットのタイトルを入力"
                    disabled={isUploading}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                    説明 (任意)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-[#2a3f5a] border border-[#3d5568] rounded-md text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1a9fff] focus:border-transparent min-h-[80px]"
                    placeholder="スクリーンショットの説明を入力（オプション）"
                    disabled={isUploading}
                    rows={3}
                  />
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  variant="outline"
                  onClick={removeFile}
                  disabled={isUploading}
                  className="border-[#3d5568] text-white hover:bg-[#3d5568] hover:border-[#5f98c5]"
                >
                  キャンセル
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !title.trim()}
                  className="bg-[#1a9fff] hover:bg-[#00adee] text-white font-medium min-w-[120px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      アップロード中...
                    </>
                  ) : (
                    "アップロード"
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
