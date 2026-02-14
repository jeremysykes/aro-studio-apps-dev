import type { AroPreloadAPI } from '@aro/types';

declare global {
  interface Window {
    aro: AroPreloadAPI;
  }
}

export {};
