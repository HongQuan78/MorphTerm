import type { CSSProperties, ReactNode } from "react";
import { EffectLayer } from "./EffectLayer";
import type { EffectLayerHandle } from "./EffectLayer";
import type { FluxTermConfig } from "../shared/config/config-types";

interface TerminalLayoutProps {
  config: FluxTermConfig;
  children: ReactNode;
  effectLayerRef?: React.Ref<EffectLayerHandle>;
}

export function TerminalLayout({
  config,
  children,
  effectLayerRef
}: TerminalLayoutProps) {
  const backgroundStyle = createBackgroundStyle(config);

  return (
    <div className="terminal-layout">
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

function createBackgroundStyle(config: FluxTermConfig): CSSProperties {
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
      backgroundImage: `url("${background.value}")`,
      backgroundPosition: "center",
      backgroundSize: "cover"
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
