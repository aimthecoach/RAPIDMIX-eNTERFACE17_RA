import {
  SET_ACCELEROMETER,
  SET_IMU,
  SET_GYROSCOPE,
  SET_ORIENTATION } from '../actions/types'

const initialState = {
  accelerometer: {
    x: 0,
    y: 0,
    z: 0
  },
  gyroscope: {
    x: 0,
    y: 0,
    z: 0
  },
  orientation: {
    x: 0,
    y: 0,
    z: 0,
    w: 0
  }
}

// Used for Recharts Data
const imuReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_IMU:
      return Object.assign({}, state, action.payload)
    // case SET_ACCELEROMETER:
    //   return Object.assign({}, state, { accelerometer: action.payload })
    // case SET_GYROSCOPE:
    //   return Object.assign({}, state, { gyroscope: action.payload })
    // case SET_ORIENTATION:
    //   return Object.assign({}, state, { orientation: action.payload })
    default:
      return state
  }
}

export default imuReducer
