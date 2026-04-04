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
          <h2 style={{ marginBottom: 16 }}>Experience</h2>
          <ul>
            <li>2025/09 - Present · iStar (Shanghai) Engineering Technology Co., Ltd. · Motion Engineering Department · Motion Control Firmware Engineer</li>
          </ul>
          <ul>
            <li>2022/09 - 2025/08 ·  ShanghaiTech University · Electronic Science and Technology · M.Eng.</li>
          </ul>
          <ul>
            <li>2019/07 - 2021/06 · SIGLENT Technologies Co., Ltd. (Shenzhen) · Hardware Department · Hardware Engineer</li>
          </ul>
          <ul>
            <li>2015/09 - 2019/06 · Guilin University of Electronic Technology · Measurement and Control Technology and Instrumentation · B.Eng.</li>
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
