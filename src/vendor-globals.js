/*
 * Browser globals that Preline's datatable plugin looks up on `window` at construction time
 * (`$` / `jQuery` and `DataTable`). The plugin does not import them itself, so this module must be
 * evaluated BEFORE `@preline/datatable` (see src/lib/preline.js, which awaits it first).
 * Only the admin panel pulls this chunk in: jQuery + datatables.net stay out of the public bundle.
 */
import jQuery from 'jquery';
import DataTable from 'datatables.net-dt';

window.$ = jQuery;
window.jQuery = jQuery;
window.DataTable = DataTable;
