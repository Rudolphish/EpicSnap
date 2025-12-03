"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  downloadUrl: string;
  title: string;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function ImageModal({ isOpen, onClose, imageUrl, downloadUrl, title, onPrev, onNext, hasPrev = false, hasNext = false }: ImageModalProps) {
  // キーボードイベントのハンドリング
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        onPrev?.();
      } else if (e.key === "ArrowRight" && hasNext) {
        onNext?.();
      }
    },
    [onClose, onPrev, onNext, hasPrev, hasNext]
  );

  // スクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* 閉じるボタン */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
        aria-label="閉じる"
      >
        <X className="h-6 w-6" />
      </button>

      {/* 前の画像へ移動 */}
      {hasPrev && (
        <button
          onClick={onPrev}
          className="absolute left-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          aria-label="前の画像"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {/* 画像表示エリア */}
      <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
        <Image src={imageUrl} alt={title} width={1200} height={800} className="max-w-full max-h-[90vh] object-contain" priority />
      </div>

      {/* 次の画像へ移動 */}
      {hasNext && (
        <button
          onClick={onNext}
          className="absolute right-4 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
          aria-label="次の画像"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* 画像情報フッター */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
        <div className="container mx-auto flex items-center justify-between">
          <h3 className="text-sm font-medium truncate max-w-[70%]">{title}</h3>
          <Button asChild size="sm" className="bg-[#1a9fff] hover:bg-[#00adee] text-white font-medium transition-colors">
            <a href={downloadUrl} download>
              <Download className="mr-2 h-4 w-4" />
              ダウンロード
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
