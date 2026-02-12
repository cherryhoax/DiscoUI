import DiscoPivotPage from './disco-pivot.js';
import DiscoPivotItem from './disco-pivot-item.js';

/**
 * @typedef {object} DiscoPivotNamespace
 * @property {typeof DiscoPivotPage} DiscoPivotPage
 * @property {typeof DiscoPivotItem} DiscoPivotItem
 */

/** @type {DiscoPivotNamespace} */
const DiscoPivot = {
    DiscoPivotPage,
    DiscoPivotItem,
};

export default DiscoPivot;