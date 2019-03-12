import React, { createContext, useContext, useMemo, useReducer } from 'react'
import PropTypes from 'prop-types'

import isEqual from 'lodash.isequal'

import {
  exportDataFromState,
  INITIAL_STATE,
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
  children }) => {
  const [ state, dispatch ] = useReducer(reducer, INITIAL_STATE)
  settings.historyLength = historyLength
  settings.updateCallback = updateCallback

  if (state.origData === undefined && data) dispatch(actions.updateData(data))

  const api = useMemo(() => ({
    getOrigData : () => state.origData,

    getData         : () => exportDataFromState(state),
    updateFieldValue : (fieldName, value) =>
      dispatch(actions.updateField(fieldName, value)),

    isChanged : () => !isEqual(state.origData, exportDataFromState(state)),

    isFieldTouched : (fieldName) =>
      state.fieldData[fieldName]
        ? state.fieldData[fieldName].touched
        : undefined,
    // We avoid 'onBlur' as that implies 'event' as the argument.
    blurField : (fieldName) => dispatch(actions.blurField(fieldName)),

    updateFieldValidators : (fieldName, validators) =>
      dispatch(actions.updateFieldValidators(fieldName, validators)),

    // Error messages are only returned when the field is touched.
    getFieldErrorMessage : (fieldName) => {
      const fieldEntry = state.fieldData[fieldName]
      return (fieldEntry && fieldEntry.touched && fieldEntry.errorMsg) || null
    },

    reset : () => dispatch(actions.reset())
  }), [ state, dispatch ])

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
    updateCallback : PropTypes.func.isRequired,
  }
}

export { ValidationContext, useValidationContextAPI }
