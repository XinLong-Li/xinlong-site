import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Xinlong Li — Embedded Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * 站点标记。刻意用预渲染好的 PNG 而不是在 Satori 里重画一遍几何——
 * 后者会造成 icon.svg 与这里两份几何定义，改了一处忘另一处必然漂移。
 * app/icon-mark.png 由 app/icon.svg 渲染而来，是同一个图形的位图。
 *
 * 模块级读取，每个进程只读一次。带兜底：文件缺失时只是不显示标记，
 * 不能让整张分享图挂掉。
 */
let MARK_DATA_URI: string | null = null;
try {
  const buf = readFileSync(path.join(process.cwd(), "app", "icon-mark.png"));
  MARK_DATA_URI = `data:image/png;base64,${buf.toString("base64")}`;
} catch {
  MARK_DATA_URI = null;
}

/**
 * 分享卡片。此前全站没有任何 og:image，每条分享都只是一条纯文本链接。
 *
 * 文案刻意只用英文：ImageResponse 底层的 Satori 需要显式提供字体，
 * 而中文字体是数 MB 级——为一个分享图引入 CJK 字体不划算。
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 64,
          padding: "80px",
          background:
            "radial-gradient(60rem 40rem at 15% -10%, rgba(100,255,218,0.18), transparent 70%), #0f1216",
          fontFamily: "sans-serif",
        }}
      >
        {MARK_DATA_URI && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={MARK_DATA_URI} width={200} height={200} alt="" />
        )}

        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div
            style={{
              fontSize: 26,
              color: "#64ffda",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Embedded Software Engineer
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 88,
              fontWeight: 700,
              color: "#f2f5f7",
              letterSpacing: "-0.02em",
            }}
          >
            Xinlong Li
          </div>
          <div style={{ marginTop: 20, fontSize: 36, color: "#9aa5b1" }}>
            Robot Motion Control · Real-time Embedded Systems
          </div>
          <div
            style={{
              marginTop: 56,
              width: 120,
              height: 4,
              background: "#64ffda",
              borderRadius: 2,
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
