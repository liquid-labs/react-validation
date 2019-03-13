import { actionTypes } from './actions'

import isEqual from 'lodash.isequal'

const settings = {
  historyLength  : 10,
}

const INITIAL_STATE = {
  origData     : undefined,
  dataHistory  : [], // set to 'undefined' when 'historyLength <= 0'
  historyIndex : 0,
  fieldData    : { /*
    fieldName : {
      value: <some primitive value>,
      validators: [ array of validator functions ]
      errorMsg : <current error message string> | null,
      touched: false | true,
      blurredAfterChange: false | true,
    } */
  },
  lastUpdate   : null
}

/**
 * 'fieldEntryTemplate' is a convenience template for 'fieldData' entries.
 */
const fieldEntryTemplate = {
  value      : undefined,
  validators : [],
  errorMsg   : null,
  touched    : false,
  blurredAfterChange : true,
}

const objToInputVal = (val) => val === null || val === undefined ? '' : val + ''

/**
 * 'validateFieldsValue' checks the given 'value' against the 'validators' and
 * returns the first error message produced or 'null' no validation failed.
 */
const validateFieldValue = (value, validators) => {
  if (validators) {
    // First validator to fail is the one we use.
    let errorMsg = null
    validators.some((validator) => {
      return (errorMsg = validator(objToInputVal(value)))
    })
    return errorMsg
  }
}

/**
 * 'exportDataFromState' reduces the 'state'
 */
const exportDataFromState = (state) => Object.entries(state.fieldData)
  .reduce((data, [fieldName, fieldEntry]) => {
    data[fieldName] = fieldEntry.value
    return data
  }, {})

/**
 * 'processHistoryUpdate' potentialy generates a new 'dataHistory' to capture
 * the current state of the data. If the current data is equivalent to the most
 * recent history state, then the current 'state.dataHistory' is returned.
 * Otherwise, a new array, of length 'historyLength' or less, is generated and
 * returned.
 */
const processHistoryUpdate = (state) => {
  const { dataHistory } = state
  if (dataHistory === undefined) return dataHistory
  else if (settings.historyLength > 0) {
    if (dataHistory.length === 0) return [ exportDataFromState(state) ]
    // else
    const currData = exportDataFromState(state)
    if (isEqual(dataHistory[dataHistory.length - 1], currData)) {
      return dataHistory
    }
    else {
      // We use 'concat' to create a new array.
      const newHistory = dataHistory.concat([ currData ])
      // Should never need to shift more than one, but...
      while (newHistory.length > settings.historyLength) newHistory.shift()
      return newHistory
    }
  }
  else return dataHistory
}

const reducer = (state, action) => {
  switch (action.type) {
  case actionTypes.UPDATE_DATA :
  case actionTypes.RESET_DATA :
  case actionTypes.OFFSET_DATA : {
    // or a programatic update or reset
    let data = action.data || state.origData
    let newHistoryIndex = 0 // for update
    if (action.type === actionTypes.OFFSET_DATA) {
      if (!state.dataHistory) {
        throw new Error(`Cannot offset data with no history.`)
      }

      newHistoryIndex = state.historyIndex + action.offset
      if (newHistoryIndex < 0) newHistoryIndex = 0
      if (newHistoryIndex > (state.dataHistory.length - 1))
        newHistoryIndex = (state.dataHistory.length - 1)

      data = state.dataHistory[newHistoryIndex]
    }
    const newState = {
      ...state,
      origData     : action.type === actionTypes.UPDATE_DATA ? data : state.origData,
      historyIndex : newHistoryIndex,
      fieldData    : Object.entries(data).reduce((newFieldData, [fieldName, value]) => {
          newFieldData[fieldName] = {
            ...(state.fieldData[fieldName] || fieldEntryTemplate),
            value,
            errorMsg: validateFieldValue(value, state.fieldData[fieldName] && state.fieldData[fieldName].validators)
          }
          return newFieldData
        }, {}),
      lastUpdate   : action.type === actionTypes.UPDATE_DATA ? data : state.lastUpdate
    }
    const dataHistory =
      action.type === actionTypes.OFFSET_DATA
        ? state.dataHistory // then no change
        : settings.historyLength <= 0
          ? undefined
          : action.type === actionTypes.RESET_DATA
            ? processHistoryUpdate(newState)
            : [ data ]
    newState.dataHistory = dataHistory
    if (action.type === actionTypes.RESET_DATA && newState.dataHistory) {
      newState.historyIndex = newState.dataHistory.length - 1
    }
    return newState
  }

  case actionTypes.UPDATE_FIELD_VALUE : {
    const { fieldName, value } = action
    if (value === undefined) throw new Error(`Value (for '${fieldName}') cannot be 'undefined'.`)
    const fieldEntry = state.fieldData[fieldName] || fieldEntryTemplate
    // note template 'value' is 'undefined', and per above check, 'value' can
    // never be 'undefined'.
    if (fieldEntry.value !== value) {
      return {
        ...state,
        fieldData : {
          ...state.fieldData,
          [fieldName] : {
            ...fieldEntry,
            errorMsg : validateFieldValue(value, fieldEntry.validators),
            value    : value,
            blurredAfterChange : false
          }
        }
      }
    }
    else /* there's a 'fieldData' entry with the same value; */ return state
  }

  case actionTypes.BLUR_FIELD : {
    const { fieldName } = action
    const fieldEntry = state.fieldData[fieldName] || fieldEntryTemplate
    const newHistory = processHistoryUpdate(state)
    if (!fieldEntry.touched || newHistory !== state.dataHistory) {
      // Since the value is not changing here, we can use the current state.
      const updatedData = exportDataFromState(state)
      return {
        ...state,
        dataHistory : newHistory,
        historyIndex : (newHistory && newHistory.length - 1) || 0,
        fieldData   : {
          ...state.fieldData,
          [fieldName] : { ...fieldEntry, touched : true, blurredAfterChange: true }
        }
      }
    }
    else /* field already touched, no change in history */ return state
  }

  case actionTypes.UPDATE_FIELD_VALIDATORS : {
    const { fieldName, validators=[] } = action
    const fieldEntry = state.fieldData[fieldName] || fieldEntryTemplate
    if (!isEqual(fieldEntry.validators, validators)) {
      return {
        ...state,
        fieldData : {
          ...state.fieldData,
          [fieldName] : {
            ...fieldEntry,
            errorMsg : validateFieldValue(fieldEntry.value, validators),
            validators
          }
        }
      }
    }
    else /* no change */ return state
  }

  case actionTypes.RESET_HISTORY : {
    if (settings.historyLength > 0) {
      if (state.dataHistory) {
        if (state.dataHistory.length === 1) return state
        else return { ...state, dataHistory : [ state.dataHistory.pop() ] }
      }
      else return { ...state, dataHistory : [] }
    }
    else {
      if (state.dataHistory === undefined) return state
      else return { ...state, dataHistory : undefined }
    }
  }

  case actionTypes.TOTAL_RESET : return INITIAL_STATE
  default : throw new Error(`Unrecognized action type: '${action.type}'.`)
  } // switch (action.type)
} // reducer

export { exportDataFromState, INITIAL_STATE, objToInputVal, reducer, settings }
