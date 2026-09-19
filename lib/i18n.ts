export const LANGS = ["zh", "en"] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

export const DEFAULT_LANG: Lang = "en";

/** <html lang> 用的 BCP-47 标签 */
export function htmlLang(lang: Lang): string {
  return lang === "zh" ? "zh-CN" : "en";
}

export type ResumeEntry = {
  period: string;
  org: string;
  dept?: string;
  role: string;
};

type Dictionary = {
  siteName: string;
  siteDescription: string;
  nav: { blog: string; projects: string; resume: string; contact: string };
  theme: { light: string; dark: string; toggle: string };
  langSwitch: string;
  common: {
    backToProjects: string;
    backToBlog: string;
    viewAll: string;
    emptyPosts: string;
    emptyProjects: string;
  };
  home: {
    greeting: string;
    name: string;
    role: string;
    bio: string;
    skills: string[];
    featuredBlog: string;
    featuredProjects: string;
  };
  blog: { title: string; subtitle: string };
  projects: { title: string; subtitle: string };
  resume: {
    title: string;
    subtitle: string;
    experience: string;
    skills: string;
    skillGroups: { label: string; items: string }[];
    entries: ResumeEntry[];
  };
  contact: {
    title: string;
    subtitle: string;
    emailLabel: string;
    githubLabel: string;
    linkedinLabel: string;
    email: string;
    github: string;
    linkedin: string;
  };
  notFound: { title: string; back: string };
  /** {name} 与 {year} 由 formatFooter 替换。刻意用字符串模板而非函数：
     字典会被传给客户端组件，函数无法跨 server/client 边界序列化。 */
  footerTemplate: string;
};

export function formatFooter(
  template: string,
  name: string,
  year: number,
): string {
  return template.replace("{name}", name).replace("{year}", String(year));
}

