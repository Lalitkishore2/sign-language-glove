/**
 * @fileoverview Settings Page — Workspace preferences, appearance, translation, devices, privacy, accessibility.
 * All toggles write to local component state only — no backend or store integration.
 */
import React, { useState, useCallback, memo } from "react";
import { WorkspaceLayout } from "@/layouts/WorkspaceLayout";

/* ─── Types ─────────────────────────────────────────────────────────────── */
type ToggleKey =
  | "darkMode"
  | "reducedMotion"
  | "highContrast"
  | "autoSpeak"
  | "smartPredictions"
  | "saveHistory"
  | "cameraEnabled"
  | "telemetry"
  | "screenReader"
  | "hapticFeedback";

interface SettingsState {
  darkMode: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  autoSpeak: boolean;
  smartPredictions: boolean;
  saveHistory: boolean;
  cameraEnabled: boolean;
  telemetry: boolean;
  screenReader: boolean;
  hapticFeedback: boolean;
}

/* ─── Toggle Atom ─────────────────────────────────────────────────────────── */
interface ToggleProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}

const Toggle = memo(function Toggle({ id, label, checked, onChange }: ToggleProps) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-secondary ${
        checked ? "bg-primary" : "bg-surface-variant"
      }`}
      type="button"
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
        aria-hidden="true"
      />
    </button>
  );
});

/* ─── Section Wrapper ─────────────────────────────────────────────────────── */
interface SettingsSectionProps {
  title: string;
  icon: string;
  children: React.ReactNode;
}

const SettingsSection = memo(function SettingsSection({
  title,
  icon,
  children,
}: SettingsSectionProps) {
  return (
    <section className="bg-surface-secondary rounded-xl border border-outline-variant/30 overflow-hidden" aria-label={`${title} settings`}>
      <div className="flex items-center gap-sm p-md border-b border-outline-variant/30">
        <span className="material-symbols-outlined text-primary text-[18px]" aria-hidden="true">{icon}</span>
        <h2 className="font-title-lg text-title-lg text-on-surface">{title}</h2>
      </div>
      <div className="divide-y divide-outline-variant/20">{children}</div>
    </section>
  );
});

/* ─── Settings Row ────────────────────────────────────────────────────────── */
function SettingsRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between p-md gap-xl">
      <div className="flex-1">
        <p className="font-label-md text-label-md text-on-surface">{label}</p>
        {description && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs" id={`desc-${label.toLowerCase().replace(/\s+/g, "-")}`}>
            {description}
          </p>
        )}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

/* ─── Settings Page ───────────────────────────────────────────────────────── */
export function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>({
    darkMode: true,
    reducedMotion: false,
    highContrast: false,
    autoSpeak: true,
    smartPredictions: true,
    saveHistory: true,
    cameraEnabled: true,
    telemetry: false,
    screenReader: false,
    hapticFeedback: true,
  });

  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [confidence, setConfidence] = useState(70);

  const toggle = useCallback((key: ToggleKey) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleVoiceSpeed = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setVoiceSpeed(parseFloat(e.target.value)),
    []
  );

  const handleConfidence = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => setConfidence(parseInt(e.target.value, 10)),
    []
  );

  const handleClearData = useCallback(() => {
    // Placeholder — no real data to clear
    window.confirm("Are you sure you want to clear all session data?");
  }, []);

  return (
    <WorkspaceLayout headerTitle="Settings">
      <div className="flex-1 overflow-y-auto p-md md:p-lg">
        <div className="max-w-3xl mx-auto flex flex-col gap-lg">
          {/* Page Header */}
          <header className="mb-sm">
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              Settings
            </h1>
            <p className="font-body-default text-body-default text-on-surface-variant mt-xs">
              Manage your Kinex workspace preferences.
            </p>
          </header>

          {/* ── Profile ──────────────────────────────────────────────── */}
          <SettingsSection title="Profile" icon="person">
            <div className="p-md flex items-center gap-lg">
              <div className="w-16 h-16 rounded-full bg-surface-elevated border border-outline-variant flex items-center justify-center" aria-hidden="true">
                <span className="material-symbols-outlined text-on-surface-variant text-[32px]">person</span>
              </div>
              <div className="flex-1">
                <h3 className="font-title-lg text-title-lg text-on-surface">User Name</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">user@kinex.ai</p>
              </div>
              <button className="px-md py-xs border border-outline-variant text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-elevated transition-colors">
                Edit Profile
              </button>
            </div>
          </SettingsSection>

          {/* ── Appearance ───────────────────────────────────────────── */}
          <SettingsSection title="Appearance" icon="palette">
            <SettingsRow label="Dark Mode" description="Use the dark colour scheme throughout the workspace.">
              <Toggle
                id="toggle-darkmode"
                label="Toggle dark mode"
                checked={settings.darkMode}
                onChange={() => toggle("darkMode")}
              />
            </SettingsRow>
            <SettingsRow label="Reduce Motion" description="Minimise animations for a calmer experience.">
              <Toggle
                id="toggle-reducedmotion"
                label="Toggle reduce motion"
                checked={settings.reducedMotion}
                onChange={() => toggle("reducedMotion")}
              />
            </SettingsRow>
            <SettingsRow label="High Contrast" description="Increase border and text contrast for better readability.">
              <Toggle
                id="toggle-highcontrast"
                label="Toggle high contrast"
                checked={settings.highContrast}
                onChange={() => toggle("highContrast")}
              />
            </SettingsRow>
          </SettingsSection>

          {/* ── Translation ──────────────────────────────────────────── */}
          <SettingsSection title="Translation" icon="translate">
            <SettingsRow label="Auto-Speak Output" description="Automatically read aloud translated sentences.">
              <Toggle
                id="toggle-autospeak"
                label="Toggle auto-speak output"
                checked={settings.autoSpeak}
                onChange={() => toggle("autoSpeak")}
              />
            </SettingsRow>
            <SettingsRow label="Smart Word Predictions" description="Show AI-suggested next words based on context.">
              <Toggle
                id="toggle-predictions"
                label="Toggle smart word predictions"
                checked={settings.smartPredictions}
                onChange={() => toggle("smartPredictions")}
              />
            </SettingsRow>
            <SettingsRow label="Voice Speed" description={`TTS output speed: ${voiceSpeed.toFixed(1)}×`}>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={voiceSpeed}
                onChange={handleVoiceSpeed}
                aria-label={`Voice speed: ${voiceSpeed.toFixed(1)}×`}
                aria-valuemin={0.5}
                aria-valuemax={2.0}
                aria-valuenow={voiceSpeed}
                className="accent-primary w-32 cursor-pointer"
              />
            </SettingsRow>
            <SettingsRow label="Min. Confidence Threshold" description={`Show only predictions above ${confidence}% confidence.`}>
              <input
                type="range"
                min={50}
                max={99}
                step={1}
                value={confidence}
                onChange={handleConfidence}
                aria-label={`Minimum confidence threshold: ${confidence}%`}
                aria-valuemin={50}
                aria-valuemax={99}
                aria-valuenow={confidence}
                className="accent-primary w-32 cursor-pointer"
              />
            </SettingsRow>
            <SettingsRow label="Target Language" description="Select output language for translated text.">
              <select
                className="bg-surface-elevated border border-outline-variant/50 text-on-surface font-body-sm text-body-sm py-xs px-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Target output language"
                defaultValue="en"
              >
                <option value="en">English (US)</option>
                <option value="en-gb">English (UK)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </SettingsRow>
          </SettingsSection>

          {/* ── Camera & Devices ─────────────────────────────────────── */}
          <SettingsSection title="Camera & Devices" icon="videocam">
            <SettingsRow label="Enable Camera" description="Allow Kinex to access your camera for gesture recognition.">
              <Toggle
                id="toggle-camera"
                label="Toggle camera access"
                checked={settings.cameraEnabled}
                onChange={() => toggle("cameraEnabled")}
              />
            </SettingsRow>
            <SettingsRow label="Haptic Feedback" description="Vibrate wearable devices on recognition events.">
              <Toggle
                id="toggle-haptic"
                label="Toggle haptic feedback"
                checked={settings.hapticFeedback}
                onChange={() => toggle("hapticFeedback")}
              />
            </SettingsRow>
            <SettingsRow label="Camera Source" description="Select which camera to use for the workspace.">
              <select
                className="bg-surface-elevated border border-outline-variant/50 text-on-surface font-body-sm text-body-sm py-xs px-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                aria-label="Camera source selection"
                defaultValue="default"
              >
                <option value="default">Default Camera</option>
                <option value="external">External USB Camera</option>
                <option value="back">Back Camera</option>
              </select>
            </SettingsRow>
          </SettingsSection>

          {/* ── Privacy & Data ───────────────────────────────────────── */}
          <SettingsSection title="Privacy & Data" icon="lock">
            <SettingsRow label="Save Session History" description="Store translated sentences locally for review.">
              <Toggle
                id="toggle-history"
                label="Toggle save session history"
                checked={settings.saveHistory}
                onChange={() => toggle("saveHistory")}
              />
            </SettingsRow>
            <SettingsRow label="Anonymous Telemetry" description="Share anonymised usage data to improve model accuracy.">
              <Toggle
                id="toggle-telemetry"
                label="Toggle anonymous telemetry"
                checked={settings.telemetry}
                onChange={() => toggle("telemetry")}
              />
            </SettingsRow>
            <SettingsRow label="Clear Session Data" description="Delete all saved translations and session history.">
              <button
                onClick={handleClearData}
                className="px-md py-xs border border-error/50 text-error font-label-md text-label-md rounded-lg hover:bg-error/10 transition-colors text-sm"
                aria-label="Clear all session data"
              >
                Clear Data
              </button>
            </SettingsRow>
          </SettingsSection>

          {/* ── Accessibility ────────────────────────────────────────── */}
          <SettingsSection title="Accessibility" icon="accessibility">
            <SettingsRow label="Screen Reader Mode" description="Optimise for external screen readers and ARIA announcements.">
              <Toggle
                id="toggle-screenreader"
                label="Toggle screen reader mode"
                checked={settings.screenReader}
                onChange={() => toggle("screenReader")}
              />
            </SettingsRow>
            <SettingsRow label="Keyboard Shortcuts" description="View and customise workspace keyboard shortcuts.">
              <button
                className="px-md py-xs border border-outline-variant text-on-surface font-label-md text-label-md rounded-lg hover:bg-surface-elevated transition-colors text-sm"
                aria-label="View keyboard shortcuts"
              >
                View Shortcuts
              </button>
            </SettingsRow>
          </SettingsSection>

          {/* ── Version Info ────────────────────────────────────────── */}
          <div className="text-center py-lg" role="contentinfo">
            <p className="font-label-sm text-label-sm text-on-surface-variant/50">
              Kinex AI Workspace · v1.0.0 · Model: Kinex-SLR-v4.2
            </p>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
