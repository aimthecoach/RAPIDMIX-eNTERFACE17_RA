import { MYO_CONNECT, MYO_DISCONNECT } from './types'
// mock socket
import { socket } from '../services/mock'

export const myoConnect = () => {
  socket.emit('startMock')
  return {
    type: MYO_CONNECT
  }
}
export const myoDisconnect = () => {
  socket.emit('stopMock')
  return {
    type: MYO_DISCONNECT
  }
}
