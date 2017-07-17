import { createAction } from '../utils'
import { SAVE_GESTURE, SET_GESTURE_NAME } from './types'

/*
  saving gesture object =>
  {
    label: 'gestureName',
    sensors: {a,g,o},
    recorded:[
      [x,y,z],
      [x,y,z],
      [x,y,z],
      [x,y,z]
    ]
  }
 */
export const saveGesture = gesture => ({ type: SAVE_GESTURE, payload: gesture })
export const setGestureName = text => ({ type: SET_GESTURE_NAME, payload: text })
