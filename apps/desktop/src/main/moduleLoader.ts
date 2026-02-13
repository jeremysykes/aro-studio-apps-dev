import type { AroCore } from '@aro/core';
import { getEnabledModuleKeys, getInit } from './moduleRegistry.js';
import { setRegisteredJobKeys } from './state.js';

/**
 * Load all enabled modules (works for every UI model).
 * ARO_ENABLED_MODULES is the single source of truth — one module or many.
 */
export function loadModules(core: AroCore): void {
  const enabledKeys = getEnabledModuleKeys();
  if (enabledKeys.length === 0) {
    console.warn('ARO_ENABLED_MODULES is empty or unset — no modules loaded');
    return;
  }
  const allJobKeys: string[] = [];
  for (const key of enabledKeys) {
    const init = getInit(key);
    if (!init) continue; // already warned in getEnabledModuleKeys
    try {
      const jobKeys = init(core);
      allJobKeys.push(...jobKeys);
    } catch (err) {
      console.error(`Failed to init module "${key}":`, err);
    }
  }
  setRegisteredJobKeys(allJobKeys);
}
