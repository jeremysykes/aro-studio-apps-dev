import type { AroCore } from '@aro/core';
import { getActiveModuleKey, getEnabledModuleKeys, getInit, getRegisteredModuleKeys, getUIModel } from './moduleRegistry.js';
import { setRegisteredJobKeys } from './state.js';

const DEFAULT_MODULE_KEY = 'hello-world';

/**
 * Load a single module (standalone mode).
 */
export function loadActiveModule(core: AroCore): void {
  const key = getActiveModuleKey();
  let init = getInit(key);
  if (!init) {
    console.warn(
      'Invalid ARO_ACTIVE_MODULE:',
      key,
      '- valid:',
      getRegisteredModuleKeys().join(', '),
      '- falling back to',
      DEFAULT_MODULE_KEY
    );
    init = getInit(DEFAULT_MODULE_KEY);
    if (!init) throw new Error(`Default module ${DEFAULT_MODULE_KEY} not registered`);
  }
  const keys = init(core);
  setRegisteredJobKeys(keys);
}

/**
 * Load all enabled modules (sidebar / dashboard mode).
 */
export function loadEnabledModules(core: AroCore): void {
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

/**
 * Dispatcher: loads modules based on the active UI model.
 */
export function loadModules(core: AroCore): void {
  const model = getUIModel();
  if (model === 'standalone') {
    loadActiveModule(core);
  } else {
    loadEnabledModules(core);
  }
}
