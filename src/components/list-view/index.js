import DiscoListView from './disco-list-view.js';
import DiscoListItem from './disco-list-item.js';

/**
 * @typedef {object} DiscoListNamespace
 * @property {typeof DiscoListView} DiscoListView
 * @property {typeof DiscoListItem} DiscoListItem
 */

/** @type {DiscoListNamespace} */
const DiscoList = {
  DiscoListView,
  DiscoListItem
};

export default DiscoList;
