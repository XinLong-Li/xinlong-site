---
title: "Real-Time Embedded Motor Controller"
date: "2026-03-12"
summary: "An STM32-based real-time controller implementing closed-loop motor control with deterministic scheduling and diagnostics."
tags: ["STM32", "FreeRTOS", "FOC", "Embedded"]
---

## Project Overview

The project targets a high-reliability embedded motor control platform for precision positioning and repeatable dynamic response.

## Responsibilities

- Implemented core firmware architecture for real-time control tasks
- Designed ADC, PWM, and encoder data paths for low-latency updates
- Built configurable control loops for current, velocity, and position
- Added diagnostics interface for tuning and fault inspection

## Firmware Architecture

### Scheduling

- Control loop executed at fixed high-frequency interrupt context
- Auxiliary communication and logging tasks isolated in RTOS threads
- Priority scheme enforced to protect control timing

### Control Algorithms

- Field-oriented control pipeline with calibrated current sampling
- Cascaded loop structure for velocity and position control
- Anti-windup and saturation handling for extreme commands

### Diagnostics and Safety

- Over-current and over-temperature checks with fault latching
- Startup self-test for sensor and actuator readiness
- Structured telemetry packets for host-side plotting

## Challenges and Solutions

### Challenge: Timing jitter under heavy communication load

Solution:

- Moved non-critical operations out of interrupt context
- Reduced dynamic memory activity in real-time paths
- Introduced double-buffered telemetry serialization

### Challenge: Torque ripple at low speed

Solution:

- Refined current sensor offset calibration process
- Improved PWM dead-time compensation
- Tuned loop gains with staged bandwidth targets

## Results

- Stable closed-loop behavior under varied load conditions
- Improved low-speed smoothness and position hold performance
- Better fault traceability through structured telemetry

## Next Iteration

- Add adaptive gain scheduling based on load estimation
- Extend firmware update pipeline with secure boot checks
- Introduce automated HIL regression test suite
