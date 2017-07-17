import { MYO_CONNECT, MYO_DISCONNECT } from '../actions/types'
import { setState } from '../utils'

const initialState = {
  connected: false
}

const myoReducer = (state = false, action) => {
  switch (action.type) {
    case MYO_CONNECT:
      return setState(state, { connected: true })
    case MYO_DISCONNECT:
      return setState(state, { connected: false })
    default:
      return state
  }
}

export default myoReducer
