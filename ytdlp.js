// Thin wrapper around the yt-dlp binary.
// Requires yt-dlp and ffmpeg on PATH (or via YTDLP_PATH / FFMPEG_PATH env vars).

import { spawn } from "node:child_process";

const YTDLP = process.env.YTDLP_PATH || "yt-dlp";
const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";

function baseArgs() {
  return ["--ffmpeg-location", FFMPEG, "--no-warnings", "--no-playlist"];
}

/** Run yt-dlp and buffer stdout as string. */
function runBuffered(args) {
  return new Promise((resolve, reject) => {
    const p = spawn(YTDLP, args);
    let out = "";
    let err = "";
    p.stdout.on("data", (d) => (out += d));
    p.stderr.on("data", (d) => (err += d));
    p.on("error", (e) => reject(e));
    p.on("close", (code) =>
      code === 0 ? resolve(out) : reject(new Error(err.trim() || `yt-dlp exited ${code}`)),
    );
  });
}

/** Fetch metadata + formats for a URL. */
export async function fetchInfo(url) {
  const raw = await runBuffered([...baseArgs(), "-J", url]);
  return JSON.parse(raw);
}

/** Stream a download directly to the HTTP response. */
export function streamDownload({ url, format, res }) {
  const args = [
    ...baseArgs(),
    "-f",
    format,
    "-o",
    "-", // stdout
    url,
  ];

  const p = spawn(YTDLP, args);

  p.stdout.pipe(res);
  p.stderr.on("data", (d) => {
    // eslint-disable-next-line no-console
    console.error("[yt-dlp]", d.toString().trim());
  });
  p.on("error", (e) => {
    // eslint-disable-next-line no-console
    console.error("[yt-dlp spawn error]", e);
    if (!res.headersSent) res.status(500);
    res.end();
  });
  p.on("close", () => res.end());

  // If the client disconnects, kill the process so we don't leak.
  res.req.on("close", () => {
    if (!p.killed) p.kill("SIGKILL");
  });
}
