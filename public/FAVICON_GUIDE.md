# Favicon 定制指南

## 当前配置

网站已配置以下 favicon 文件：
- `public/icon.svg` - SVG 图标（推荐，矢量图，清晰）
- `public/favicon.ico` - ICO 格式（传统浏览器兼容）
- `public/apple-touch-icon.png` - Apple 设备主屏幕图标

## 如何定制自己的图标

### 方案 1：使用在线工具生成（推荐）

1. **Favicon.io** (https://favicon.io/)
   - 文字转 Favicon：输入 "李" 或 "XL"
   - 图片转 Favicon：上传你的 logo
   - 一键生成所有格式

2. **RealFaviconGenerator** (https://realfavicongenerator.net/)
   - 上传一张图片（至少 512×512px）
   - 自动生成所有平台所需的图标
   - 提供完整的代码配置

### 方案 2：使用设计工具

1. **Figma/Adobe Illustrator**
   - 创建 512×512px 的设计
   - 导出为 SVG（矢量）或 PNG（位图）
   
2. **简单的 SVG 代码**
   - 编辑 `public/icon.svg`
   - 使用文字、形状、路径等
   - 示例：首字母 "李" 或 "XL"

### 方案 3：使用 Emoji

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text x="50" y="50" font-size="80" text-anchor="middle" dominant-baseline="middle">🤖</text>
</svg>
```

## 文件规格

### favicon.ico
- 尺寸：16×16, 32×32, 48×48（多尺寸合并）
- 格式：ICO
- 用途：传统浏览器、Windows 系统

### icon.svg
- 尺寸：矢量（任意大小）
- 格式：SVG
- 用途：现代浏览器、高清显示
- **推荐**：优先使用 SVG

### icon.png (可选)
- 尺寸：192×192 或 512×512
- 格式：PNG
- 用途：PWA、Android

### apple-touch-icon.png
- 尺寸：180×180
- 格式：PNG
- 用途：iOS 主屏幕图标、Safari

## 快速替换步骤

1. 准备你的图标文件
2. 替换 `public/` 目录下的对应文件：
   ```
   public/
   ├── favicon.ico      （替换这个）
   ├── icon.svg         （替换这个）
   └── apple-touch-icon.png  （替换这个）
   ```
3. 清除浏览器缓存（Ctrl+Shift+Delete）
4. 刷新页面查看效果

## 设计建议

### 尺寸
- 最小可识别：16×16px
- 设计基础：512×512px
- 简洁优先：避免过多细节

### 颜色
- 深色背景 + 亮色图标（适合暗色主题）
- 亮色背景 + 深色图标（适合亮色主题）
- 透明背景（根据系统主题自适应）

### 内容
- **首字母**：李、XL、L
- **符号**：机器人🤖、代码</> 、齿轮⚙️
- **几何图形**：圆形、方形、六边形
- **个人 logo**：如果有设计好的个人标识

## 示例代码

### 简洁的字母 "L"
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#0a0a0c"/>
  <text x="50" y="75" font-family="Arial" font-size="70" font-weight="bold" fill="#64ffda" text-anchor="middle">L</text>
</svg>
```

### 机器人主题
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#1a1a2e"/>
  <circle cx="50" cy="40" r="20" fill="none" stroke="#64ffda" stroke-width="3"/>
  <circle cx="42" cy="38" r="3" fill="#64ffda"/>
  <circle cx="58" cy="38" r="3" fill="#64ffda"/>
  <path d="M 40 48 Q 50 52 60 48" fill="none" stroke="#64ffda" stroke-width="2"/>
  <rect x="35" y="65" width="30" height="20" rx="3" fill="none" stroke="#64ffda" stroke-width="3"/>
</svg>
```

## 验证效果

部署后访问以下 URL 验证：
- https://xinlong-li.site/icon.svg
- https://xinlong-li.site/favicon.ico
- https://xinlong-li.site/apple-touch-icon.png

## 注意事项

1. **缓存问题**：浏览器会缓存 favicon，更新后需要强制刷新
2. **文件名大小写**：Linux 服务器区分大小写
3. **HTTPS**：现代浏览器要求 HTTPS 才能显示某些类型的 favicon
4. **尺寸优化**：SVG 文件尽量精简，避免过大
