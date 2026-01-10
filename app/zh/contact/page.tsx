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
            欢迎联系我，讨论合作、演讲邀请或任何想法
          </p>
          
          <div style={{ marginBottom: 32 }}>
            <p style={{ marginBottom: 12 }}>
              <strong>邮箱：</strong>
              <a href="mailto:lixinlong@example.com" style={{ color: "#f97316", marginLeft: 8 }}>
                lixinlong@example.com
              </a>
            </p>
            <p>
              <strong>社交媒体：</strong>
              <span style={{ color: "#666", marginLeft: 8 }}>GitHub / LinkedIn / Twitter</span>
            </p>
          </div>

          <p style={{ color: "#999", fontSize: "0.9rem" }}>
            后续可加入表单或订阅功能，便于快速留言与获取更新
          </p>
        </div>
      </section>
    </main>
  );
}