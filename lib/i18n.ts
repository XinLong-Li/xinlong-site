// 国际化翻译对象
export const i18n = {
  zh: {
    blog: "博客",
    projects: "项目",
    resume: "简历",
    contact: "联系",
    themeAuto: "自动",
    themeLight: "浅色",
    themeDark: "深色",
    langZh: "中文",
    langEn: "English",
  },
  en: {
    blog: "BLOG",
    projects: "PROJECTS",
    resume: "RESUME",
    contact: "CONTACT",
    themeAuto: "Auto",
    themeLight: "Light",
    themeDark: "Dark",
    langZh: "中文",
    langEn: "English",
  },
};

export type Language = "zh" | "en";

export function getI18n(lang: Language) {
  return i18n[lang];
}
