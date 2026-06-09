/// <reference types="vite/client" />

import type { FluxTermApi } from "../preload/preload";

declare global {
  interface Window {
    fluxTerm: FluxTermApi;
  }
}
