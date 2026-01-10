export const metadata = {
  title: "Resume - Xinlong Li",
  description: "Personal resume and work experience",
};

export default function EnResumePage() {
  return (
    <main className="container">
      <section className="section">
        <h1 style={{ marginBottom: 48 }}>Resume</h1>
        
        <div className="project-card" style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16 }}>Education</h2>
          <ul>
            <li>University · EE/CS/related major · Degree</li>
          </ul>
        </div>

        <div className="project-card" style={{ marginBottom: 32 }}>
          <h2 style={{ marginBottom: 16 }}>Experience & Projects</h2>
          <ul>
            <li>Company/Team · Focus area · Key outcomes/metrics</li>
            <li>Project A · Role/Contribution · Highlights</li>
            <li>Project B · Role/Contribution · Highlights</li>
          </ul>
        </div>

        <div className="project-card">
          <h2 style={{ marginBottom: 16 }}>Skills</h2>
          <ul>
            <li>Frontend: React / Next.js · components & performance</li>
            <li>Backend: Node.js · API design & data modeling</li>
            <li>Data/Tools: Python · automation & analysis</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
