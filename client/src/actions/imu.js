import {
  SET_IMU,
  SET_ACCELEROMETER,
  SET_GYROSCOPE,
  SET_ORIENTATION
  } from './types'

export const setIMU = imu => ({
  type: SET_IMU,
  payload: imu
})

export const setAccelerometer = accel => ({
  type: SET_ACCELEROMETER,
  payload: accel
})
export const setGyroscope = gyro => ({
  type: SET_GYROSCOPE,
  payload: gyro
})
export const setOrientation = orient => ({
  type: SET_ORIENTATION,
  payload: orient
})
