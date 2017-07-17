import io from 'socket.io-client'
import {
  setIMU,
  setAccelerometer,
  setGyroscope,
  setOrientation } from '../actions/imu'
import {
  saveVectorToBuffer
} from '../actions/record'

export const socket = io('http://localhost:3001')

export default (store) => {
  socket.on('connect', () => {
    console.log('client connect to server')
    socket.emit('getUsers')

    socket.on('mock_imu', imu => {
      // to populate the main charts
      store.dispatch(setIMU(imu))
    })

    socket.on('SERVER_ACTIONS', action => store.dispatch(action))
  })
}
