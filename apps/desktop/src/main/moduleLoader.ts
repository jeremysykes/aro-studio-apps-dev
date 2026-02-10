import type { AroCore } from '@aro/core';
import { init } from '@aro/module-hello-world';
import { setRegisteredJobKeys } from './state.js';

export function loadActiveModule(core: AroCore): void {
  const keys = init(core);
  setRegisteredJobKeys(keys);
}
