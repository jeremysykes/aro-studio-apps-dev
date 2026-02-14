import type { AroCore } from './types.js';
import { getUIModel, getEnabledModuleKeys, getInit } from './moduleRegistry.js';

/**
 * Load modules based on the active UI model.
 *
 * - standalone: loads only the first module in ARO_ENABLED_MODULES.
 * - sidebar / dashboard / tabs / carousel: loads all modules in ARO_ENABLED_MODULES.
 *
 * @param core - The AroCore instance to pass to module init functions.
 * @param setRegisteredJobKeys - Callback to store the aggregated job keys
 *        (host provides this because state management is host-specific).
 */
export function loadModules(core: AroCore, setRegisteredJobKeys: (keys: string[]) => void): void {
  const model = getUIModel();
  const enabledKeys = getEnabledModuleKeys();
  if (enabledKeys.length === 0) {
    console.warn('ARO_ENABLED_MODULES is empty or unset — no modules loaded');
    return;
  }

  const keysToLoad = model === 'standalone' ? [enabledKeys[0]] : enabledKeys;

  if (model === 'standalone' && enabledKeys.length > 1) {
    console.warn(
      'Standalone mode — only loading first module:',
      enabledKeys[0],
      '(ignoring:',
      enabledKeys.slice(1).join(', ') + ')',
    );
  }

  const allJobKeys: string[] = [];
  for (const key of keysToLoad) {
    const init = getInit(key);
    if (!init) continue;
    try {
      const jobKeys = init(core);
      allJobKeys.push(...jobKeys);
    } catch (err) {
      console.error(`Failed to init module "${key}":`, err);
    }
  }
  setRegisteredJobKeys(allJobKeys);
}
