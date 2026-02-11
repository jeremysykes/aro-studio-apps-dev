import type { AroCore } from '@aro/core';
import { getActiveModuleKey, getInit, getRegisteredModuleKeys } from './moduleRegistry.js';
import { setRegisteredJobKeys } from './state.js';

const DEFAULT_MODULE_KEY = 'hello-world';

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
