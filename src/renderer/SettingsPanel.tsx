import { useEffect, useMemo, useState } from "react";
import type {
  MorphTermBackgroundConfig,
  MorphTermConfig,
  MorphTermKeybindingAction,
  MorphTermShellProfile,
  MorphTermTypingEffect
} from "../shared/config/config-types";

interface SettingsPanelProps {
  previewConfig: MorphTermConfig;
  savedConfig: MorphTermConfig;
  isOpen: boolean;
  onClose(): void;
  onPreviewConfigChange(config: MorphTermConfig): void;
  onSavedConfigChange(config: MorphTermConfig): void;
}

interface GradientDraft {
  angle: number;
  from: string;
  to: string;
}

const gradientPresets: Array<{ name: string; value: string }> = [
  {
    name: "Aurora",
    value: "linear-gradient(135deg, #0f766e 0%, #4f46e5 52%, #db2777 100%)"
  },
  {
    name: "Ember",
    value: "linear-gradient(135deg, #7c2d12 0%, #be123c 50%, #581c87 100%)"
  },
  {
    name: "Ocean",
    value: "linear-gradient(135deg, #082f49 0%, #0891b2 55%, #22c55e 100%)"
  }
];

const windowsShellProfiles: Array<{
  value: MorphTermShellProfile;
  label: string;
}> = [
  { value: "system", label: "System default" },
  { value: "powershell", label: "PowerShell" },
  { value: "cmd", label: "Command Prompt" },
  { value: "git-bash", label: "Git Bash" },
  { value: "custom", label: "Custom" }
];

const unixShellProfiles: Array<{
  value: MorphTermShellProfile;
  label: string;
}> = [
  { value: "system", label: "System shell" },
  { value: "custom", label: "Custom" }
];

const keybindingLabels: Array<{
  action: MorphTermKeybindingAction;
  label: string;
}> = [
  { action: "newTab", label: "New tab" },
  { action: "closeTab", label: "Close tab" },
  { action: "nextTab", label: "Next tab" },
  { action: "previousTab", label: "Previous tab" },
  { action: "splitRight", label: "Split right" },
  { action: "splitDown", label: "Split down" },
  { action: "closePane", label: "Close pane" },
  { action: "toggleSettings", label: "Toggle settings" }
];

