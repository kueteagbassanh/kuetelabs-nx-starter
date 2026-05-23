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
            // === LAYER CONSTRAINTS (Vertical Rules) ===
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:util',
                'type:routes',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:data-access',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: [
                'type:ui',
                'type:util',
                'type:data-access',
              ],
            },
            {
              sourceTag: 'type:routes',
              onlyDependOnLibsWithTags: [
                'type:routes',
                'type:ui',
                'type:feature',
                'type:data-access',
                'type:util',
              ],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:data-access', 'type:util'],
            },
            {
              sourceTag: 'platform:api',
              onlyDependOnLibsWithTags: [
                'platform:api',
                'domain:shared',
                'type:util',
              ],
              // NestJS can leverage shared utility libraries or validation models, but cannot import Angular UI code!
            },

            // === DOMAIN CONSTRAINTS (Horizontal Rules) ===
            {
              sourceTag: 'domain:products',
              onlyDependOnLibsWithTags: ['domain:products', 'domain:shared'],
              // ❌ Blocks the products domain from importing code from the payments or orders domain
            },
            {
              sourceTag: 'domain:payments',
              onlyDependOnLibsWithTags: [
                'domain:payments',
                'domain:products',
                'domain:shared',
              ],
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
