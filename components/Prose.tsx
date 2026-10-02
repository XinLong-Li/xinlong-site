import { cn } from "@/lib/cn";

/**
 * markdown 正文排版。
 *
 * remark-html 输出的是一堆无 class 的裸标签，此前全站没有任何针对它们的
 * 样式——标题、代码、引用块全走浏览器默认，markdown 里的链接还会拿到
 * 浏览器默认蓝，成为全站第四套主色。
 *
 * 这里用显式子选择器而非 @tailwindcss/typography 插件：为本就依赖 remark
 * 的单个组件再引入一个依赖不划算。
 */
export default function Prose({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "leading-relaxed text-fg-muted",
        // 标题
        "[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-fg",
        "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:scroll-mt-24 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-fg",
        "[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:font-semibold [&_h4]:text-fg",
        // 段落与列表
        "[&_p]:my-4",
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_li]:my-1.5 [&_li]:pl-1",
        "[&_li>ul]:my-1.5 [&_li>ol]:my-1.5",
        // 链接：用主色，消除浏览器默认蓝
        "[&_a]:font-medium [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-accent-strong",
        // 行内代码
        "[&_code]:rounded [&_code]:bg-surface-sunken [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em] [&_code]:text-fg",
        // 代码块（避免与外层 code 规则叠加成双重背景）
        "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-surface-sunken [&_pre]:p-4 [&_pre]:text-sm",
        "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
        // 引用与分隔线
        "[&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-4 [&_blockquote]:text-fg-muted [&_blockquote]:italic",
        "[&_hr]:my-8 [&_hr]:border-border",
        // 表格。**依赖 lib/content.ts 里的 .use(gfm)** —— 表格是 GFM 扩展，
        // 只挂 remark-html 的话这几条规则一条都不会命中。
        "[&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
        "[&_th]:border [&_th]:border-border [&_th]:bg-surface-sunken [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-fg",
        "[&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2",
        // GFM 同时带来删除线与任务列表，这两样以前渲染不出来，所以一直没有样式。
        // preflight 会重置表单元素外观，不补的话任务列表是个没有任何尺寸的方块。
        "[&_del]:line-through [&_del]:opacity-70",
        "[&_.contains-task-list]:list-none [&_.contains-task-list]:pl-0",
        "[&_.task-list-item]:list-none [&_.task-list-item]:pl-0",
        "[&_input]:mr-2 [&_input]:size-3.5 [&_input]:align-middle",
        "[&_strong]:font-semibold [&_strong]:text-fg",
        "[&_img]:my-6 [&_img]:rounded-lg [&_img]:border [&_img]:border-border",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
