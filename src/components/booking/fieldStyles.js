// Shared utility-class strings for the booking form controls. They reproduce the legacy look
// (framework `.form-control` / `.form-select` / `.form-label` + the base.css dark overrides).
// Kept as complete literal strings so Tailwind can detect every class.

export const FIELD_LABEL =
  'mb-2 inline-block text-sm font-semibold tracking-wide text-text-secondary lte-sm:text-[0.9rem]';

const CONTROL =
  'block w-full appearance-none rounded-md border border-border-subtle bg-bg-tertiary leading-normal text-text-primary transition-[border-color,box-shadow] duration-150 ease-[ease] placeholder:text-text-muted placeholder:opacity-100 focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-muted)] focus:outline-none';

// Legacy `.was-validated :invalid / :valid` icon (right side of the control, vertically centered).
const VALIDATION_ICON =
  'bg-no-repeat bg-[position:right_calc(0.375em+0.1875rem)_center] bg-[length:calc(0.75em+0.375rem)_calc(0.75em+0.375rem)] group-data-[validated=true]/form:invalid:bg-(image:--icon-field-invalid) group-data-[validated=true]/form:valid:bg-(image:--icon-field-valid) group-data-[validated=true]/form:invalid:pr-[calc(1.5em+0.75rem)] group-data-[validated=true]/form:valid:pr-[calc(1.5em+0.75rem)]';

// Legacy `.form-control.form-control-lg`.
export const INPUT_LG = `${CONTROL} ${VALIDATION_ICON} px-4 py-2 text-[1.25rem] touch:min-h-11 lte-md:px-3 lte-md:text-base`;

// Legacy `.form-control` (textarea): the icon sits at the top right corner.
export const TEXTAREA = `${CONTROL} ${VALIDATION_ICON} group-data-[validated=true]/form:invalid:bg-[position:right_calc(0.375em+0.1875rem)_top_calc(0.375em+0.1875rem)] group-data-[validated=true]/form:valid:bg-[position:right_calc(0.375em+0.1875rem)_top_calc(0.375em+0.1875rem)] min-h-[calc(1.5em+0.75rem+2px)] px-3 py-1.5 text-base`;

// Legacy `.form-select.form-select-lg` (the 768px media query swaps its padding/min-height).
export const SELECT_LG =
  `${CONTROL} touch-manipulation bg-(image:--icon-select-chevron) bg-no-repeat bg-[position:right_0.75rem_center] bg-[length:16px_12px] py-2 pr-9 pl-4 text-[1.25rem] lte-md:min-h-[50px] lte-md:px-4 lte-md:py-3 lte-md:text-[1.1rem] lte-sm:text-base ` +
  // Legacy `.form-select option` colors: free slots green, booked (disabled) slots red.
  '[&>option]:bg-bg-tertiary [&>option:not(:disabled):not([value=""])]:text-success [&>option:disabled]:text-error';

export const HELP_TEXT = 'mt-1 text-[0.875em] text-text-muted';

// Legacy `.invalid-feedback`: only visible once the form was validated AND the field is invalid.
// The field must carry the `peer` class and the feedback must be one of its next siblings.
export const INVALID_FEEDBACK =
  'mt-1 hidden text-[0.875em] text-error group-data-[validated=true]/form:peer-invalid:block';

// Legacy reboot rules for the native date input: no inner padding around the editable segments
// (Chrome adds 1px/2px by default), otherwise the value renders wider than in the legacy form.
export const DATE_INPUT_RESET =
  '[&::-webkit-datetime-edit]:block [&::-webkit-datetime-edit]:p-0 [&::-webkit-datetime-edit-fields-wrapper]:p-0 [&::-webkit-datetime-edit-text]:p-0 [&::-webkit-datetime-edit-month-field]:p-0 [&::-webkit-datetime-edit-day-field]:p-0 [&::-webkit-datetime-edit-year-field]:p-0';

// Preline advanced-select skin for the booking form (see ui/Select.jsx): same box as SELECT_LG
// (`.form-select.form-select-lg`), so the field looks like the native control it replaces.
export const SELECT_TOGGLE_LG =
  'relative flex w-full cursor-pointer touch-manipulation items-center rounded-md border border-border-subtle bg-bg-tertiary py-2 pr-9 pl-4 text-left text-[1.25rem] leading-normal text-text-primary transition-[border-color,box-shadow] duration-150 ease-[ease] hs-select-disabled:pointer-events-none hs-select-disabled:opacity-50 hs-select-opened:border-accent focus:border-accent focus:shadow-[0_0_0_3px_var(--color-accent-muted)] focus:outline-none lte-md:min-h-[50px] lte-md:px-4 lte-md:py-3 lte-md:text-[1.1rem] lte-sm:text-base';
