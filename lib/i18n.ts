// 国际化翻译对象
export const i18n = {
  zh: {
    blog: "博客",
    projects: "项目",
    resume: "简历",
    contact: "联系",
  },
  en: {
    blog: "BLOG",
    projects: "PROJECTS",
    resume: "RESUME",
    contact: "CONTACT",
  },
};

export type Language = "zh" | "en";

export function getI18n(lang: Language) {
  return i18n[lang];
}
