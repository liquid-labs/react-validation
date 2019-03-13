const actionTypes = {
  UPDATE_DATA             : 0,
  UPDATE_FIELD_VALUE      : 1,
  BLUR_FIELD              : 2,
  UPDATE_FIELD_VALIDATORS : 3,
  RESET_DATA              : 4,
  RESET_HISTORY           : 5,
  TOTAL_RESET             : 6,
}

const actions = {
  updateData  : (data) => ({ type : actionTypes.UPDATE_DATA, data }),
  updateField : (fieldName, value) =>

    ({ type : actionTypes.UPDATE_FIELD_VALUE, fieldName, value }),
  blurField : (fieldName) => ({ type : actionTypes.BLUR_FIELD, fieldName }),

  updateFieldValidators : (fieldName, validators) =>
    ({ type : actionTypes.UPDATE_FIELD_VALIDATORS, fieldName, validators }),

  resetData : () => ({ type: actionTypes.RESET_DATA }),
  resetHistory : () => ({ type: actionTypes.RESET_HISTORY }),

  totalReset : () => ({ type : actionTypes.TOTAL_RESET }),
}

export { actions, actionTypes }
