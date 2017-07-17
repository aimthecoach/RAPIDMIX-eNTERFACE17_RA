// sets state with new object
export const setState = (state, payload) => {
  return Object.assign({}, state, payload)
}

// creates actions with or without payloads
export function createAction (name, payload) {
  return payload ? { type: name, payload } : { type: name }
}

/*
  converts imu objects into buffer vector
  imu = {
    accelerometer: {...},
    gyroscope: {...},
    orientation: {...}
  }
  INTO
  vectors: [ax, ay, az, gx, gy, gz, ow, ox, oy, oz]
 */
export const convertObjectsToVector = (imu, state) => {
  let vector = []
  Object.keys(imu).map(sensor => {
    if (state[sensor]) {
      Object.keys(imu[sensor]).map(axis => {
        if (state[sensor]) { vector.push(imu[sensor][axis]) }
      })
    }
  })
  return vector
}

export const formatToTrainingObject = (imu, state) => {
  return {
    input: convertObjectsToVector(imu, state)
  }
}

export const formatRecordedData = dataArray => {
  let resArray = []
  dataArray.map(gestureArray => {
    let gestureFormated = {}
    gestureArray.map(frameObj => {
      let keys = Object.keys(frameObj)
      keys.map(key => {
        if (gestureFormated[key] !== undefined) {
          gestureFormated[key] = [...gestureFormated[key], frameObj[key]]
        } else {
          gestureFormated[key] = []
          gestureFormated[key] = [...gestureFormated[key], frameObj[key]]
        }
      })
    })
    resArray = [ ...resArray, gestureFormated]
  })
  return resArray
}
