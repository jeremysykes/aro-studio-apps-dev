import type { AroCore } from '@aro/core';
import { loadModules as coreLoadModules } from '@aro/core';
import { setRegisteredJobKeys } from './state.js';

/**
 * Load modules — delegates to @aro/core shared loader.
 * The host provides the state callback because state management is host-specific.
 */
export function loadModules(core: AroCore): void {
  coreLoadModules(core, setRegisteredJobKeys);
}
