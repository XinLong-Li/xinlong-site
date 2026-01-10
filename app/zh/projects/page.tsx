export const metadata = {
  title: "项目 - 李新龙",
  description: "机器人与嵌入式系统项目展示",
};

export default function ZhProjects() {
  return (
    <main className="container">
      <section className="section" style={{ minHeight: "80vh" }}>
        <h1>项目</h1>
        <p style={{ color: "#666", marginBottom: 48 }}>
          机器人运动控制与嵌入式系统开发项目
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          <div className="project-card">
            <h3>六轴机械臂运动控制系统</h3>
            <p style={{ marginBottom: 12 }}>
              基于 ROS 的六轴机械臂控制系统，实现逆运动学求解、轨迹规划和力控。支持示教再现、视觉抓取等功能。
            </p>
            <div className="project-tags">
              <span>#ROS</span>
              <span>#C++</span>
              <span>#运动学</span>
            </div>
          </div>

          <div className="project-card">
            <h3>移动机器人导航与定位</h3>
            <p style={{ marginBottom: 12 }}>
              集成激光 SLAM 和视觉里程计的移动机器人导航系统，支持自主建图、路径规划和避障。
            </p>
            <div className="project-tags">
              <span>#SLAM</span>
              <span>#ROS2</span>
              <span>#导航</span>
            </div>
          </div>

          <div className="project-card">
            <h3>实时嵌入式控制器</h3>
            <p style={{ marginBottom: 12 }}>
              基于 STM32 的实时电机控制系统，实现 FOC 控制和高精度位置闭环。
            </p>
            <div className="project-tags">
              <span>#STM32</span>
              <span>#FreeRTOS</span>
              <span>#FOC</span>
            </div>
          </div>

          <div className="project-card">
            <h3>视觉伺服抓取系统</h3>
            <p style={{ marginBottom: 12 }}>
              集成视觉识别和机械臂控制的自动化抓取系统，支持多目标检测和位姿估计。
            </p>
            <div className="project-tags">
              <span>#OpenCV</span>
              <span>#深度学习</span>
              <span>#机器人</span>
            </div>
          </div>

          <div className="project-card">
            <h3>四足机器人运动控制</h3>
            <p style={{ marginBottom: 12 }}>
              基于模型预测控制的四足机器人步态规划和平衡控制系统。
            </p>
            <div className="project-tags">
              <span>#MPC</span>
              <span>#步态规划</span>
              <span>#动力学</span>
            </div>
          </div>

          <div className="project-card">
            <h3>多轴运动平台</h3>
            <p style={{ marginBottom: 12 }}>
              高精度多轴运动平台控制系统，实现同步运动和轨迹插补。
            </p>
            <div className="project-tags">
              <span>#运动控制</span>
              <span>#EtherCAT</span>
              <span>#C++</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
