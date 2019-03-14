const actionTypes = {
  UPDATE_DATA             : 0,
  UPDATE_FIELD_VALUE      : 1,
  BLUR_FIELD              : 2,
  UPDATE_FIELD_VALIDATORS : 3,
  OFFSET_DATA             : 4,
  RESET_DATA              : 5,
  RESET_HISTORY           : 6,
  TOTAL_RESET             : 7,
}

const actions = {
  updateData  : (data) => ({ type : actionTypes.UPDATE_DATA, data }),
  updateField : (fieldName, value) =>

    ({ type : actionTypes.UPDATE_FIELD_VALUE, fieldName, value }),
  blurField : (fieldName) => ({ type : actionTypes.BLUR_FIELD, fieldName }),

  updateFieldValidators : (fieldName, validators) =>
    ({ type : actionTypes.UPDATE_FIELD_VALIDATORS, fieldName, validators }),

  rewindData   : (count) => ({ type : actionTypes.OFFSET_DATA, offset : -count }),
  advanceData  : (count) => ({ type : actionTypes.OFFSET_DATA, offset : count }),
  resetData    : () => ({ type : actionTypes.RESET_DATA }),
  resetHistory : () => ({ type : actionTypes.RESET_HISTORY }),

  // TODO: in previous implementation, we used something like this, but now I'm
  // thinking it's superfluous
  // totalReset : () => ({ type : actionTypes.TOTAL_RESET }),
}

export { actions, actionTypes }
