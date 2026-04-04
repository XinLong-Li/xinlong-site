---
title: "Mobile Robot Navigation and Localization"
date: "2026-02-08"
summary: "A navigation stack that combines LiDAR SLAM and visual odometry for robust mapping, localization, and autonomous path execution."
tags: ["ROS2", "SLAM", "Navigation", "Localization"]
---

## Project Overview

This project builds a mobile robot navigation system for indoor environments where lighting and geometry can vary significantly.

## Responsibilities

- Integrated SLAM, localization, and planning modules into a cohesive ROS2 stack
- Defined map lifecycle from online mapping to map reuse
- Tuned local planner behavior for smoother obstacle avoidance
- Added runtime health checks and recovery behaviors

## System Design

### Perception

- LiDAR-based scan matching for primary map consistency
- Visual odometry as supporting signal in feature-rich zones
- Sensor fusion at the state-estimation layer for improved robustness

### Planning and Control

- Global planner for long-distance route generation
- Local planner with dynamic obstacle handling
- Velocity command shaping for stable cornering and docking

### Runtime Robustness

- Recovery behaviors for localization loss and blocked paths
- Automatic planner reset when stale map states are detected
- Logging and replay pipeline for post-run analysis

## Challenges and Solutions

### Challenge: Drift increased in repetitive corridors

Solution:

- Added loop-closure-friendly waypoints in map workflow
- Improved sensor fusion weighting based on confidence metrics
- Tuned scan matching thresholds for corridor geometry

### Challenge: Oscillation near narrow passages

Solution:

- Adjusted local planner cost maps and inflation parameters
- Added direction consistency penalty in short-horizon planning
- Reduced aggressive velocity spikes at turning points

## Results

- Higher success rate in long-horizon autonomous navigation runs
- More stable docking and pass-through behavior in constrained spaces
- Better reproducibility across different environment lighting conditions

## Next Iteration

- Add semantic constraints from vision-based scene understanding
- Support multi-floor map switching with persistent localization context
- Introduce adaptive parameter sets by environment profile
