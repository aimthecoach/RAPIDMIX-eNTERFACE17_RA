import { setOrientation, setAccelerometer, setGyroscope } from '../actions/imu'
import { convertObjectsToVector } from '../utils'
import { saveVectorToBuffer } from '../actions/record'

export default function (store) {
  Myo.on('connected', () => {
    console.log('connected')
  })

  Myo.on('disconnected', () => {

  })

  Myo.on('status', status => {

  })

  Myo.on('imu', imu => {
    // Updates state's sensors values for charting
    store.dispatch(setAccelerometer(imu.accelerometer))
    store.dispatch(setGyroscope(imu.gyroscope))
    store.dispatch(setOrientation(imu.orientation))

    //  Saves data with right format
    // if('recording') {
      // get state => state.record.sensors
      // let vector = convertObjectsToVector(imu, state.record.sensors )
      // store.dispatch(saveVectorToBuffer(vector))
    // }
  })
}
