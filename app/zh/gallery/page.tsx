import Link from "next/link";

export const metadata = {
  title: "作品集 - Xinlong Li",
  description: "我的主要作品和项目展示。",
};

export default function ZhGallery() {
  return (
    <main className="container">
      <section className="section" style={{ minHeight: "80vh" }}>
        <Link href="/zh" style={{ marginBottom: 24, display: "block", color: "#64ffda" }}>
          ← 返回首页
        </Link>
        <h1>作品集</h1>
        <p style={{ color: "#8892b0", marginBottom: 48 }}>
          展示近期的主要项目和技术实践
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          <div className="project-card">
            <h3>CloudMonitor</h3>
            <p style={{ marginBottom: 12 }}>
              分布式系统实时监控仪表盘。支持高吞吐数据摄入和 WASM 加速渲染。
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
              基于 Node.js 的插件化自动化引擎，支持低代码流程编排和运维。
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
              跨平台的 WASM 开发框架和工具链，集成了编译、优化和部署功能。
            </p>
            <div className="project-tags">
              <span>#Rust</span>
              <span>#WebAssembly</span>
              <span>#Python</span>
            </div>
          </div>

          <div className="project-card">
            <h3>数据处理管道</h3>
            <p style={{ marginBottom: 12 }}>
              高效的 ETL 系统，支持实时数据流处理和批量转换。
            </p>
            <div className="project-tags">
              <span>#Go</span>
              <span>#Kafka</span>
              <span>#PostgreSQL</span>
            </div>
          </div>

          <div className="project-card">
            <h3>个人博客系统</h3>
            <p style={{ marginBottom: 12 }}>
              基于 Next.js 的现代化博客框架，支持多语言和深色主题。
            </p>
            <div className="project-tags">
              <span>#Next.js</span>
              <span>#TypeScript</span>
              <span>#MDX</span>
            </div>
          </div>

          <div className="project-card">
            <h3>云存储同步工具</h3>
            <p style={{ marginBottom: 12 }}>
              跨云平台的文件同步和备份工具，支持增量上传和智能去重。
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
