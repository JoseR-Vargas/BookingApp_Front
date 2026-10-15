/*
 * Preline's datepicker merges its configuration with lodash, read as the global `_`
 * (`_.merge` / `_.mergeWith`). Only those two functions are used, so the per-method lodash
 * packages are loaded instead of the whole library. Must be evaluated BEFORE
 * `@preline/datepicker` (src/lib/preline.js awaits it first).
 */
import merge from 'lodash.merge';
import mergeWith from 'lodash.mergewith';

window._ = { ...(window._ || {}), merge, mergeWith };
