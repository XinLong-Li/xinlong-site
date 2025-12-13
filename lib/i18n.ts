// 国际化翻译对象
export const i18n = {
  zh: {
    home: "首页",
    archives: "归档",
    tag: "标签",
    links: "链接",
    about: "关于",
    blog: "博客",
    books: "书单",
    resume: "简历",
    contact: "联系",
    search: "搜索...",
    themeLight: "亮色",
    themeDark: "暗色",
    themeSystem: "跟随系统",
    language: "语言",
    theme: "主题",
  },
  en: {
    home: "HOME",
    archives: "ARCHIVES",
    tag: "TAG",
    links: "LINKS",
    about: "ABOUT",
    blog: "BLOG",
    books: "BOOKS",
    resume: "RESUME",
    contact: "CONTACT",
    search: "Search...",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    language: "Language",
    theme: "Theme",
  },
};

export type Language = "zh" | "en";

export function getI18n(lang: Language) {
  return i18n[lang];
}
