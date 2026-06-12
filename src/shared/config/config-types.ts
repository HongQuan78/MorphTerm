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

export type MorphTermShellProfile =
  | "system"
  | "powershell"
  | "cmd"
  | "git-bash"
  | "custom";

export interface MorphTermShellConfig {
  profile: MorphTermShellProfile;
  customPath: string;
  customArgs: string[];
}

export type MorphTermKeybindingAction =
  | "newTab"
  | "closeTab"
  | "nextTab"
  | "previousTab"
  | "splitRight"
  | "splitDown"
  | "closePane"
  | "toggleSettings";

export type MorphTermKeybindingsConfig = Partial<Record<
  MorphTermKeybindingAction,
  string
>>;

export interface MorphTermConfig {
  fontFamily: string;
  fontSize: number;
  terminalTheme: ITheme;
  appearance: MorphTermAppearanceConfig;
  effects: MorphTermEffectsConfig;
  shell: MorphTermShellConfig;
  keybindings: MorphTermKeybindingsConfig;
}

export type MorphTermConfigUpdate = Partial<{
  fontFamily: string;
  fontSize: number;
  terminalTheme: Partial<ITheme>;
  appearance: Partial<{
    background: Partial<MorphTermBackgroundConfig>;
  }>;
  effects: Partial<MorphTermEffectsConfig>;
  shell: Partial<MorphTermShellConfig>;
  keybindings: Partial<MorphTermKeybindingsConfig>;
}>;
