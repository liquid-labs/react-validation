const actionTypes = {
  UPDATE_DATA               : 0,
  UPDATE_FIELD_VALUE        : 1,
  BLUR_FIELD                : 2,
  UPDATE_FIELD_VALIDATORS   : 3,
  EXCLUDE_FIELD_FROM_EXPORT : 4,
  ADD_CONTEXT_VALIDATOR     : 5,
  REMOVE_CONTEXT_VALIDATOR  : 6,
  OFFSET_DATA               : 7,
  RESET_DATA                : 8,
  RESET_HISTORY             : 9,
  INITIAL_SNAPSHOT          : 10,
}

const actions = {
  updateData : (data, updateCallback) =>
    ({ type : actionTypes.UPDATE_DATA, data, updateCallback }),
  updateField : (fieldName, value) =>
    ({ type : actionTypes.UPDATE_FIELD_VALUE, fieldName, value }),
  blurField : (fieldName, updateCallback) =>
    ({ type : actionTypes.BLUR_FIELD, fieldName, updateCallback }),
  updateFieldValidators : (fieldName, validators) =>
    ({ type : actionTypes.UPDATE_FIELD_VALIDATORS, fieldName, validators }),
  excludeFieldFromExport : (fieldName) =>
    ({ type : actionTypes.EXCLUDE_FIELD_FROM_EXPORT, fieldName }),

  addContextValidator : (fieldName, validator, triggerFields) =>
    ({ type : actionTypes.ADD_CONTEXT_VALIDATOR,
      fieldName, validator, triggerFields }),
  removeContextValidator : (validator) =>
    ({ type : actionTypes.REMOVE_CONTEXT_VALIDATOR, validator }),

  rewindData : (offset, updateCallback) =>
    ({ type : actionTypes.OFFSET_DATA, offset : -offset, updateCallback }),
  advanceData : (offset, updateCallback) =>
    ({ type : actionTypes.OFFSET_DATA, offset, updateCallback }),
  resetData : (updateCallback) =>
    ({ type : actionTypes.RESET_DATA, updateCallback }),
  resetHistory : () => ({ type : actionTypes.RESET_HISTORY }),

  initialSnapshot : () => ({ type : actionTypes.INITIAL_SNAPSHOT }),

  // TODO: in previous implementation, we used something like this, but now I'm
  // thinking it's superfluous
  // totalReset : () => ({ type : actionTypes.TOTAL_RESET }),
}

export { actions, actionTypes }
