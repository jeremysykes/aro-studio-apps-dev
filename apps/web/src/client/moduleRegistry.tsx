import React from 'react';
import HelloWorld from '@aro/module-hello-world/ui';
import Inspect from '@aro/module-inspect/ui';

export const moduleComponents: Record<string, React.ComponentType> = {
  'hello-world': HelloWorld,
  inspect: Inspect,
};
