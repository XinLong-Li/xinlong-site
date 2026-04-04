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
          <h2 style={{ marginBottom: 16 }}>个人经历</h2>
          <ul>
            <li>2025/9-  至今   · 智慧星空（上海）工程技术有限公司 · 运动工程部 · 运动控制固件工程师</li>
          </ul>
          <ul>
            <li>2022/9-2025/8 · 上海科技大学 · 电子科学与技术 · 工学硕士</li>
          </ul>
          <ul>
            <li>2019/7-2021/6 · 深圳市鼎阳科技股份有限公司 · 硬件部 · 硬件工程师</li>
          </ul>
          <ul>
            <li>2015/9-2019/6 · 桂林电子科技大学 · 测控技术与仪器 · 工学学士</li>
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