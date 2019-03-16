import { actionTypes } from './actions'

import isEqual from 'lodash.isequal'

const settings = {
  historyLength : 10,
}

// TODO: abstracte 'deepFreeze' (from model) and use it here.
const INITIAL_STATE = Object.freeze({
  origData     : undefined,
  dataHistory  : Object.freeze([]),
  historyIndex : 0,
  fieldData    : Object.freeze({ /*
    fieldName : {
      value: <some primitive value>,
      validators: [ array of validator functions ]
      errorMsg : <current error message string> | null,
      touched: false | true,
      blurredAfterChange: false | true,
    } */
  }),
  contextValidators : Object.freeze({}),
  lastUpdate        : null
})

/**
 * 'fieldEntryTemplate' is a convenience template for 'fieldData' entries.
 */
const fieldEntryTemplate = Object.freeze({
  value              : undefined,
  validators         : [],
  errorMsg           : null,
  touched            : false,
  blurredAfterChange : true,
  excludeFieldFromExport : false,
})

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
 * 'validateContextValues' processes context validators and update the
 * 'fieldData' object. Thus, if 'fieldData' needs to be a new object, the caller
 * must pass it in as such. Expects that 'field validators' checks are
 * up-to-date and will not overwrite existing data (== prefer field validaiton
 * errors).
 */
const validateContextValues = (fieldData, data, ...validatorInfosArr) => {
  validatorInfosArr.forEach((validatorInfos) => {
    if (validatorInfos && validatorInfos.length > 0) {
      validatorInfos.forEach(([bindFieldName, validator]) => {
        const fieldEntry = fieldData[bindFieldName] || { ...fieldEntryTemplate }
        fieldData[bindFieldName] = fieldEntry
        if (!fieldEntry.errorMsg) fieldEntry.errorMsg = validator(data)
      })
    }
  })
}

/**
 * 'exportDataFromState' reduces the 'state'
 */
const exportDataFromState = (state) => exportDataFromFieldData(state.fieldData)

