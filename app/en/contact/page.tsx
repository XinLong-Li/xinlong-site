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
            Feel free to reach out for collaboration, speaking, or any ideas
          </p>
          
          <div style={{ marginBottom: 32 }}>
            <p style={{ marginBottom: 12 }}>
              <strong>Email:</strong>
              <a href="mailto:lixinlong@example.com" style={{ color: "#f97316", marginLeft: 8 }}>
                lixinlong@example.com
              </a>
            </p>
            <p>
              <strong>Social Media:</strong>
              <span style={{ color: "#666", marginLeft: 8 }}>GitHub / LinkedIn / Twitter</span>
            </p>
          </div>

          <p style={{ color: "#999", fontSize: "0.9rem" }}>
            You can add a form or newsletter sign-up later for quick feedback
          </p>
        </div>
      </section>
    </main>
  );
}
