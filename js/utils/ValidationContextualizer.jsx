import React, { createContext, useContext, useState } from 'react'

import isEqual from 'lodash.isequal'

const ValidationContext = createContext()

const useValidationContextAPI = useContext(ValidationContext)

const validateFieldValue = (fieldName, value, validations, setFieldErrorMessage) => {
  if (validations && validations.length > 0) {
    // First validator to fail is the one we use.
    let errorMsg = null
    validations.some((validator) => {
      errorMsg = validator(value)
      return errorMsg
    })
    setFieldErrorMessage(fieldName, errorMsg)
  }
}

const ValidationContextualizer = ({ origData, currData, updateData, children }) => {
  const [ areTouched, setAreTouched ] = useState({})
  const [ fieldValidations, setFieldValidations ] = useState({})
  const [ errorMsgs, setErrorMsgs ] = useState({})

  const setFieldErrorMessage = (fieldName, errorMsg) => {
    if (errorMsg !== errorMsgs[fieldName]) {
      setFieldErrorMessage(Object.assign({}, errorMsgs, { [fieldName] : errorMsg }))
    }
  }

  const api = useMemo(() => ({
    getOrigData : () => origData,

    getData         : () => currData,
    updateDataField : (fieldName, value) => {
      if (currData[fieldName] !== value) {
        updateData(Object.assign({}, currData, { [fieldName] : value }))
        validateFieldValue(fieldName, value, fieldValidations[fieldName], setFieldErrorMessage)
      }
    },

    isChanged : () => !isEqual(origData, currData),

    isFieldTouched  : (fieldName) => areTouched[fieldName],
    setFieldTouched : (fieldName) => {
      if (!areTouched[fieldName]) {
        setAreTouched(Object.assign({}, areTouched, { [fieldName] : true }))
      }
    },

    setFieldValidations : (fieldName, validations) => {
      // We expect the ValidInput and other uses to memo-ize or otherwise be
      // smart about updating validations and don't do additional checks.
      setFieldValidations(Object.assign({}, validations, { [fieldName] : validations}))
      validateFieldValue(fieldName, currData[fieldName], validations, setFieldErrorMessage)
    },

    // Error messages are only returned when the field is touched.
    getFieldErrorMessage : (fieldName) =>
      areTouched(fieldName)
        ? errorMsgs[fieldName]
        : null,
    setFieldErrorMessage : (fieldName, errorMsg) =>
      setFieldErrorMessage(fieldName, errorMsg),

    reset : () => {
      setAreTouched({})
      setErrorMsgs({})
    }
  }), [ areTouched, currData, errorMsgs, updateData ])

  return (
    <ValidationContext.Provider value={api}>
      { children }
    </ValidationContext.Provider>
  )
}

export { ValidationContextualizer, useValidationContextAPI }
