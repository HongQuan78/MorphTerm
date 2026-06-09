import fs from "node:fs";
import path from "node:path";
import { shell } from "electron";
import { defaultConfig } from "../shared/config/default-config";
import type {
  MorphTermConfig,
  MorphTermConfigUpdate
} from "../shared/config/config-types";
import { mergeConfig, validateConfig } from "../shared/config/validate-config";

export class ConfigManager {
  private configPath: string;
  private config: MorphTermConfig = defaultConfig;

  constructor(configPath: string) {
    this.configPath = configPath;
  }

  load(): MorphTermConfig {
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });

    if (!fs.existsSync(this.configPath)) {
      this.config = defaultConfig;
      this.writeConfig();
      return this.config;
    }

    try {
      const rawConfig = fs.readFileSync(this.configPath, "utf8");
      this.config = validateConfig(JSON.parse(rawConfig));
    } catch {
      this.config = defaultConfig;
    }

    this.writeConfig();

    return this.config;
  }

  get(): MorphTermConfig {
    return this.config;
  }

  update(update: MorphTermConfigUpdate): MorphTermConfig {
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
