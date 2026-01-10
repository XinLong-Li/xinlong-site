import Link from "next/link";

export const metadata = {
  title: "Gallery - Xinlong Li",
  description: "Showcasing my main projects and technical work.",
};

export default function EnGallery() {
  return (
    <main className="container">
      <section className="section" style={{ minHeight: "80vh" }}>
        <Link href="/en" style={{ marginBottom: 24, display: "block", color: "#64ffda" }}>
          ← Back to Home
        </Link>
        <h1>Gallery</h1>
        <p style={{ color: "#8892b0", marginBottom: 48 }}>
          Showcasing my main projects and recent technical work
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          <div className="project-card">
            <h3>CloudMonitor</h3>
            <p style={{ marginBottom: 12 }}>
              Realtime metrics dashboard for distributed systems. High throughput ingestion and WASM-accelerated rendering.
            </p>
            <div className="project-tags">
              <span>#Rust</span>
              <span>#React</span>
              <span>#gRPC</span>
            </div>
          </div>

          <div className="project-card">
            <h3>SmartFlow</h3>
            <p style={{ marginBottom: 12 }}>
              Plugin-based automation engine on Node.js enabling low-code workflow orchestration and operations.
            </p>
            <div className="project-tags">
              <span>#Node.js</span>
              <span>#Redis</span>
              <span>#Next.js</span>
            </div>
          </div>

          <div className="project-card">
            <h3>WebAssembly Toolkit</h3>
            <p style={{ marginBottom: 12 }}>
              Cross-platform WASM development framework with integrated compilation, optimization and deployment.
            </p>
            <div className="project-tags">
              <span>#Rust</span>
              <span>#WebAssembly</span>
              <span>#Python</span>
            </div>
          </div>

          <div className="project-card">
            <h3>Data Processing Pipeline</h3>
            <p style={{ marginBottom: 12 }}>
              Efficient ETL system supporting real-time streaming data processing and batch transformations.
            </p>
            <div className="project-tags">
              <span>#Go</span>
              <span>#Kafka</span>
              <span>#PostgreSQL</span>
            </div>
          </div>

          <div className="project-card">
            <h3>Personal Blog System</h3>
            <p style={{ marginBottom: 12 }}>
              Modern blogging framework built with Next.js, featuring multilingual support and dark mode.
            </p>
            <div className="project-tags">
              <span>#Next.js</span>
              <span>#TypeScript</span>
              <span>#MDX</span>
            </div>
          </div>

          <div className="project-card">
            <h3>Cloud Storage Sync Tool</h3>
            <p style={{ marginBottom: 12 }}>
              Cross-cloud file synchronization and backup tool with incremental upload and intelligent deduplication.
            </p>
            <div className="project-tags">
              <span>#Go</span>
              <span>#S3</span>
              <span>#gRPC</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
