import DiscoListView from './disco-list-view.js';
import DiscoListItem from './disco-list-item.js';
import DiscoListHeaderItem from './disco-list-header-item.js';

/**
 * @typedef {object} DiscoListNamespace
 * @property {typeof DiscoListView} DiscoListView
 * @property {typeof DiscoListItem} DiscoListItem
 * @property {typeof DiscoListHeaderItem} DiscoListHeaderItem
 */

/** @type {DiscoListNamespace} */
const DiscoList = {
  DiscoListView,
  DiscoListItem,
  DiscoListHeaderItem
};

export default DiscoList;
