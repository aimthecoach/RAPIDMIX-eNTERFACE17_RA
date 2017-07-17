import { combineReducers } from 'redux'
import counterReducer from './counter'
import imuReducer from './imu'
import myoReducer from './myo'
import recordReducer from './record'
import gestureReducer from './gesture'
import chartsReducer from './charts'
import interfaceReducer from './interface'

const rootReducer = combineReducers({
  count: counterReducer,
  imu: imuReducer,
  myo: myoReducer,
  record: recordReducer,
  gesture: gestureReducer,
  charts: chartsReducer,
  interface: interfaceReducer
})

export default rootReducer
