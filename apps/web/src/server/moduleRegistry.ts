/**
 * Web module registration.
 * Registers built-in modules with the shared registry from @aro/core.
 * All registry logic (config, accessors) is delegated to @aro/core.
 */
import { registerModule } from '@aro/core';
import { init as helloWorldInit } from '@aro/module-hello-world';
import { init as inspectInit } from '@aro/module-inspect';

registerModule('hello-world', helloWorldInit);
registerModule('inspect', inspectInit);

// Re-export shared registry API so local imports continue to work
export {
  registerModule,
  getInit,
  getRegisteredModuleKeys,
  resolveConfig,
  getResolvedConfig,
  getUIModel,
  getEnabledModuleKeys,
} from '@aro/core';
export type { ModuleInit, UIModel } from '@aro/types';
