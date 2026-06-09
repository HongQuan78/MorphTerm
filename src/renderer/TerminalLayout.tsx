import type { CSSProperties, ReactNode } from "react";
import { EffectLayer } from "./EffectLayer";
import type { EffectLayerHandle } from "./EffectLayer";
import type { FluxTermConfig } from "../shared/config/config-types";

interface TerminalLayoutProps {
  config: FluxTermConfig;
  children: ReactNode;
  effectLayerRef?: React.Ref<EffectLayerHandle>;
  backgroundImageDataUrl?: string | null;
}

export function TerminalLayout({
  config,
  children,
  effectLayerRef,
  backgroundImageDataUrl
}: TerminalLayoutProps) {
  const backgroundStyle = createBackgroundStyle(config, backgroundImageDataUrl);
  const layoutStyle = createLayoutStyle(config);

  return (
    <div className="terminal-layout" style={layoutStyle}>
      <div className="terminal-background" style={backgroundStyle} />
      <div className="terminal-readability-overlay" />
      <div className="terminal-content">{children}</div>
      <EffectLayer
        ref={effectLayerRef}
        typingEffect={config.effects.typingEffect}
      />
    </div>
  );
}

function createLayoutStyle(config: FluxTermConfig): CSSProperties {
  const accentColor = getBackgroundAccent(config);

  return {
    "--flux-scrollbar-thumb": withAlpha(accentColor, 0.72),
    "--flux-scrollbar-thumb-hover": withAlpha(accentColor, 0.92),
    "--flux-scrollbar-track": withAlpha("#0f1115", 0.42),
    "--flux-readability-opacity":
      config.appearance.background.type === "image" ? 0.18 : 0.38
  } as CSSProperties;
}

function createBackgroundStyle(
  config: FluxTermConfig,
  backgroundImageDataUrl?: string | null
): CSSProperties {
  const background = config.appearance.background;
  const opacity = clamp(background.opacity, 0, 1);
  const blur = Math.max(0, background.blur);
  const baseStyle: CSSProperties = {
    opacity,
    filter: blur > 0 ? `blur(${blur}px)` : undefined
  };

  if (background.type === "image") {
    return {
      ...baseStyle,
      backgroundImage: backgroundImageDataUrl
        ? `url("${backgroundImageDataUrl}")`
        : undefined,
      backgroundPosition: "center",
      backgroundSize: "cover",
      backgroundColor: "#0f1115"
    };
  }

  if (background.type === "gradient") {
    return {
      ...baseStyle,
      backgroundImage: background.value
    };
  }

  return {
    ...baseStyle,
    backgroundColor: background.value
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getBackgroundAccent(config: FluxTermConfig): string {
  const background = config.appearance.background;

  if (background.type === "color" && isHexColor(background.value)) {
    return background.value;
  }

  const gradientColor = background.value.match(/#[0-9a-fA-F]{6}/)?.[0];

  if (gradientColor) {
    return gradientColor;
  }

  return String(config.terminalTheme.cursor ?? "#88c0d0");
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

function withAlpha(hexColor: string, alpha: number): string {
  if (!isHexColor(hexColor)) {
    return `rgba(136, 192, 208, ${alpha})`;
  }

  const red = Number.parseInt(hexColor.slice(1, 3), 16);
  const green = Number.parseInt(hexColor.slice(3, 5), 16);
  const blue = Number.parseInt(hexColor.slice(5, 7), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}
