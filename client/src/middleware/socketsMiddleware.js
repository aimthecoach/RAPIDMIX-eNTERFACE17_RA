import { socket } from '../services/mock'

export const socketMiddleware = store => next => action => {
  let {
    record: { recording, sensors },
    imu: {accelerometer, gyroscope, orientation},
    interface: { mode }
  } = store.getState()
  if (recording) {
    let frame = {}
    if (sensors.accelerometer) {
      frame = Object.assign({}, frame, { accelerometer })
    }
    if (sensors.gyroscope) {
      frame = Object.assign({}, frame, { gyroscope })
    }
    if (sensors.orientation) {
      frame = Object.assign({}, frame, { orientation })
    }
    if(mode === 'RUN_COMPARE') {
      // corre quando estamos live
      socket.on('start_recording_comp_sample', {frame})
    } else {
      // corre em treinos
      socket.emit('record_frame_vector', { frame })
    }
  }
  if (action.type === 'STOP_RECORDING') {
    if(mode === 'RUN_COMPARE') {
      socket.emit('start_recording_comp_sample')
    } else {
      socket.emit('stop_recording')
    }
  }
  if(action.type === 'TRAIN_MODEL') {
    socket.emit('stop_recording')
  }
  next(action)
}
