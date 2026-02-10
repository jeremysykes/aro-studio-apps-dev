import React from 'react';
import HelloWorld from '@aro/module-hello-world/ui';
import Inspect from '@aro/module-inspect/ui';

/**
 * Registry of module keys to root UI components (renderer only).
 * Must match the keys registered in main process moduleRegistry.ts.
 */
export const moduleComponents: Record<string, React.ComponentType> = {
  'hello-world': HelloWorld,
  inspect: Inspect,
};
