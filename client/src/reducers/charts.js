import {
  SET_ACCELEROMETER,
  SET_IMU,
  SET_GYROSCOPE,
  SET_ORIENTATION } from '../actions/types'

let resolution = 60
const fillStateO = () => {
  let newState = []
  for (let i = 0; i < resolution; i++) {
    newState.push({
      w: 0,
      x: 0,
      y: 0,
      z: 0
    })
  }
  return newState
}
const fillState = () => {
  let newState = []
  for (let i = 0; i < resolution; i++) {
    newState.push({
      x: 0,
      y: 0,
      z: 0
    })
  }
  return newState
}
const initialState = {
  accelerometer: fillState(),
  gyroscope: fillState(),
  orientation: fillStateO()
}
// let arrayOfZeros = Array.apply(null, Array(resolution)).map(Number.prototype.valueOf, 0)
// const initialState = {
//   accelerometer: {
//     x: arrayOfZeros.slice(0),
//     y: arrayOfZeros.slice(0),
//     z: arrayOfZeros.slice(0)
//   },
//   gyroscope: {
//     x: arrayOfZeros.slice(0),
//     y: arrayOfZeros.slice(0),
//     z: arrayOfZeros.slice(0)
//   },
//   orientation: {
//     w: arrayOfZeros.slice(0),
//     x: arrayOfZeros.slice(0),
//     y: arrayOfZeros.slice(0),
//     z: arrayOfZeros.slice(0)
//   }
// }

// Used for Recharts Data
const chartsReducer = (state = initialState, action) => {
  const { payload, type } = action

  switch (type) {
    case SET_IMU:
      return Object.assign({}, state, {
        accelerometer: [ ...state.accelerometer.slice(1), payload.accelerometer],
        gyroscope: [ ...state.gyroscope.slice(1), payload.gyroscope],
        orientation: [ ...state.orientation.slice(1), payload.orientation]
      })
    // FLOT STUFF
    // case SET_ACCELEROMETER:
    //   console.log('x', accelerometer.x)
    //   console.log('payload', payload.x)
    //   return Object.assign({}, state, { accelerometer: {
    //     x: [ ...gyroscope.x.slice(1), payload.x],
    //     y: [ ...gyroscope.y.slice(1), payload.y],
    //     z: [ ...gyroscope.z.slice(1), payload.z]
    //   }})
    // case SET_GYROSCOPE:
    //   return Object.assign({}, state, { gyroscope: {
    //     x: [ ...accelerometer.x.slice(1), payload.x],
    //     y: [ ...accelerometer.y.slice(1), payload.y],
    //     z: [ ...accelerometer.z.slice(1), payload.z]
    //   }})
    // case SET_ORIENTATION:
    //   return Object.assign({}, state, { orientation: {
    //     w: [ ...orientation.w.slice(1), payload.w],
    //     x: [ ...orientation.x.slice(1), payload.x],
    //     y: [ ...orientation.y.slice(1), payload.y],
    //     z: [ ...orientation.z.slice(1), payload.z]
    //   }})
    default:
      return state
  }
}

export default chartsReducer
