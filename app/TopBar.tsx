"use client";
import ThemeToggle from "../components/ThemeToggle";
import LangSwitch from "../components/LangSwitch";

export default function TopBar() {
  return (
    <div className="topbar">
      <div className="title">Xinlong Li</div>
      <div className="actions">
        <LangSwitch />
        <ThemeToggle />
      </div>
    </div>
  );
}
