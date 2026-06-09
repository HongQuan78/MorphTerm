import { contextBridge } from "electron";
import { appInfo } from "../shared/appInfo";

const fluxTermApi = {
  appInfo,
  platform: process.platform
};

contextBridge.exposeInMainWorld("fluxTerm", fluxTermApi);

export type FluxTermApi = typeof fluxTermApi;
