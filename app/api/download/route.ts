import { exec } from "child_process";
import { readFile, unlink } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { tmpdir } from "os";
import { join } from "path";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const { url, type, quality } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const tempDir = tmpdir();
    const outputTemplate = join(tempDir, `yt-download-${timestamp}`);

    let command = "";

    if (type === "audio") {
      // Audio only - extract best audio and convert to mp3
      command = `yt-dlp -x --audio-format mp3 --audio-quality 0 -o "${outputTemplate}.%(ext)s" "${url}"`;
    } else {
      // Video - download best quality up to selected resolution
      const resolutionMap: { [key: string]: string } = {
        "360p": "360",
        "480p": "480",
        "720p": "720",
        "1080p": "1080",
        "1440p": "1440",
        "4K": "2160",
      };
      const height = resolutionMap[quality] || "720";
      command = `yt-dlp -f "bestvideo[height<=${height}]+bestaudio/best[height<=${height}]" --merge-output-format mp4 -o "${outputTemplate}.%(ext)s" "${url}"`;
    }

    // Execute yt-dlp
    await execAsync(command);

    // Find the downloaded file (yt-dlp adds extension)
    const extension = type === "audio" ? "mp3" : "mp4";
    const filePath = `${outputTemplate}.${extension}`;

    // Get video title from yt-dlp output for better filename
    const titleCommand = `yt-dlp --get-title "${url}"`;
    const { stdout: titleOutput } = await execAsync(titleCommand);
    const videoTitle =
      titleOutput
        .trim()
        .replace(/[<>:"/\\|?*]/g, "_")
        .substring(0, 100) || "download";

    // Read file
    const fileBuffer = await readFile(filePath);

    // Clean up temp file
    await unlink(filePath);

    // Return file as download with actual video title
    return new NextResponse(fileBuffer as unknown as BodyInit, {
      headers: {
        "Content-Type": type === "audio" ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="${videoTitle}.${extension}"`,
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Download failed";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
