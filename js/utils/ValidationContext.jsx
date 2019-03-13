import React, { createContext, useContext, useMemo, useReducer } from 'react'
import PropTypes from 'prop-types'

import isEqual from 'lodash.isequal'

import {
  exportDataFromState,
  INITIAL_STATE,
  objToInputVal,
  reducer,
  settings } from './ValidationContext/reducer'
import { actions } from './ValidationContext/actions'

const DEFAULT_HISTORY_LENGTH = 10

const VContext = createContext()

const useValidationContextAPI = () => useContext(VContext)

const ValidationContext = ({
  data,
  updateCallback,
  historyLength=DEFAULT_HISTORY_LENGTH,
  resetHistory=false,
  children }) => {

  const [ state, dispatch ] = useReducer(reducer, INITIAL_STATE)

  settings.historyLength = historyLength
  settings.updateCallback = updateCallback

  useMemo(() => {
    if (resetHistory) {
      dispatch(actions.resetHistory())
    }
  }, [state, resetHistory])

  // do we have an external data update?
  useMemo(() => {
    if ((state.origData === undefined && data)
        || (state.lastUpdate !== data
            && !isEqual(state.lastUpdate, data))) {
      if (state.origData !== undefined && historyLength > 0 && !resetHistory) {
        console.warn(`Programatic update of data detected. Form history will be reset.`)
      }
      dispatch(actions.updateData(data))
    }
  }, [state.origData, state.lastUpdate, data])

  const api = useMemo(() => ({
    getOrigData : () => state.origData,

    getData            : () => exportDataFromState(state),
    getFieldInputValue : (fieldName) => {
      const fieldEntry = state.fieldData[fieldName]
      // as a UI component tied to 'input' elements, expect empty val as empty
      // string, not null, etc.
      return (fieldEntry && objToInputVal(fieldEntry.value)) || ''
    },
    updateFieldValue : (fieldName, value) => {
      if (!state.fieldData[fieldName] || state.fieldData[fieldName].value !== value)
        dispatch(actions.updateField(fieldName, value))
    },

    isChanged : () => !isEqual(state.origData, exportDataFromState(state)),
    isValid   : () =>
      !Object.values(state.fieldData).some((fieldEntry) => fieldEntry.errorMsg),

    isFieldTouched : (fieldName) =>
      state.fieldData[fieldName]
        ? state.fieldData[fieldName].touched
        : undefined,
    // We avoid 'onBlur' as that implies 'event' as the argument.
    blurField : (fieldName) => {
      if (!state.fieldData[fieldName]
          || !state.fieldData[fieldName].touched
          || !state.fieldData[fieldName].blurredAfterChange)
        dispatch(actions.blurField(fieldName))
    },

    updateFieldValidators : (fieldName, validators) => {
      if (!state.fieldData[fieldName] || !isEqual(state.fieldData[fieldName].validators, validators))
        dispatch(actions.updateFieldValidators(fieldName, validators))
    },

    // Error messages are only returned when the field is touched.
    getFieldErrorMessage : (fieldName) => {
      const fieldEntry = state.fieldData[fieldName]
      return (fieldEntry && fieldEntry.touched && fieldEntry.errorMsg) || null
    },

    getUndoCount : () => historyLength > 0 ? state.historyIndex : null,
    getRedoCount : () => historyLength > 0
      ? state.dataHistory.length - state.historyIndex - 1
      : null,
    rewindData : (count=1) => dispatch(actions.rewindData(count)),
    advanceData : (count=1) => dispatch(actions.advanceData(count)),
    resetData : () => dispatch(actions.resetData()),

    totalReset : () => dispatch(actions.totalReset())
  }), [ state, dispatch, historyLength ])

  return (
    <VContext.Provider value={api}>
      { children }
    </VContext.Provider>
  )
}

if (process.env.NODE_ENV !== 'production') {
  ValidationContext.propTypes = {
    children : PropTypes.oneOfType(
      [PropTypes.node, PropTypes.func]).isRequired,
    data           : PropTypes.object.isRequired,
    historyLength  : PropTypes.number,
    resetHistory   : PropTypes.bool,
    updateCallback : PropTypes.func.isRequired,
  }
}

export { ValidationContext, useValidationContextAPI }
