export const metadata = {
  title: "联系 - 李新龙",
  description: "联系方式和社交媒体",
};

export default function ContactPageZh() {
  return (
    <main className="container">
      <section className="section">
        <div className="contact-box">
          <h1 style={{ marginBottom: 24 }}>联系我</h1>
          <p style={{ color: "#666", marginBottom: 32, lineHeight: 1.6 }}>
            欢迎联系我，讨论合作或任何想法
          </p>
          
          <div style={{ marginBottom: 32 }}>
            <p style={{ marginBottom: 12 }}>
              <strong>邮箱：</strong>
              <a href="mailto:li_xin_long@foxmail.com" style={{ color: "#f97316", marginLeft: 8 }}>
                li_xin_long@foxmail.com
              </a>
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong>GitHub：</strong>
              <a href="https://github.com/XinLong-Li" target="_blank" rel="noreferrer" style={{ color: "#f97316", marginLeft: 8 }}>
                github.com/XinLong-Li
              </a>
            </p>
            <p>
              <strong>LinkedIn：</strong>
              <a href="https://www.linkedin.com/in/xin-long-li/" target="_blank" rel="noreferrer" style={{ color: "#f97316", marginLeft: 8 }}>
                linkedin.com/in/xin-long-li
              </a>
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}