import { SAVE_GESTURE, SET_GESTURE_NAME } from '../actions/types'

// const initialState = []
const initialState = {
  collection: [],
  gesture: {
    name: '',
    data: [],
    sensors: {
      accelerometer: false,
      gyroscope: false,
      orientation: false
    }
  }
}

const gestureReducer = (state = initialState, action) => {
  switch (action.type) {
    case SAVE_GESTURE:
      return Object.assign({}, state, { collection: [...state.collection, state.gesture ], gesture: {
        name: '',
        data: [],
        sensors: {
          accelerometer: false,
          gyroscope: false,
          orientation: false
        }
      }
    })
    case SET_GESTURE_NAME:
      return Object.assign({}, state, { gesture: { name: action.payload }})
    
    default:
      return state
  }
}

export default gestureReducer
