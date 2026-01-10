export const metadata = {
  title: "简历 - 李新龙",
  description: "个人简历和工作经历",
};

export default function ResumePageZh() {
  return (
    <main className="container">
      <section className="section">
        <h1 style={{ marginBottom: 48 }}>简历</h1>
        
        <div className="project-card" style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16 }}>教育背景</h2>
          <ul>
            <li>某大学 · 电子/计算机/相关专业 · 学位</li>
          </ul>
        </div>

        <div className="project-card" style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16 }}>工作与项目</h2>
          <ul>
            <li>公司/团队 · 负责方向 · 关键成果/指标</li>
            <li>项目A · 角色/贡献 · 成果亮点</li>
            <li>项目B · 角色/贡献 · 成果亮点</li>
          </ul>
        </div>

        <div className="project-card">
          <h2 style={{ marginBottom: 16 }}>技能</h2>
          <ul>
            <li>前端：React / Next.js · 组件化与性能优化</li>
            <li>后端：Node.js · API 设计与数据建模</li>
            <li>数据/工具：Python · 自动化脚本与分析</li>
          </ul>
        </div>
      </section>
    </main>
  );
}