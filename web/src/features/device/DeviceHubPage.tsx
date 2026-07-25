/**
 * @fileoverview Device Hub — Screen 06.
 * Three-column bento: Device list · 3D render + actions · Live sensor dashboard.
 * All sensor data is placeholder — no real BLE/hardware integration.
 */
import React, { useState, memo } from "react";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type DeviceStatus = "active" | "offline" | "pairing";

interface Device {
  id: string;
  name: string;
  icon: string;
  status: DeviceStatus;
}

interface TrackingMarker {
  top: string;
  left?: string;
  right?: string;
  delay: string;
}

interface FlexFinger {
  label: string;
  deg: number;
  pct: number;
}

/* ─── Sample data ─────────────────────────────────────────────────────────── */
const DEVICES: Device[] = [
  { id: "glove", name: "Kinex Smart Glove", icon: "front_hand", status: "active" },
  { id: "audio", name: "Kinex Audio Node", icon: "headphones", status: "offline" },
];

const FLEX_FINGERS: FlexFinger[] = [
  { label: "Thumb", deg: 45, pct: 45 },
  { label: "Index", deg: 80, pct: 80 },
  { label: "Mid", deg: 15, pct: 15 },
  { label: "Ring", deg: 60, pct: 60 },
  { label: "Pinky", deg: 30, pct: 30 },
];

const TRACKING_MARKERS: TrackingMarker[] = [
  { top: "33%", left: "25%", delay: "0ms" },
  { top: "50%", left: "50%", delay: "500ms" },
  { top: "25%", right: "33%", delay: "1000ms" },
];

const IMU = { x: 12.4, y: -5.2, z: 9.8 };

