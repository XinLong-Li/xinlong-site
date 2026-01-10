# 图标使用指南

本项目使用 **lucide-react** 图标库，提供一致、现代的图标风格。

## 安装

已安装：`lucide-react`

## 使用方法

### 1. 导入图标

```tsx
import { Sun, Moon, Globe, Github, Linkedin, Mail } from "lucide-react";
```

### 2. 使用图标

```tsx
<Sun size={16} />           // 太阳图标，16px
<Moon size={20} />          // 月亮图标，20px
<Globe size={18} />         // 地球图标，18px
```

### 3. 自定义样式

```tsx
<Github 
  size={24} 
  color="#333" 
  strokeWidth={2}
/>
```

## 常用图标

### 社交媒体
- `Github` - GitHub
- `Linkedin` - LinkedIn  
- `Mail` - 邮箱
- `Twitter` - Twitter/X
- `Instagram` - Instagram

### 主题相关
- `Sun` - 亮色模式
- `Moon` - 暗色模式
- `MonitorSmartphone` - 自动模式

### 导航相关
- `Globe` - 语言切换
- `Menu` - 汉堡菜单
- `X` - 关闭

### 其他常用
- `Search` - 搜索
- `Home` - 首页
- `FileText` - 文档/博客
- `Folder` - 项目
- `User` - 用户/简历
- `MessageSquare` - 联系/消息

## 在联系页面使用示例

```tsx
import { Github, Linkedin, Mail } from "lucide-react";

export default function Contact() {
  return (
    <div className="social-links">
      <a href="https://github.com/yourusername">
        <Github size={20} />
        <span>GitHub</span>
      </a>
      <a href="https://linkedin.com/in/yourusername">
        <Linkedin size={20} />
        <span>LinkedIn</span>
      </a>
      <a href="mailto:your@email.com">
        <Mail size={20} />
        <span>Email</span>
      </a>
    </div>
  );
}
```

## 更多图标

浏览所有可用图标：https://lucide.dev/icons/
