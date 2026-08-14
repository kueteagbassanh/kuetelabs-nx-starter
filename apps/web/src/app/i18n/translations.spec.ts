import en from './en.json';
import fr from './fr.json';

/** Every leaf path in a nested message object, e.g. `landing.nav.features`. */
function leafKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

/**
 * The landing copy is data, so a missing key is invisible until someone loads
 * the page in that language and sees a raw key. These two assertions are what
 * turn that into a failing test instead.
 */
describe('app translations', () => {
  const enKeys = leafKeys(en);
  const frKeys = leafKeys(fr);

  it('has a French entry for every English key', () => {
    expect(enKeys.filter((key) => !frKeys.includes(key))).toEqual([]);
  });

  it('has no French key that English is missing', () => {
    expect(frKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
  });

  it('leaves no empty strings behind', () => {
    const empty = [...leafKeys(en), ...leafKeys(fr)].filter((key) => key.endsWith('.'));
    expect(empty).toEqual([]);
  });
});
