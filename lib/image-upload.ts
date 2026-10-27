/**
 * 上传前的图片处理：把截图/照片压到适合博客的尺寸。
 *
 * 为什么非压不可：`public/` 会进每一次部署的应用层，而 runner → 服务器的
 * 上传实测只有 16–20 KB/s。一张 2MB 的图会让**此后每次**部署都多花约
 * 1 分钟。压到 100–200KB 后，这项长期成本基本消失。
 *
 * 规则（与界面上给用户的说明一致）：
 *   宽 > 1600px 或 文件 > 500KB  → 等比缩到 1600px、转 WebP(q=0.85)
 *   小图 / GIF / SVG              → 原样上传
 *   压完反而更大                  → 用原图
 *
 * 只用浏览器自带的 createImageBitmap + canvas，不引任何依赖。
 */

const MAX_WIDTH = 1600;
const MAX_BYTES = 500 * 1024;
/** Contents API 本身能收大文件，但部署链路受不了；10MB 是硬上限。 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export type PreparedImage = { bytes: Uint8Array; ext: string };

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "image/avif": "avif",
};

function extOf(file: File): string {
  return EXT_BY_MIME[file.type] ?? "bin";
}

export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith("image/")) throw new Error("unsupported");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("too-large");

  const original: PreparedImage = {
    bytes: new Uint8Array(await file.arrayBuffer()),
    ext: extOf(file),
  };

  // GIF 可能是动图，SVG 是矢量：重新编码只会丢东西。
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return original;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // 浏览器解不了这个格式（例如旧浏览器的 AVIF）：原样上传。
    return original;
  }

  try {
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    if (scale === 1 && file.size <= MAX_BYTES) return original;

    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob || blob.size >= original.bytes.byteLength) return original;

    return { bytes: new Uint8Array(await blob.arrayBuffer()), ext: "webp" };
  } finally {
    bitmap.close();
  }
}