export function SettingsPanel({
  previewConfig,
  savedConfig,
  isOpen,
  onClose,
  onPreviewConfigChange,
  onSavedConfigChange
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<MorphTermConfig>(previewConfig);
  const [status, setStatus] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const gradientDraft = useMemo(
    () => parseGradient(draft.appearance.background.value),
    [draft.appearance.background.value]
  );
  const shellProfiles =
    window.morphTerm.platform === "win32" ? windowsShellProfiles : unixShellProfiles;

  useEffect(() => {
    setDraft(previewConfig);
  }, [previewConfig]);

  useEffect(() => {
    setHasUnsavedChanges(configsAreDifferent(previewConfig, savedConfig));
  }, [previewConfig, savedConfig]);

  if (!isOpen) {
    return null;
  }

  const updateDraft = (nextConfig: MorphTermConfig) => {
    setDraft(nextConfig);
    onPreviewConfigChange(nextConfig);
    setHasUnsavedChanges(true);
    setStatus("Unsaved changes");
  };

  const updateBackground = (background: Partial<MorphTermBackgroundConfig>) => {
    updateDraft({
      ...draft,
      appearance: {
        ...draft.appearance,
        background: {
          ...draft.appearance.background,
          ...background
        }
      }
    });
  };

  const changeBackgroundType = (type: MorphTermBackgroundConfig["type"]) => {
    if (type === draft.appearance.background.type) {
      return;
    }

    const valueByType: Record<MorphTermBackgroundConfig["type"], string> = {
      color: "#0f1115",
      image: "",
      gradient: gradientPresets[0].value
    };

    updateBackground({
      type,
      value: valueByType[type]
    });
  };

  const setGradient = (gradient: GradientDraft) => {
    updateBackground({
      type: "gradient",
      value: createGradientValue(gradient)
    });
  };

  const browseImage = async () => {
    try {
      setStatus("Opening file picker...");
      const configApi = window.morphTerm.config as typeof window.morphTerm.config & {
        selectBackgroundImage?: () => Promise<string | null>;
      };

      if (typeof configApi.selectBackgroundImage !== "function") {
        setStatus("Restart MorphTerm to enable image browsing.");
        return;
      }

      const imagePath = await configApi.selectBackgroundImage();

      if (!imagePath) {
        setStatus("");
        return;
      }

      updateBackground({
        type: "image",
        value: imagePath
      });
    } catch (error) {
      setStatus(`Browse failed: ${String(error)}`);
    }
  };

  const saveChanges = async () => {
    try {
      setStatus("Saving...");
      const savedConfig = await window.morphTerm.config.update(draft);
      onSavedConfigChange(savedConfig);
      onPreviewConfigChange(savedConfig);
      setDraft(savedConfig);
      setHasUnsavedChanges(false);
      setStatus("Saved");
      window.setTimeout(() => setStatus(""), 1000);
    } catch (error) {
      setStatus(`Save failed: ${String(error)}`);
    }
  };

  const resetChanges = () => {
    setDraft(savedConfig);
    onPreviewConfigChange(savedConfig);
    setHasUnsavedChanges(false);
    setStatus("");
  };

  return (
    <aside className="settings-panel" aria-label="Appearance settings">
      <header className="settings-header">
        <div>
          <p className="settings-eyebrow">MorphTerm</p>
          <h2>Appearance</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onClose}>
          Close
        </button>
      </header>

      <section className="settings-section">
        <h3>Typography</h3>
        <label>
          Font family
          <input
            value={draft.fontFamily}
            onChange={(event) =>
              updateDraft({ ...draft, fontFamily: event.target.value })
            }
          />
        </label>

        <label>
          <span className="setting-label-row">
            <span>Font size</span>
            <span className="setting-value">{draft.fontSize}px</span>
          </span>
          <input
            type="number"
            min="10"
            max="32"
            value={draft.fontSize}
            onChange={(event) =>
              updateDraft({ ...draft, fontSize: Number(event.target.value) })
            }
          />
        </label>
      </section>

      <section className="settings-section">
        <h3>Terminal Colors</h3>
        <div className="settings-color-grid">
          <label>
            Foreground
            <input
              type="color"
              value={String(draft.terminalTheme.foreground ?? "#d8dee9")}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  terminalTheme: {
                    ...draft.terminalTheme,
                    foreground: event.target.value
                  }
                })
              }
            />
          </label>

          <label>
            Cursor
            <input
              type="color"
              value={String(draft.terminalTheme.cursor ?? "#88c0d0")}
              onChange={(event) =>
                updateDraft({
                  ...draft,
                  terminalTheme: {
                    ...draft.terminalTheme,
                    cursor: event.target.value
                  }
                })
              }
            />
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h3>Shell</h3>
        <label>
          Default shell
          <select
            value={draft.shell.profile}
            onChange={(event) =>
              updateDraft({
                ...draft,
                shell: {
                  ...draft.shell,
                  profile: event.target.value as MorphTermShellProfile
                }
              })
            }
          >
            {shellProfiles.map((profile) => (
              <option key={profile.value} value={profile.value}>
                {profile.label}
              </option>
            ))}
          </select>
        </label>

        {draft.shell.profile === "custom" && (
          <>
            <label>
              Shell path
              <input
                value={draft.shell.customPath}
                placeholder={
                  window.morphTerm.platform === "win32"
                    ? "C:\\Program Files\\PowerShell\\7\\pwsh.exe"
                    : "/bin/zsh"
                }
                onChange={(event) =>
                  updateDraft({
                    ...draft,
                    shell: {
                      ...draft.shell,
                      customPath: event.target.value
                    }
                  })
                }
              />
            </label>

            <label>
              Arguments
              <input
                value={draft.shell.customArgs.join(" ")}
                placeholder="-NoLogo or --login -i"
                onChange={(event) =>
                  updateDraft({
                    ...draft,
                    shell: {
                      ...draft.shell,
                      customArgs: parseShellArgs(event.target.value)
                    }
                  })
                }
              />
            </label>
          </>
        )}

        <p className="settings-note">
          Shell changes apply to new tabs or panes. Running sessions stay on their
          current shell.
        </p>
      </section>

      <section className="settings-section">
        <h3>Background</h3>
        <div className="segmented-control" role="group" aria-label="Background type">
          {(["color", "image", "gradient"] as const).map((type) => (
            <button
              type="button"
              className={draft.appearance.background.type === type ? "active" : ""}
              key={type}
              onClick={() => changeBackgroundType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {draft.appearance.background.type === "color" && (
          <label>
            Color
            <input
              type="color"
              value={draft.appearance.background.value}
              onChange={(event) =>
                updateBackground({ type: "color", value: event.target.value })
              }
            />
          </label>
        )}

        {draft.appearance.background.type === "image" && (
          <div className="browse-row">
            <label>
              Image path
              <input
                value={draft.appearance.background.value}
                placeholder="No image selected"
                onChange={(event) =>
                  updateBackground({ type: "image", value: event.target.value })
                }
              />
            </label>
            <button type="button" onClick={() => void browseImage()}>
              Browse
            </button>
          </div>
        )}

        {draft.appearance.background.type === "gradient" && (
          <div className="gradient-editor">
            <div className="settings-color-grid">
              <label>
                From
                <input
                  type="color"
                  value={gradientDraft.from}
                  onChange={(event) =>
                    setGradient({ ...gradientDraft, from: event.target.value })
                  }
                />
              </label>
              <label>
                To
                <input
                  type="color"
                  value={gradientDraft.to}
                  onChange={(event) =>
                    setGradient({ ...gradientDraft, to: event.target.value })
                  }
                />
              </label>
            </div>

            <label>
              Angle
              <input
                type="range"
                min="0"
                max="360"
                value={gradientDraft.angle}
                onChange={(event) =>
                  setGradient({
                    ...gradientDraft,
                    angle: Number(event.target.value)
                  })
                }
              />
            </label>

            <div
              className="gradient-preview"
              style={{ backgroundImage: draft.appearance.background.value }}
            />

            <div className="preset-row">
              {gradientPresets.map((preset) => (
                <button
                  type="button"
                  key={preset.name}
                  onClick={() =>
                    updateBackground({ type: "gradient", value: preset.value })
                  }
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <label>
          <span className="setting-label-row">
            <span>Opacity</span>
            <span className="setting-value">
              {formatOpacity(draft.appearance.background.opacity)}
            </span>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={draft.appearance.background.opacity}
            onChange={(event) =>
              updateBackground({ opacity: Number(event.target.value) })
            }
          />
        </label>

        <label>
          <span className="setting-label-row">
            <span>Blur</span>
            <span className="setting-value">
              {draft.appearance.background.blur}px
            </span>
          </span>
          <input
            type="range"
            min="0"
            max="32"
            value={draft.appearance.background.blur}
            onChange={(event) =>
              updateBackground({ blur: Number(event.target.value) })
            }
          />
        </label>
      </section>

      <section className="settings-section">
        <h3>Effects</h3>
        <label>
          Typing effect
          <select
            value={draft.effects.typingEffect}
            onChange={(event) =>
              updateDraft({
                ...draft,
                effects: {
                  ...draft.effects,
                  typingEffect: event.target.value as MorphTermTypingEffect
                }
              })
            }
          >
            <option value="none">None</option>
            <option value="spark">Spark</option>
          </select>
        </label>
      </section>

      <section className="settings-section">
        <h3>Keybindings</h3>
        <div className="keybinding-list">
          {keybindingLabels.map((keybinding) => (
            <div className="keybinding-row" key={keybinding.action}>
              <span>{keybinding.label}</span>
              <kbd>{draft.keybindings[keybinding.action]}</kbd>
            </div>
          ))}
        </div>
        <p className="settings-note">
          Edit keybindings in config JSON for now, then save or restart MorphTerm.
        </p>
      </section>

      <footer className="settings-footer">
        <button
          type="button"
          className="ghost-button"
          onClick={() => void window.morphTerm.config.openConfigFile()}
        >
          Open config file
        </button>
        <div className="settings-actions">
          {status && <span className="settings-status">{status}</span>}
          <button
            type="button"
            className="ghost-button"
            disabled={!hasUnsavedChanges}
            onClick={resetChanges}
          >
            Reset
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!hasUnsavedChanges}
            onClick={() => void saveChanges()}
          >
            Save
          </button>
        </div>
      </footer>
    </aside>
  );
}

function createGradientValue(gradient: GradientDraft): string {
  return `linear-gradient(${gradient.angle}deg, ${gradient.from} 0%, ${gradient.to} 100%)`;
}

function parseGradient(value: string): GradientDraft {
  const colors = value.match(/#[0-9a-fA-F]{6}/g);
  const angle = Number(value.match(/linear-gradient\((\d+)deg/)?.[1] ?? 135);

  return {
    angle,
    from: colors?.[0] ?? "#0f766e",
    to: colors?.[colors.length - 1] ?? "#4f46e5"
  };
}

function configsAreDifferent(
  firstConfig: MorphTermConfig,
  secondConfig: MorphTermConfig
): boolean {
  return JSON.stringify(firstConfig) !== JSON.stringify(secondConfig);
}

function formatOpacity(opacity: number): string {
  return opacity.toFixed(2).replace(/0$/, "");
}

function parseShellArgs(value: string): string[] {
  return value
    .split(" ")
    .map((argument) => argument.trim())
    .filter(Boolean);
}