const exportDataFromFieldData = (fieldData) => Object.entries(fieldData)
  .reduce((data, [fieldName, fieldEntry]) => {
    if (!fieldEntry.excludeFromExport) {
      data[fieldName] = fieldEntry.value
    }
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
  if (settings.historyLength > 0) {
    if (dataHistory.length === 0) return [ exportDataFromState(state) ]
    // else
    const currData = exportDataFromState(state)
    if (isEqual(dataHistory[dataHistory.length - 1], currData)) {
      // collapse equivalent tail history
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
      if (settings.historyLength <= 0) {
        throw new Error(`Cannot offset data with no history.`)
      }

      newHistoryIndex = state.historyIndex + action.offset
      if (newHistoryIndex < 0) newHistoryIndex = 0
      if (newHistoryIndex > (state.dataHistory.length - 1)) {newHistoryIndex = (state.dataHistory.length - 1)}

      data = state.dataHistory[newHistoryIndex]
    }
    const newState = {
      ...state,
      origData     : action.type === actionTypes.UPDATE_DATA ? data : state.origData,
      historyIndex : newHistoryIndex,
      fieldData    : Object.entries(data).reduce((newFieldData, [fieldName, value]) => {
        const fieldEntry = state.fieldData[fieldName]
        const errorMsg =
          validateFieldValue(value, fieldEntry && fieldEntry.validators)
        newFieldData[fieldName] = {
          ...(fieldEntry || fieldEntryTemplate),
          value,
          errorMsg,
        }
        return newFieldData
      }, {}),
      lastUpdate : action.type === actionTypes.UPDATE_DATA ? data : state.lastUpdate
    }
    const newData = exportDataFromState(newState)
    Object.keys(newData).forEach((fieldName) => {
      validateContextValues(newState.fieldData,
        newData,
        newState.contextValidators[fieldName],
        newState.contextValidators['*'])
    })

    const dataHistory =
      settings.historyLength <= 0
        ? state.dataHistory // no change, still nothing
        : action.type === actionTypes.OFFSET_DATA
          ? state.dataHistory // no change, something
          : action.type === actionTypes.RESET_DATA
            ? processHistoryUpdate(newState) // add history normally
            : [ data ] // then it's 'UPDATE_DATA'
    newState.dataHistory = dataHistory
    if (action.type === actionTypes.RESET_DATA
        && newState.dataHistory
        && settings.historyLength >= 0) {
      newState.historyIndex = newState.dataHistory.length - 1
    }
    return newState
  }

  case actionTypes.UPDATE_FIELD_VALUE : {
    const { fieldName, value } = action

    if (value === undefined) throw new Error(`Value (for '${fieldName}') cannot be 'undefined'.`)

    if (state.fieldData[fieldName] === undefined
        || state.fieldData[fieldName].value !== value) {
      const newFieldData = { ...state.fieldData }
      const fieldEntry = { ...(state.fieldData[fieldName] || fieldEntryTemplate) }
      newFieldData[fieldName] = fieldEntry

      fieldEntry.errorMsg = validateFieldValue(value, fieldEntry.validators)
      fieldEntry.value = value
      fieldEntry.blurredAfterChange = false

      validateContextValues(newFieldData,
        exportDataFromFieldData(newFieldData),
        state.contextValidators[fieldName],
        state.contextValidators['*'])

      return {
        ...state,
        fieldData : newFieldData,
      }
    }
    else /* there's a 'fieldData' entry with the same value; */ return state
  }

  case actionTypes.BLUR_FIELD : {
    const { fieldName } = action
    // This should not be possible outside of programatic flim-flammery.
    const fieldEntry = state.fieldData[fieldName] || { ...fieldEntryTemplate }
    if (!fieldEntry.touched || !fieldEntry.blurredAfterChange) {
      const newHistory = processHistoryUpdate(state)
      return {
        ...state,
        dataHistory  : newHistory,
        historyIndex : (newHistory.length > 0 && newHistory.length - 1) || 0,
        fieldData    : {
          ...state.fieldData,
          [fieldName] : { ...fieldEntry, touched : true, blurredAfterChange : true }
        }
      }
    }
    else /* field already touched, no change in history */ return state
  }

  case actionTypes.EXCLUDE_FIELD_FROM_EXPORT : {
    // TODO: find a reliable way to warn users if this value is changed after
    // "initialization".
    const { fieldName } = action
    // TODO: Note, we are not checking whether the field entry exists first. We
    // should formalize a rule that the value must be set before validators
    // (field or context) or exclusion.
    if (state.fieldData[fieldName].excludeFromExport) return state
    else {
      return {
        ...state,
        fieldData : Object.entries(state.fieldData).reduce((newFD, [entryName, fieldEntry]) => {
          if (fieldName === entryName) {
            newFD[entryName] = { ...fieldEntry, excludeFromExport: true }
          }
          else newFD[entryName] = fieldEntry
          return newFD
        }, {})
      }
    }
  }

  case actionTypes.UPDATE_FIELD_VALIDATORS : {
    const { fieldName, validators=[] } = action
    const fieldEntry = state.fieldData[fieldName] || { ...fieldEntryTemplate }
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

  case actionTypes.ADD_CONTEXT_VALIDATOR : {
    const { fieldName, validator, triggerFields } = action
    const validatorInfo = [fieldName, validator]
    const newCV = { ...state.contextValidators }
    if (triggerFields && triggerFields.length > 0) {
      triggerFields.forEach((fieldName) => {
        newCV[fieldName] = (newCV[fieldName] || []).concat([validatorInfo])
      })
    }
    else {
      newCV['*'] = (newCV['*'] || []).concat([validatorInfo])
    }
    const newFieldData = { ...state.fieldData }
    validateContextValues(newFieldData, exportDataFromState(state), [validatorInfo])

    return {
      ...state,
      contextValidators : newCV,
      fieldData         : newFieldData
    }
  }

  case actionTypes.REMOVE_CONTEXT_VALIDATOR : {
    const { validator } = action
    const newCV =
      Object.entries(state.contextValidators)
        .reduce((cv, [fieldName, validatorInfo]) => {
          const newVI = validatorInfo.filter(([fN, v]) => v !== validator)
          if (newVI.length > 0) cv[fieldName] = newVI
          return cv
        }, {})
    return {
      ...state,
      contextValidators : newCV
    }
  }

  case actionTypes.RESET_HISTORY : {
    if (settings.historyLength > 0) {
      if (state.dataHistory.length === 1) return state
      else return { ...state, dataHistory : [ state.dataHistory.pop() ] }
    }
    else return state
  }

  case actionTypes.INITIAL_SNAPSHOT : {
    if (state.origData === undefined) {
      const origData = exportDataFromFieldData(state.fieldData)
      return {
        ...state,
        origData,
        lastUpdate : origData
      }
    }
    else {
      // eslint-disable-next-line no-console
      console.warn(`Unexpected 'initial snapshot' invoked with original data in palce.`)
      return state
    }
  }

  // see note on 'totalReset' in acitons.js
  // case actionTypes.TOTAL_RESET : return INITIAL_STATE
  default : throw new Error(`Unrecognized action type: '${action.type}'.`)
  } // switch (action.type)
} // reducer

export { exportDataFromState, INITIAL_STATE, objToInputVal, reducer, settings }
