"use client";

import { useLanguage } from "@/lib/language-context";
import {
    AlertCircle,
    CheckCircle2,
    Download,
    Loader2,
    Music,
    Video,
} from "lucide-react";
import { useState } from "react";

interface DownloadOption {
    quality: string;
    type: "video" | "audio";
    format: string;
}

interface DownloadHistory {
    id: string;
    title: string;
    url: string;
    quality: string;
    type: "video" | "audio";
    timestamp: number;
    status: "completed" | "failed";
}

export function YouTubeDownloader() {
    const { t } = useLanguage();
    const [url, setUrl] = useState("");
    const [selectedQuality, setSelectedQuality] = useState("720p");
    const [selectedType, setSelectedType] = useState<"video" | "audio">("video");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [history, setHistory] = useState<DownloadHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    const videoQualities: DownloadOption[] = [
        { quality: "360p", type: "video", format: "mp4" },
        { quality: "480p", type: "video", format: "mp4" },
        { quality: "720p", type: "video", format: "mp4" },
        { quality: "1080p", type: "video", format: "mp4" },
        { quality: "1440p", type: "video", format: "mp4" },
        { quality: "4K", type: "video", format: "mp4" },
    ];

    const audioQualities: DownloadOption[] = [
        { quality: "128kbps", type: "audio", format: "mp3" },
        { quality: "192kbps", type: "audio", format: "mp3" },
        { quality: "320kbps", type: "audio", format: "mp3" },
    ];

    const validateYouTubeUrl = (url: string): boolean => {
        const patterns = [
            /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/,
            /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]+/,
        ];
        return patterns.some((pattern) => pattern.test(url));
    };

    const extractVideoId = (url: string): string | null => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
            /youtube\.com\/shorts\/([\w-]+)/,
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    const handleDownload = async () => {
        setError("");
        setSuccess("");

        if (!url.trim()) {
            setError(
                t(
                    "Please enter a YouTube URL",
                    "กรุณาใส่ URL ของ YouTube"
                )
            );
            return;
        }

        if (!validateYouTubeUrl(url)) {
            setError(
                t(
                    "Invalid YouTube URL. Please enter a valid YouTube video link.",
                    "URL ของ YouTube ไม่ถูกต้อง กรุณาใส่ลิงก์วิดีโอ YouTube ที่ถูกต้อง"
                )
            );
            return;
        }

        setIsLoading(true);

        try {
            // Extract video ID for history
            const videoId = extractVideoId(url);

            // Call API to download
            const response = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    url,
                    type: selectedType,
                    quality: selectedQuality,
                }),
            });

            if (!response.ok) {
                throw new Error("Download failed");
            }

            // Get filename from response headers or use default
            const contentDisposition = response.headers.get("Content-Disposition");
            const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
            const filename = filenameMatch?.[1] || `download.${selectedType === "audio" ? "mp3" : "mp4"}`;

            // Download file
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            document.body.removeChild(a);

            // Add to history
            const newEntry: DownloadHistory = {
                id: Date.now().toString(),
                title: `Video ID: ${videoId || "Unknown"}`,
                url: url,
                quality: selectedQuality,
                type: selectedType,
                timestamp: Date.now(),
                status: "completed",
            };
            setHistory([newEntry, ...history.slice(0, 9)]); // Keep last 10

            setSuccess(
                t(
                    `Download complete! File saved to your Downloads folder.`,
                    `ดาวน์โหลดเสร็จสิ้น! ไฟล์บันทึกในโฟลเดอร์ดาวน์โหลดของคุณแล้ว`
                )
            );

            // Clear URL after successful processing
            setTimeout(() => {
                setUrl("");
                setSuccess("");
            }, 5000);
        } catch (error) {
            console.error("Download error:", error);
            setError(
                t(
                    "Download failed. Make sure yt-dlp is installed on the server.",
                    "การดาวน์โหลดล้มเหลว ตรวจสอบว่า yt-dlp ติดตั้งบนเซิร์ฟเวอร์แล้ว"
                )
            );
        } finally {
            setIsLoading(false);
        }
    };

    const clearHistory = () => {
        setHistory([]);
        setShowHistory(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Video className="w-7 h-7 text-red-600" />
                    {t("YouTube Downloader", "ดาวน์โหลด YouTube")}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    {t(
                        "Download YouTube videos and audio for educational purposes",
                        "ดาวน์โหลดวิดีโอและเสียง YouTube เพื่อการศึกษา"
                    )}
                </p>
            </div>

            {/* Copyright Disclaimer */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-semibold mb-1">
                            {t("Copyright Notice", "ประกาศเกี่ยวกับลิขสิทธิ์")}
                        </p>
                        <p>
                            {t(
                                "Only download videos you have permission to use. Respect copyright laws and YouTube's Terms of Service. This tool is for educational purposes only.",
                                "ดาวน์โหลดเฉพาะวิดีโอที่คุณได้รับอนุญาตให้ใช้เท่านั้น เคารพกฎหมายลิขสิทธิ์และข้อกำหนดการให้บริการของ YouTube เครื่องมือนี้มีไว้เพื่อการศึกษาเท่านั้น"
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Downloader Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                {/* URL Input */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t("YouTube Video URL", "URL วิดีโอ YouTube")}
                    </label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={t(
                            "https://www.youtube.com/watch?v=...",
                            "https://www.youtube.com/watch?v=..."
                        )}
                        className="w-full px-4 py-3 md:py-2 text-base md:text-sm border border-gray-300 rounded-xl md:rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white touch-manipulation"
                        disabled={isLoading}
                    />
                </div>

                {/* Type Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        {t("Download Type", "ประเภทการดาวน์โหลด")}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                setSelectedType("video");
                                setSelectedQuality("720p");
                            }}
                            disabled={isLoading}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${selectedType === "video"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <Video className="w-5 h-5" />
                            <span className="font-medium">
                                {t("Video", "วิดีโอ")}
                            </span>
                        </button>
                        <button
                            onClick={() => {
                                setSelectedType("audio");
                                setSelectedQuality("192kbps");
                            }}
                            disabled={isLoading}
                            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${selectedType === "audio"
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                                } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                            <Music className="w-5 h-5" />
                            <span className="font-medium">
                                {t("Audio Only", "เสียงเท่านั้น")}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Quality Selection */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        {t("Quality", "คุณภาพ")}
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {(selectedType === "video" ? videoQualities : audioQualities).map(
                            (option) => (
                                <button
                                    key={option.quality}
                                    onClick={() => setSelectedQuality(option.quality)}
                                    disabled={isLoading}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all ${selectedQuality === option.quality
                                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                        : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                                        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                                >
                                    {option.quality}
                                </button>
                            )
                        )}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                )}

                {/* Success Message */}
                {success && (
                    <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
                    </div>
                )}

                {/* Download Button */}
                <button
                    onClick={handleDownload}
                    disabled={isLoading || !url.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {t("Processing...", "กำลังประมวลผล...")}
                        </>
                    ) : (
                        <>
                            <Download className="w-5 h-5" />
                            {t("Download", "ดาวน์โหลด")}
                        </>
                    )}
                </button>

                {/* How it Works */}
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                        {t("How to Use", "วิธีใช้งาน")}
                    </h3>
                    <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                1.
                            </span>
                            <span>
                                {t(
                                    "Paste YouTube video URL",
                                    "วาง URL วิดีโอ YouTube"
                                )}
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                2.
                            </span>
                            <span>
                                {t(
                                    "Select Video or Audio Only",
                                    "เลือกวิดีโอหรือเสียงเท่านั้น"
                                )}
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                3.
                            </span>
                            <span>
                                {t(
                                    "Choose quality",
                                    "เลือกคุณภาพ"
                                )}
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                                4.
                            </span>
                            <span>
                                {t(
                                    "Click Download - file saves directly to your Downloads folder",
                                    "คลิกดาวน์โหลด - ไฟล์บันทึกโดยตรงไปยังโฟลเดอร์ดาวน์โหลดของคุณ"
                                )}
                            </span>
                        </li>
                    </ol>
                </div>
            </div>

            {/* Download History */}
            {history.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {t("Download History", "ประวัติการดาวน์โหลด")}
                        </h3>
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            {showHistory
                                ? t("Hide", "ซ่อน")
                                : t("Show", "แสดง")}{" "}
                            ({history.length})
                        </button>
                    </div>

                    {showHistory && (
                        <div className="space-y-3">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-start justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {item.type === "video" ? (
                                                <Video className="w-4 h-4 text-gray-500" />
                                            ) : (
                                                <Music className="w-4 h-4 text-gray-500" />
                                            )}
                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {item.title}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {item.quality} • {new Date(item.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                </div>
                            ))}
                            <button
                                onClick={clearHistory}
                                className="w-full text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 py-2"
                            >
                                {t("Clear History", "ล้างประวัติ")}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
