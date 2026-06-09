import fs from "node:fs";
import path from "node:path";
import { shell } from "electron";
import { defaultConfig } from "../shared/config/default-config";
import type {
  FluxTermConfig,
  FluxTermConfigUpdate
} from "../shared/config/config-types";

const configFileName = "config.json";

export class ConfigManager {
  private configPath: string;
  private config: FluxTermConfig = defaultConfig;

  constructor(userDataPath: string) {
    this.configPath = path.join(userDataPath, configFileName);
  }

  load(): FluxTermConfig {
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });

    if (!fs.existsSync(this.configPath)) {
      this.config = defaultConfig;
      this.writeConfig();
      return this.config;
    }

    try {
      const rawConfig = fs.readFileSync(this.configPath, "utf8");
      this.config = mergeConfig(JSON.parse(rawConfig) as FluxTermConfigUpdate);
    } catch {
      this.config = defaultConfig;
    }

    this.writeConfig();

    return this.config;
  }

  get(): FluxTermConfig {
    return this.config;
  }

  update(update: FluxTermConfigUpdate): FluxTermConfig {
    this.config = mergeConfig(update, this.config);
    this.writeConfig();

    return this.config;
  }

  openConfigFile(): Promise<void> {
    return shell.openPath(this.configPath).then((error) => {
      if (error) {
        throw new Error(error);
      }
    });
  }

  private writeConfig(): void {
    fs.writeFileSync(this.configPath, `${JSON.stringify(this.config, null, 2)}\n`);
  }
}

function mergeConfig(
  update: FluxTermConfigUpdate,
  base: FluxTermConfig = defaultConfig
): FluxTermConfig {
  return {
    ...base,
    ...update,
    terminalTheme: {
      ...base.terminalTheme,
      ...update.terminalTheme
    },
    background: {
      ...base.background,
      ...update.background
    }
  };
}
