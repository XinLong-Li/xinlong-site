export const metadata = {
  title: "Projects - Xinlong Li",
  description: "Robotics and embedded systems projects",
};

export default function EnProjects() {
  return (
    <main className="container">
      <section className="section" style={{ minHeight: "80vh" }}>
        <h1>Projects</h1>
        <p style={{ color: "#666", marginBottom: 48 }}>
          Robot motion control and embedded systems development projects
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
          <div className="project-card">
            <h3>6-DOF Robotic Arm Control System</h3>
            <p style={{ marginBottom: 12 }}>
              ROS-based control system for 6-axis robotic arm with inverse kinematics, trajectory planning, and force control. Supports teach pendant, visual grasping, and more.
            </p>
            <div className="project-tags">
              <span>#ROS</span>
              <span>#C++</span>
              <span>#Kinematics</span>
            </div>
          </div>

          <div className="project-card">
            <h3>Mobile Robot Navigation & Localization</h3>
            <p style={{ marginBottom: 12 }}>
              Navigation system integrating laser SLAM and visual odometry for autonomous mapping, path planning, and obstacle avoidance.
            </p>
            <div className="project-tags">
              <span>#SLAM</span>
              <span>#ROS2</span>
              <span>#Navigation</span>
            </div>
          </div>

          <div className="project-card">
            <h3>Real-Time Embedded Controller</h3>
            <p style={{ marginBottom: 12 }}>
              STM32-based real-time motor control system implementing FOC control and high-precision position closed-loop.
            </p>
            <div className="project-tags">
              <span>#STM32</span>
              <span>#FreeRTOS</span>
              <span>#FOC</span>
            </div>
          </div>

          <div className="project-card">
            <h3>Visual Servoing Grasping System</h3>
            <p style={{ marginBottom: 12 }}>
              Automated grasping system integrating vision recognition and robotic arm control with multi-target detection and pose estimation.
            </p>
            <div className="project-tags">
              <span>#OpenCV</span>
              <span>#Deep Learning</span>
              <span>#Robotics</span>
            </div>
          </div>

          <div className="project-card">
            <h3>Quadruped Robot Motion Control</h3>
            <p style={{ marginBottom: 12 }}>
              Gait planning and balance control system for quadruped robot based on model predictive control.
            </p>
            <div className="project-tags">
              <span>#MPC</span>
              <span>#Gait Planning</span>
              <span>#Dynamics</span>
            </div>
          </div>

          <div className="project-card">
            <h3>Multi-Axis Motion Platform</h3>
            <p style={{ marginBottom: 12 }}>
              High-precision multi-axis motion platform control system with synchronized motion and trajectory interpolation.
            </p>
            <div className="project-tags">
              <span>#Motion Control</span>
              <span>#EtherCAT</span>
              <span>#C++</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