/* ─── Device List Sidebar ─────────────────────────────────────────────────── */
const DeviceListPanel = memo(function DeviceListPanel({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="lg:col-span-3 flex flex-col gap-md h-full">
      <div className="bg-surface-secondary/80 backdrop-blur-md rounded-xl border border-outline-variant/30 p-md flex flex-col flex-1 shadow-sm">
        <div className="flex justify-between items-center mb-md">
          <h2 className="font-title-lg text-title-lg text-on-surface">Connected</h2>
          <button
            aria-label="Add new device"
            className="text-primary hover:text-primary-fixed-dim transition-colors"
          >
            <span className="material-symbols-outlined text-xl" aria-hidden="true">add_circle</span>
          </button>
        </div>

        <ul className="flex flex-col gap-sm overflow-y-auto pr-2" role="list">
          {DEVICES.map((device) => {
            const isActive = device.id === active;
            return (
              <li key={device.id} role="listitem">
                <button
                  onClick={() => onSelect(device.id)}
                  aria-current={isActive ? "true" : undefined}
                  aria-label={`${device.name}, status: ${device.status}`}
                  className={`w-full text-left p-sm rounded-lg cursor-pointer relative overflow-hidden transition-all ${
                    isActive
                      ? "bg-surface-elevated border border-secondary/30 shadow-[0_0_15px_rgba(0,190,223,0.1)]"
                      : "bg-surface-container-low border border-outline-variant/20 hover:bg-surface-variant/50"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-lg" aria-hidden="true" />
                  )}
                  <div className="flex items-center gap-sm pl-2">
                    <div
                      className={`w-10 h-10 rounded-md flex items-center justify-center ${
                        isActive ? "bg-surface-variant text-secondary" : "bg-surface-variant text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined" aria-hidden="true">{device.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-label-md text-label-md text-on-surface truncate">
                        {device.name}
                      </p>
                      {device.status === "active" ? (
                        <p className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" aria-hidden="true" />
                          Active
                        </p>
                      ) : (
                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                          Offline
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Placeholder future devices */}
        <div className="mt-md pt-md border-t border-outline-variant/20">
          <p className="font-label-sm text-label-sm text-on-surface-variant text-center mb-md uppercase tracking-widest text-[10px]">
            Future Devices
          </p>
          {[
            { label: "Smart Glasses", icon: "visibility" },
            { label: "EMG Band", icon: "sensors" },
          ].map((d) => (
            <div
              key={d.label}
              className="p-sm rounded-lg border border-dashed border-outline-variant/30 flex items-center gap-sm mb-sm opacity-40"
              aria-label={`${d.label} — Coming Soon`}
            >
              <div className="w-8 h-8 rounded-md bg-surface-variant flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">{d.icon}</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{d.label}</span>
              <span className="ml-auto font-label-sm text-label-sm text-[10px] text-on-surface-variant/50 uppercase tracking-widest">
                Coming Soon
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

/* ─── 3D Device Panel ─────────────────────────────────────────────────────── */
const DeviceMainPanel = memo(function DeviceMainPanel() {
  return (
    <div className="lg:col-span-6 flex flex-col gap-md h-full">
      <div className="bg-surface-secondary/80 backdrop-blur-md rounded-xl border border-outline-variant/30 p-md flex flex-col flex-1 relative overflow-hidden shadow-sm">
        {/* Info overlay */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface drop-shadow-md">
              Smart Glove Pro
            </h2>
            <p className="font-body-default text-body-default text-on-surface-variant">
              FW: v2.4.1-beta
            </p>
          </div>
          <div className="flex gap-2">
            {[
              { icon: "battery_full", color: "text-success", label: "94% battery" },
              { icon: "wifi_tethering", color: "text-secondary", label: "Signal -45dBm" },
            ].map((chip) => (
              <div
                key={chip.label}
                className="bg-surface-elevated/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/50 flex items-center gap-2"
                aria-label={chip.label}
              >
                <span className={`material-symbols-outlined ${chip.color} text-sm`} aria-hidden="true">
                  {chip.icon}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface">
                  {chip.icon === "battery_full" ? "94%" : "-45dBm"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 3D Visualization */}
        <div className="flex-1 w-full min-h-[300px] flex items-center justify-center relative mt-12 rounded-lg bg-surface-container-low border border-outline-variant/20 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-secondary/50 pointer-events-none z-10"
            aria-hidden="true"
          />
          <div
            className="w-full h-full bg-cover bg-center opacity-80 mix-blend-screen"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCqr4ocXW-2V0Tvs6q8h-Fs2ouw6ZfagP0AW3cT7fn-WWk02sOtc_bI3b3ZzCMcY5uiGPI2srEoif95V61uF4W1Fu0JcvvkMxa1fEZa1WTp2nOKq7RFMP_OPfXEJhOtvWzBt26ajYv8Qgg3pwKqsrKB_zAa9bwlpln9pND6s9Ca0kE2TXJzhk2RixFuk4YKmGcelQqGulFpIZRV79VwNCTQMjKt-9RqGhx9Now0nlEV7H1nBOA4kXXgOw')",
            }}
            role="img"
            aria-label="Smart Glove 3D wireframe render"
          />
          {/* Animated tracking markers — typed correctly */}
          {TRACKING_MARKERS.map((m, i) => {
            const posStyle: React.CSSProperties = {
              top: m.top,
              animationDelay: m.delay,
              ...(m.left !== undefined ? { left: m.left } : {}),
              ...(m.right !== undefined ? { right: m.right } : {}),
            };
            return (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-secondary shadow-[0_0_10px_#00bedf] z-20 animate-ping opacity-70"
                style={posStyle}
                aria-hidden="true"
              />
            );
          })}
        </div>

        {/* Action Bar */}
        <div className="mt-md flex justify-between items-center bg-surface-elevated/50 p-sm rounded-lg border border-outline-variant/20">
          <button className="bg-primary hover:bg-primary-fixed-dim text-on-primary font-label-md text-label-md px-4 py-2 rounded-lg transition-colors shadow-md">
            Run Diagnostics
          </button>
          <button className="text-on-surface-variant hover:text-on-surface font-label-md text-label-md px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-transparent hover:border-outline-variant/50">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">update</span>
            Update Firmware
          </button>
        </div>
      </div>
    </div>
  );
});

/* ─── Live Sensors Panel ──────────────────────────────────────────────────── */
const LiveSensorsPanel = memo(function LiveSensorsPanel() {
  return (
    <div className="lg:col-span-3 flex flex-col gap-md h-full">
      <div className="bg-surface-secondary/80 backdrop-blur-md rounded-xl border border-outline-variant/30 p-md flex flex-col flex-1 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-md">
          <h2 className="font-title-lg text-title-lg text-on-surface">Live Sensors</h2>
          <div
            className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_#22C55E]"
            role="status"
            aria-label="Live data streaming"
          />
        </div>

        <div className="flex flex-col gap-sm overflow-y-auto pr-2 flex-1">
          {/* IMU Block */}
          <div className="bg-surface-container-low rounded-lg p-sm border border-outline-variant/20">
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-2">
              IMU Output (Wrist)
            </h3>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {(
                [
                  { axis: "X", value: IMU.x, color: "text-secondary" },
                  { axis: "Y", value: IMU.y, color: "text-warning" },
                  { axis: "Z", value: IMU.z, color: "text-primary" },
                ] as const
              ).map((d) => (
                <div key={d.axis} className="bg-surface-variant p-2 rounded flex flex-col items-center">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{d.axis}</span>
                  <span className={`font-body-sm text-body-sm font-mono ${d.color}`}>
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
            {/* Mini chart */}
            <div className="h-16 w-full bg-surface-variant rounded relative overflow-hidden" aria-hidden="true">
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" focusable="false">
                <path
                  d="M0,32 Q20,10 40,32 T80,32 T120,40 T160,20 T200,32 T240,45"
                  fill="none"
                  stroke="#00bedf"
                  strokeWidth="2"
                  opacity="0.7"
                />
                <path
                  d="M0,32 Q20,50 40,32 T80,32 T120,20 T160,40 T200,32 T240,15"
                  fill="none"
                  stroke="#c0c1ff"
                  strokeWidth="1.5"
                  opacity="0.5"
                />
              </svg>
            </div>
          </div>

          {/* Flex Sensors */}
          <div className="bg-surface-container-low rounded-lg p-sm border border-outline-variant/20">
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-2">
              Flex Sensors
            </h3>
            <div className="flex flex-col gap-2" role="list" aria-label="Finger flex values">
              {FLEX_FINGERS.map((finger) => (
                <div key={finger.label} className="flex items-center gap-2" role="listitem">
                  <span className="font-label-sm text-label-sm text-on-surface w-10 shrink-0">
                    {finger.label}
                  </span>
                  <div
                    className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden"
                    role="meter"
                    aria-valuenow={finger.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${finger.label}: ${finger.pct}%`}
                  >
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-700"
                      style={{ width: `${finger.pct}%` }}
                    />
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant font-mono text-right w-10 shrink-0">
                    {finger.deg}°
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* EMG Placeholder */}
          <div className="bg-surface-container-low rounded-lg p-sm border border-outline-variant/20 opacity-50" aria-label="EMG Signals — requires EMG Band, coming soon">
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-1">EMG Signals</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px]">
              Requires EMG Band — Coming Soon
            </p>
          </div>

          {/* Calibration */}
          <button className="mt-auto w-full py-2 bg-surface-elevated hover:bg-surface-container-high text-on-surface border border-outline-variant/50 rounded-lg font-label-md text-label-md transition-colors flex items-center justify-center gap-2 group">
            <span className="material-symbols-outlined text-sm group-hover:rotate-180 transition-transform duration-500" aria-hidden="true">
              sync
            </span>
            Start Calibration
          </button>
        </div>
      </div>
    </div>
  );
});

/* ─── Device Hub Page ─────────────────────────────────────────────────────── */
export function DeviceHubPage() {
  const [activeDevice, setActiveDevice] = useState("glove");

  return (
    <WorkspaceLayout headerTitle="Device Hub">
      <div className="flex-1 overflow-y-auto p-md md:p-lg lg:p-xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-md max-w-[1440px] mx-auto">
          <DeviceListPanel active={activeDevice} onSelect={setActiveDevice} />
          <DeviceMainPanel />
          <LiveSensorsPanel />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
