import {
  START_RECORDING,
  STOP_RECORDING,
  SENSORS_SELECT_ALL,
  SENSORS_DESELECT_ALL,
  TOGGLE_SENSORS_SELECT_ACCELEROMETER,
  TOGGLE_SENSORS_SELECT_GYROSCOPE,
  TOGGLE_SENSORS_SELECT_ORIENTATION,
  SEND_BUFFER_TO_RECORDED,
  SAVE_VECTORS_TO_BUFFER } from './types'

import { createAction } from '../utils'

// recording
export const startRecording = () => ({ type: START_RECORDING })
export const stopRecording = () => ({ type: STOP_RECORDING })

// select
export const sensorsSelectAll = () => ({ type: SENSORS_SELECT_ALL })
export const sensorsDeselectAll = () => ({ type: SENSORS_DESELECT_ALL })
export const toggleSensorsSelectAccelerometer = () => ({ type: TOGGLE_SENSORS_SELECT_ACCELEROMETER })
export const toggleSensorsSelectGyroscope = () => ({ type: TOGGLE_SENSORS_SELECT_GYROSCOPE })
export const toggleSensorsSelectOrientation = () => ({ type: TOGGLE_SENSORS_SELECT_ORIENTATION })

/*
  vectors: [ax, ay, az, gx, gy, gz, ow, ox, oy, oz]
*/
// export const saveVectorToBuffer = vectors => createAction(SAVE_VECTORS_TO_BUFFER, vectors)
export const saveVectorToBuffer = vectors => ({ type: SAVE_VECTORS_TO_BUFFER, payload: vectors })

/*
  TODO: !!! Ao gravar o buffer convem saber quais os sensors utilizados e a ordem
      pode-se criar um objecto depois gravar o gesto para
 */
// export const sendBufferToRecorded = buffer => createAction(SEND_BUFFER_TO_RECORDED, buffer)
export const sendBufferToRecorded = buffer => ({ type: SEND_BUFFER_TO_RECORDED, payload: buffer })
