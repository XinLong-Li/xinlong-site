export const metadata = {
  title: "Contact - Xinlong Li",
  description: "Contact information and social media",
};

export default function EnContactPage() {
  return (
    <main className="container">
      <section className="section">
        <div className="contact-box">
          <h1 style={{ marginBottom: 24 }}>Contact Me</h1>
          <p style={{ color: "#666", marginBottom: 32, lineHeight: 1.6 }}>
            Feel free to reach out for collaboration or any ideas
          </p>
          
          <div style={{ marginBottom: 32 }}>
            <p style={{ marginBottom: 12 }}>
              <strong>Email:</strong>
              <a href="mailto:li_xin_long@foxmail.com" style={{ color: "#f97316", marginLeft: 8 }}>
                li_xin_long@foxmail.com
              </a>
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong>GitHub:</strong>
              <a href="https://github.com/XinLong-Li" target="_blank" rel="noreferrer" style={{ color: "#f97316", marginLeft: 8 }}>
                github.com/XinLong-Li
              </a>
            </p>
            <p>
              <strong>LinkedIn:</strong>
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
