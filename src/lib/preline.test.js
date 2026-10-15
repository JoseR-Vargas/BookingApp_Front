import { beforeEach, describe, expect, it, vi } from 'vitest';

// setup.js replaces the loader globally; this suite tests the real one.
const order = [];
vi.mock('../vendor-globals.js', () => { order.push('datatable-globals'); return {}; });
vi.mock('../vendor-globals-datepicker.js', () => { order.push('datepicker-globals'); return {}; });
vi.mock('@preline/dropdown/non-auto.mjs', () => ({ default: class HSDropdown {} }));
vi.mock('@preline/datatable/non-auto.mjs', () => { order.push('datatable'); return { default: class HSDataTable {} }; });
vi.mock('@preline/datepicker/non-auto.mjs', () => { order.push('datepicker'); return { default: class HSDatepicker {} }; });

describe('loadPreline (real loader)', () => {
  let loadPreline;

  beforeEach(async () => {
    order.length = 0;
    vi.resetModules();
    ({ loadPreline } = await vi.importActual('./preline.js'));
  });

  it('resolves the default export of the single-plugin package', async () => {
    const Plugin = await loadPreline('dropdown');
    expect(Plugin.name).toBe('HSDropdown');
  });

  it('shares one load between callers', async () => {
    const [first, second] = [loadPreline('dropdown'), loadPreline('dropdown')];
    expect(first).toBe(second);
  });

  it('loads the jQuery/DataTables globals before the datatable plugin', async () => {
    await loadPreline('datatable');
    expect(order.indexOf('datatable-globals')).toBeLessThan(order.indexOf('datatable'));
  });

  it('loads the lodash global before the datepicker plugin', async () => {
    await loadPreline('datepicker');
    expect(order.indexOf('datepicker-globals')).toBeLessThan(order.indexOf('datepicker'));
  });

  it('creates the global instance registries the plugins read in destroy()', async () => {
    delete window.$hsDatepickerCollection;
    delete window.$hsSelectCollection;

    await loadPreline('datepicker');

    expect(window.$hsDatepickerCollection).toEqual([]);
    expect(window.$hsSelectCollection).toEqual([]);
  });

  it('rejects unknown plugin names', async () => {
    await expect(loadPreline('carousel')).rejects.toThrow('Unknown Preline plugin');
  });
});
