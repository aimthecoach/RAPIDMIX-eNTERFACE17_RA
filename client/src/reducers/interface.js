import {
SET_INTERFACE_MODE_NORMALBLANK,
SET_INTERFACE_ADD_EDIT ,
SET_INTERFACE_RUN_COMPARE ,
} from '../actions/types'

const initialState = {
  mode: 'NORMALBLANK'
}

const interfaceReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_INTERFACE_MODE_NORMALBLANK:
      return Object.assign({}, state, { mode: 'NORMALBLANK'})
    case SET_INTERFACE_ADD_EDIT:
      return Object.assign({}, state, { mode: 'ADD_EDIT' })
    case SET_INTERFACE_RUN_COMPARE:
      return Object.assign({}, state, { mode: 'RUN_COMPARE'})
    default:
      return state
  }
}

export default interfaceReducer
