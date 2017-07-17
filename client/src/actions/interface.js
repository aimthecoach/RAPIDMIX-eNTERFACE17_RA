import {
SET_INTERFACE_MODE_NORMALBLANK,
SET_INTERFACE_ADD_EDIT ,
SET_INTERFACE_RUN_COMPARE ,
} from './types'

export const setInterfaceNormalBlank = () => ({ type: SET_INTERFACE_MODE_NORMALBLANK })
export const setInterfaceAddEdit = () => ({ type: SET_INTERFACE_ADD_EDIT })
export const setInterfaceRunCompare = () => ({ type: SET_INTERFACE_RUN_COMPARE })
