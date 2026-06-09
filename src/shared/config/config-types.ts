import type { ITheme } from "@xterm/xterm";

export interface MorphTermBackgroundConfig {
  type: "color" | "image" | "gradient";
  value: string;
  opacity: number;
  blur: number;
}

export interface MorphTermAppearanceConfig {
  background: MorphTermBackgroundConfig;
}

export type MorphTermTypingEffect = "none" | "spark";

export interface MorphTermEffectsConfig {
  typingEffect: MorphTermTypingEffect;
}

export interface MorphTermConfig {
  fontFamily: string;
  fontSize: number;
  terminalTheme: ITheme;
  appearance: MorphTermAppearanceConfig;
  effects: MorphTermEffectsConfig;
}

export type MorphTermConfigUpdate = Partial<{
  fontFamily: string;
  fontSize: number;
  terminalTheme: Partial<ITheme>;
  appearance: Partial<{
    background: Partial<MorphTermBackgroundConfig>;
  }>;
  effects: Partial<MorphTermEffectsConfig>;
}>;
