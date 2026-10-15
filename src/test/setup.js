import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// jsdom cannot run Preline's DOM behavior (positioning, observers, jQuery/DataTables rendering), so
// by default the runtime loader never resolves: components render their plain React markup and no
// plugin instance is ever created. Suites that care about the Preline contract override this mock
// with their own fake plugin classes (see src/lib/usePrelineInstance.test.jsx).
vi.mock('../lib/preline.js', () => ({
  loadPreline: vi.fn(() => new Promise(() => {})),
}));
