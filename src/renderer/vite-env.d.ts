/// <reference types="vite/client" />

import type { MorphTermApi } from "../preload/preload";

declare global {
  interface Window {
    morphTerm: MorphTermApi;
  }
}
