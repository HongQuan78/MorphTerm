import type { ITheme } from "@xterm/xterm";

export interface FluxTermBackgroundConfig {
  color: string;
  image: string | null;
  imageOpacity: number;
}

export interface FluxTermConfig {
  fontFamily: string;
  fontSize: number;
  terminalTheme: ITheme;
  background: FluxTermBackgroundConfig;
}

export type FluxTermConfigUpdate = Partial<{
  fontFamily: string;
  fontSize: number;
  terminalTheme: Partial<ITheme>;
  background: Partial<FluxTermBackgroundConfig>;
}>;
