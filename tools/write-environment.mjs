#!/usr/bin/env node
/**
 * Bake per-deploy values into an Angular environment file before a build.
 *
 * Angular environment files are literals, not `process.env` reads — the bundle
 * runs in a browser where `process` does not exist. So per-deploy values have to
 * be substituted *before* the build (see docs/ARCHITECTURE.md §12: one build per
 * environment). The Docker images call this from their build stage so an image
 * can be built for a target environment without editing tracked source.
 *
 * Usage:  node tools/write-environment.mjs <path-to-environment.ts>
 *
 * Each mapping below is applied only when its environment variable is set and
 * non-empty, so running this with no variables set is a no-op and the file
 * checked into the repo is used as-is.
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** environment.ts property <- environment variable */
const MAPPINGS = {
  appName: 'APP_NAME',
  apiUrl: 'API_URL',
  supabaseUrl: 'SUPABASE_URL',
  supabaseAnonKey: 'SUPABASE_ANON_KEY',
};

const target = process.argv[2];
if (!target) {
  console.error('usage: node tools/write-environment.mjs <environment file>');
  process.exit(1);
}

let source = readFileSync(target, 'utf8');
const applied = [];

for (const [property, variable] of Object.entries(MAPPINGS)) {
  const value = process.env[variable];
  if (!value) continue;

  // Only rewrite properties the file already declares — adding a key the app
  // never reads would silently do nothing, and a typo should be loud.
  const pattern = new RegExp(`(\\b${property}\\s*:\\s*)'[^']*'`);
  if (!pattern.test(source)) {
    console.warn(`[write-environment] ${target} has no '${property}' — skipped`);
    continue;
  }

  source = source.replace(pattern, `$1'${value.replace(/'/g, "\\'")}'`);
  applied.push(property);
}

if (applied.length === 0) {
  console.log(`[write-environment] ${target} left unchanged`);
} else {
  writeFileSync(target, source);
  console.log(`[write-environment] ${target} <- ${applied.join(', ')}`);
}
