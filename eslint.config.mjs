import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/out-tsc'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // --- LAYER BOUNDARIES (type:*) ---
            // Every matching constraint applies, so a lib must satisfy its type
            // rule AND its platform rule.
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:layout', 'type:feature', 'type:data-access', 'type:ui', 'type:util', 'type:core']
            },
            {
              sourceTag: 'type:layout',
              onlyDependOnLibsWithTags: ['type:feature', 'type:data-access', 'type:ui', 'type:util']
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:feature', 'type:data-access', 'type:ui', 'type:util', 'type:core']
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util']
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:data-access', 'type:util', 'type:core']
            },
            {
              sourceTag: 'type:core',
              onlyDependOnLibsWithTags: ['type:core', 'type:data-access', 'type:util']
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util']
            },

            // --- PLATFORM ISOLATION BOUNDARIES (platform:*) ---
            // This is what stops a shared zod contract from importing @nestjs/common
            // and detonating the browser bundle.
            {
              sourceTag: 'platform:web',
              onlyDependOnLibsWithTags: ['platform:frontend', 'platform:shared']
            },
            {
              sourceTag: 'platform:frontend',
              onlyDependOnLibsWithTags: ['platform:frontend', 'platform:shared']
            },
            {
              sourceTag: 'platform:backend',
              onlyDependOnLibsWithTags: ['platform:backend', 'platform:shared']
            },
            {
              sourceTag: 'platform:shared',
              onlyDependOnLibsWithTags: ['platform:shared']
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
