import { fromJS, is, List, Set } from 'immutable'

import {normalizeResponse} from './utils'
import { entitiesToRecords } from '../records'

import actions from './actions'
import { createReducer, safeMergeDeep, fromJSOrdered } from './utils'

// Initial module state
const initialState = fromJS({
  containers: {},
  entities: {},
  requests: {}
})

// Initial state of a given container
const initialContainerState = fromJS({
  activeRequests: Set(),
  latestRequest: null,
  scope: null,
  filters: {},
  ids: [],
  meta: {},
  errors: []
})

const handleAddActiveRequest = (state, { containerId, requestId }) =>
  state.updateIn(['containers', containerId, 'activeRequests'], (val) => val.add(requestId))

const handleDeleteActiveRequest = (state, { containerId, requestId }) =>
  state
    .updateIn(['containers', containerId, 'activeRequests'], (val) => val.delete(requestId))
    .setIn(['containers', containerId, 'latestRequest'], requestId)

const handleMergeContainerData = (state, { containerId, ...containerData }) =>
  state.updateIn(
    ['containers', containerId],
    initialContainerState,
    (val) => val.mergeWith((a, b) => is(a, b) ? a : b, containerData)
  )

const handleMergeFilters = (state, { containerId, filters }) =>
  state.mergeIn(['containers', containerId, 'filters'], filters)

const handleSetFilters = (state, { containerId, filters }) =>
  state.setIn(['containers', containerId, 'filters'], fromJS(filters))

const handleResetContainerData = (state, { containerId }) => {
  const originalType = state.getIn(['containers', containerId, 'type'])
  return state
    .setIn(['containers', containerId], initialContainerState.set('type', originalType))
}

const handleAddContainerId = (state, {containerId, id}) =>
  state.updateIn(
    ['containers', containerId, 'ids'],
    arr => arr.concat(List([id]))
  )

const handleRemoveContainerId = (state, {containerId, id}) =>
  state.updateIn(
    ['containers', containerId, 'ids'],
    arr => arr.filter(item => item !== id)
  )

const handleUpdateEntities = (state, {itemId, associationKey, response, baseSchemaType, schemaType}) => {
  const { ids, entities } = normalizeResponse(response, schemaType)
  if (itemId && associationKey && baseSchemaType) {
    _.set(entities, `${baseSchemaType}.${itemId}.${associationKey}`, ids)
  }
  return state.updateIn(['entities'], (val) => entitiesToRecords(val.mergeWith(safeMergeDeep, fromJSOrdered(entities))))
}

const handleMergeEntities = (state, { entities }) =>
  state.updateIn(['entities'], (val) => entitiesToRecords(val.mergeWith(safeMergeDeep, fromJSOrdered(entities))))

const handleSetRequestStarted = (state, { requestId, ...rest }) =>
  state.mergeIn(['requests', requestId], { ...rest, requestedAt: new Date().getTime() })

const handleSetRequestCompleted = (state, { requestId, ...rest }) =>
  state.mergeIn(['requests', requestId], { ...rest, respondedAt: new Date().getTime() })

export {
  initialState,
  initialContainerState,

  handleAddActiveRequest,
  handleDeleteActiveRequest,
  handleMergeContainerData,
  handleMergeFilters,
  handleSetFilters,
  handleResetContainerData,
  handleUpdateEntities,
  handleAddContainerId,
  handleRemoveContainerId,
  handleMergeEntities,
  handleSetRequestStarted,
  handleSetRequestCompleted
}

export default createReducer(initialState, {
  [actions.D.ADD_ACTIVE_REQUEST]: handleAddActiveRequest,
  [actions.D.DELETE_ACTIVE_REQUEST]: handleDeleteActiveRequest,
  [actions.D.MERGE_CONTAINER_DATA]: handleMergeContainerData,
  [actions.D.RESET_CONTAINER_DATA]: handleResetContainerData,
  [actions.D.UPDATE_ENTITIES]: handleUpdateEntities,
  [actions.D.ADD_CONTAINER_ID]: handleAddContainerId,
  [actions.D.REMOVE_CONTAINER_ID]: handleRemoveContainerId,
  [actions.D.MERGE_ENTITIES]: handleMergeEntities,
  [actions.D.MERGE_FILTERS]: handleMergeFilters,
  [actions.D.SET_FILTERS]: handleSetFilters,
  [actions.D.SET_REQUEST_STARTED]: handleSetRequestStarted,
  [actions.D.SET_REQUEST_COMPLETED]: handleSetRequestCompleted
})
