import DiscoPivotPage from './disco-pivot-page.js';
import DiscoPivotItem from './disco-pivot-item.js';
import DiscoSinglePage from './disco-single-page.js';

/**
 * @typedef {object} DiscoPivotNamespace
 * @property {typeof DiscoPivotPage} DiscoPivotPage
 * @property {typeof DiscoPivotItem} DiscoPivotItem
 * @property {typeof DiscoSinglePage} DiscoSinglePage
 */

/** @type {DiscoPivotNamespace} */
const DiscoPivot = {
    DiscoPivotPage,
    DiscoPivotItem,
    DiscoSinglePage
};

export default DiscoPivot;