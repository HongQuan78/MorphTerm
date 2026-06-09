import type { ITheme } from "@xterm/xterm";

export interface FluxTermBackgroundConfig {
  type: "color" | "image" | "gradient";
  value: string;
  opacity: number;
  blur: number;
}

export interface FluxTermAppearanceConfig {
  background: FluxTermBackgroundConfig;
}

export interface FluxTermConfig {
  fontFamily: string;
  fontSize: number;
  terminalTheme: ITheme;
  appearance: FluxTermAppearanceConfig;
}

export type FluxTermConfigUpdate = Partial<{
  fontFamily: string;
  fontSize: number;
  terminalTheme: Partial<ITheme>;
  appearance: Partial<{
    background: Partial<FluxTermBackgroundConfig>;
  }>;
}>;