export const dictionaries: Record<Lang, Dictionary> = {
  zh: {
    siteName: "李新龙",
    siteDescription: "专注于机器人运动控制与嵌入式系统开发",
    nav: { blog: "博客", projects: "项目", resume: "简历", contact: "联系" },
    theme: { light: "浅色", dark: "深色", toggle: "切换主题" },
    langSwitch: "Switch to English",
    common: {
      backToProjects: "← 返回项目",
      backToBlog: "← 返回博客",
      viewAll: "查看全部",
      emptyPosts: "还没有文章。",
      emptyProjects: "还没有项目。",
    },
    home: {
      greeting: "你好，我是",
      name: "李新龙",
      role: "嵌入式软件工程师 / 机器人运动控制",
      bio: "专注于机器人运动控制、机械臂开发和实时嵌入式系统。致力于将控制算法与硬件完美结合，实现高精度、高可靠性的自动化解决方案。",
      skills: [
        "C/C++",
        "ROS/ROS2",
        "运动学/动力学",
        "STM32/ARM",
        "实时系统",
        "PID/MPC 控制",
      ],
      featuredBlog: "精选博客",
      featuredProjects: "精选项目",
    },
    blog: { title: "博客", subtitle: "分享技术经验、学习笔记和思考" },
    projects: {
      title: "项目",
      subtitle: "机器人运动控制与嵌入式系统开发项目",
    },
    resume: {
      title: "简历",
      subtitle: "个人经历与技能",
      experience: "个人经历",
      skills: "技能",
      skillGroups: [
        { label: "语言", items: "C / C++、Python、MATLAB" },
        { label: "机器人", items: "ROS / ROS2、运动学与动力学、轨迹规划" },
        { label: "控制", items: "PID、MPC、伺服与力矩控制" },
        { label: "嵌入式", items: "STM32 / ARM、RTOS、EtherCAT / CAN 总线" },
      ],
      entries: [
        {
          period: "2025/09 - 至今",
          org: "智慧星空（上海）工程技术有限公司",
          dept: "运动工程部",
          role: "运动控制固件工程师",
        },
        {
          period: "2022/09 - 2025/08",
          org: "上海科技大学",
          dept: "电子科学与技术",
          role: "工学硕士",
        },
        {
          period: "2019/07 - 2021/06",
          org: "深圳市鼎阳科技股份有限公司",
          dept: "硬件部",
          role: "硬件工程师",
        },
        {
          period: "2015/09 - 2019/06",
          org: "桂林电子科技大学",
          dept: "测控技术与仪器",
          role: "工学学士",
        },
      ],
    },
    contact: {
      title: "联系我",
      subtitle: "欢迎联系我，讨论合作或任何想法",
      emailLabel: "邮箱",
      githubLabel: "GitHub",
      linkedinLabel: "LinkedIn",
      email: "li_xin_long@foxmail.com",
      github: "github.com/XinLong-Li",
      linkedin: "linkedin.com/in/xin-long-li",
    },
    notFound: { title: "页面不存在", back: "返回首页" },
    footerTemplate: "由 {name} 设计与开发 © {year}",
  },

  en: {
    siteName: "Xinlong Li",
    siteDescription:
      "Embedded software engineer specializing in robot motion control",
    nav: {
      blog: "Blog",
      projects: "Projects",
      resume: "Resume",
      contact: "Contact",
    },
    theme: { light: "Light", dark: "Dark", toggle: "Toggle theme" },
    langSwitch: "切换到中文",
    common: {
      backToProjects: "← Back to Projects",
      backToBlog: "← Back to Blog",
      viewAll: "View All",
      emptyPosts: "No posts yet.",
      emptyProjects: "No projects yet.",
    },
    home: {
      greeting: "Hi, I am",
      name: "Xinlong Li",
      role: "Embedded Software Engineer / Robot Motion Control",
      bio: "Specializing in robot motion control, robotic arm development, and real-time embedded systems. Committed to seamlessly integrating control algorithms with hardware for high-precision, highly reliable automation solutions.",
      skills: [
        "C/C++",
        "ROS/ROS2",
        "Kinematics/Dynamics",
        "STM32/ARM",
        "RTOS",
        "PID/MPC Control",
      ],
      featuredBlog: "Featured Blog",
      featuredProjects: "Featured Projects",
    },
    blog: {
      title: "Blog",
      subtitle: "Sharing technical experience, learning notes and thoughts",
    },
    projects: {
      title: "Projects",
      subtitle: "Robot motion control and embedded systems development projects",
    },
    resume: {
      title: "Resume",
      subtitle: "Experience and skills",
      experience: "Experience",
      skills: "Skills",
      skillGroups: [
        { label: "Languages", items: "C / C++, Python, MATLAB" },
        {
          label: "Robotics",
          items: "ROS / ROS2, kinematics & dynamics, trajectory planning",
        },
        { label: "Control", items: "PID, MPC, servo & torque control" },
        {
          label: "Embedded",
          items: "STM32 / ARM, RTOS, EtherCAT / CAN bus",
        },
      ],
      entries: [
        {
          period: "2025/09 - Present",
          org: "iStar (Shanghai) Engineering Technology Co., Ltd.",
          dept: "Motion Engineering Department",
          role: "Motion Control Firmware Engineer",
        },
        {
          period: "2022/09 - 2025/08",
          org: "ShanghaiTech University",
          dept: "Electronic Science and Technology",
          role: "M.Eng.",
        },
        {
          period: "2019/07 - 2021/06",
          org: "SIGLENT Technologies Co., Ltd.",
          dept: "Hardware Department",
          role: "Hardware Engineer",
        },
        {
          period: "2015/09 - 2019/06",
          org: "Guilin University of Electronic Technology",
          dept: "Measurement and Control Technology and Instrumentation",
          role: "B.Eng.",
        },
      ],
    },
    contact: {
      title: "Contact Me",
      subtitle: "Feel free to reach out for collaboration or any ideas",
      emailLabel: "Email",
      githubLabel: "GitHub",
      linkedinLabel: "LinkedIn",
      email: "li_xin_long@foxmail.com",
      github: "github.com/XinLong-Li",
      linkedin: "linkedin.com/in/xin-long-li",
    },
    notFound: { title: "Page not found", back: "Back home" },
    footerTemplate: "Designed & Built by {name} © {year}",
  },
};

export function getDictionary(lang: Lang): Dictionary {
  return dictionaries[lang];
}

/** 联系方式的外部链接，两语言共用 */
export const CONTACT_LINKS = {
  email: "mailto:li_xin_long@foxmail.com",
  github: "https://github.com/XinLong-Li",
  linkedin: "https://www.linkedin.com/in/xin-long-li/",
} as const;
