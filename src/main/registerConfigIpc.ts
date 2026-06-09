import { ipcMain } from "electron";
import { ConfigManager } from "./ConfigManager";
import { configChannels } from "../shared/config/config-ipc";
import type { FluxTermConfigUpdate } from "../shared/config/config-types";

export function registerConfigIpc(configManager: ConfigManager): void {
  ipcMain.handle(configChannels.get, () => {
    return configManager.get();
  });

  ipcMain.handle(configChannels.update, (_event, update: FluxTermConfigUpdate) => {
    return configManager.update(update);
  });

  ipcMain.handle(configChannels.openConfigFile, () => {
    return configManager.openConfigFile();
  });
}
