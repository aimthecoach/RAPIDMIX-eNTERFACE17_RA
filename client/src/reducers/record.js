import { setState } from '../utils'
import {
  START_RECORDING,
  STOP_RECORDING,
  SENSORS_SELECT_ALL,
  SENSORS_DESELECT_ALL,
  SAVE_VECTORS_TO_BUFFER,
  TOGGLE_SENSORS_SELECT_ACCELEROMETER,
  TOGGLE_SENSORS_SELECT_GYROSCOPE,
  TOGGLE_SENSORS_SELECT_ORIENTATION } from '../actions/types'
  // SAVE_VECTORS_TO_BUFFER,

/*
  recording: true or false,
  buffer: [] array of data recorded, => records a gesture
  recorded: [] array of arrays of data recorded, => different gestures
 */
const initialState = {
  recording: false,
  recordBuffer: [],
  recorded: [],
  sensors: {
    accelerometer: false,
    gyroscope: false,
    orientation: false
  },
  run_record: [],
  winner: null
}
// {
//   recorded: [
//     [x,y,z],
//     [x,y,z],
//     [x,y,z],
//     [x,y,z],
//   ]
// }

const recordReducer = (state = initialState, action) => {
  switch (action.type) {

    case START_RECORDING:
      return setState(state, {recording: true, winner: null,   run_record:[]})
    case STOP_RECORDING:
      return setState(state, { recording: false })
    case 'SET_RECORDED_FROM_SOCKET':
      return setState(state, { recorded: [...state.recorded, action.payload ]})
    case 'SET_DTW_RESULT':
      return setState(state, {
        run_record: [...state.recorded, action.payload ],
        winner: action.payload.winner
      })
    case SENSORS_SELECT_ALL:
      return setState(state, { sensors: {
    		accelerometer: true,
    		gyroscope: true,
    		orientation: true
    	}})
    case SENSORS_DESELECT_ALL:
      return setState(state, {sensors: {
        accelerometer: false,
        gyroscope: false,
        orientation: false
      }})
    case TOGGLE_SENSORS_SELECT_ACCELEROMETER:
      return setState(state, {sensors: Object.assign({}, state.sensors, { accelerometer: !state.sensors.accelerometer })})
    case TOGGLE_SENSORS_SELECT_GYROSCOPE:
      return setState(state, {sensors: Object.assign({}, state.sensors, { gyroscope: !state.sensors.gyroscope })})
    case TOGGLE_SENSORS_SELECT_ORIENTATION:
      return setState(state, {sensors: Object.assign({}, state.sensors, { orientation: !state.sensors.orientation })})
    default:
      return state
  }
}

export default recordReducer
