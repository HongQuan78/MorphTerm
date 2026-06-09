import { useEffect, useMemo, useState } from "react";
import type {
  FluxTermBackgroundConfig,
  FluxTermConfig,
  FluxTermTypingEffect
} from "../shared/config/config-types";

interface SettingsPanelProps {
  config: FluxTermConfig;
  isOpen: boolean;
  onClose(): void;
  onConfigChange(config: FluxTermConfig): void;
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

export function SettingsPanel({
  config,
  isOpen,
  onClose,
  onConfigChange
}: SettingsPanelProps) {
  const [draft, setDraft] = useState<FluxTermConfig>(config);
  const [status, setStatus] = useState("");
  const gradientDraft = useMemo(
    () => parseGradient(draft.appearance.background.value),
    [draft.appearance.background.value]
  );

  useEffect(() => {
    setDraft(config);
  }, [config]);

  if (!isOpen) {
    return null;
  }

  const saveConfig = async (nextConfig: FluxTermConfig) => {
    setDraft(nextConfig);
    onConfigChange(nextConfig);
    const savedConfig = await window.fluxTerm.config.update(nextConfig);
    onConfigChange(savedConfig);
    setStatus("Saved");
    window.setTimeout(() => setStatus(""), 1000);
  };

  const updateDraft = (nextConfig: FluxTermConfig) => {
    void saveConfig(nextConfig);
  };

  const updateBackground = (background: Partial<FluxTermBackgroundConfig>) => {
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

  const changeBackgroundType = (type: FluxTermBackgroundConfig["type"]) => {
    if (type === draft.appearance.background.type) {
      return;
    }

    const valueByType: Record<FluxTermBackgroundConfig["type"], string> = {
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
      const configApi = window.fluxTerm.config as typeof window.fluxTerm.config & {
        selectBackgroundImage?: () => Promise<string | null>;
      };

      if (typeof configApi.selectBackgroundImage !== "function") {
        setStatus("Restart FluxTerm to enable image browsing.");
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

  return (
    <aside className="settings-panel" aria-label="Appearance settings">
      <header className="settings-header">
        <div>
          <p className="settings-eyebrow">FluxTerm</p>
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
          Font size
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
          Opacity
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
          Blur
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
                  typingEffect: event.target.value as FluxTermTypingEffect
                }
              })
            }
          >
            <option value="none">None</option>
            <option value="spark">Spark</option>
          </select>
        </label>
      </section>

      <footer className="settings-footer">
        <button
          type="button"
          className="ghost-button"
          onClick={() => void window.fluxTerm.config.openConfigFile()}
        >
          Open config file
        </button>
        {status && <span className="settings-status">{status}</span>}
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
