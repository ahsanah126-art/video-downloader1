// HTTP layer for /api/info and /api/download.
// Validates input, delegates to services/ytdlp.js, shapes the response.

import { fetchInfo, streamDownload } from "../services/ytdlp.js";

const URL_RE = /^https?:\/\/[^\s"'<>]+$/i;

function assertUrl(u) {
  if (typeof u !== "string" || !URL_RE.test(u)) {
    const err = new Error("Invalid URL");
    err.status = 400;
    throw err;
  }
  return u;
}

export async function getInfo(req, res, next) {
  try {
    const url = assertUrl(req.body?.url);
    const info = await fetchInfo(url);

    const formats = (info.formats ?? [])
      .filter((f) => f.vcodec !== "none" || f.acodec !== "none")
      .map((f) => ({
        format_id: f.format_id,
        ext: f.ext,
        quality: f.vcodec === "none" ? "audio" : `${f.height ?? "?"}p`,
        filesize: f.filesize ?? f.filesize_approx,
        type: f.vcodec === "none" ? "audio" : "video",
        note: f.format_note,
      }));

    res.json({
      id: info.id,
      title: info.title,
      thumbnail: info.thumbnail,
      duration: info.duration ?? 0,
      uploader: info.uploader ?? info.channel ?? "",
      webpage_url: info.webpage_url ?? url,
      formats,
    });
  } catch (e) {
    next(e);
  }
}

export async function download(req, res, next) {
  try {
    const url = assertUrl(req.query.url);
    const format = String(req.query.format ?? "best").replace(/[^\w.+-]/g, "") || "best";
    const filename = `video-${Date.now()}`;

    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/octet-stream");

    streamDownload({ url, format, res });
  } catch (e) {
    next(e);
  }
}
