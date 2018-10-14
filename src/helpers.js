// Is normally called directly or as part of 'onChange' handler. This is the
// standard handler used by 'bindOnInputChange'. The 'component' and 'setFunc'
// are bound in 'bindOnInputChange'. We then expect the resulting function to
// be further bound to a propName. This results in the final event + value
// change handler.

// In the standard 'onChange'-handling case,  we expect to receive an 'event'.
// But, if an explicit 'value' is provided (as with a programatic call, then we
// use the provided value.
const onInputChange = (component, setFunc, propName, event, value) => {
  if (!value) {
    const target = event.target;
    value = target.type === 'checkbox'
      ? (target.checked ? true : false)
      : target.value;
  }

  if (setFunc) {
    setFunc(propName, value, event);
  }
  else {
    component.setState(() => ({ [propName]: value }));
  }
}

const bindOnInputChange = (component, setFunc) => {
  // I would think we could just 'bind(component)' and then do
  // 'this.setState(...)' in the oic, but it doesn't work, so we pass the
  // component as a bound argument instead.
  const boundOic = onInputChange.bind(null, component, setFunc);
  return (propName) => (event, value) => { boundOic(propName, event, value); }
}

class FieldWatcher {
  errorTracker = {}
  changeForced = false;
  changeValues = {}
  initialValues = {}

  constructor(initiallyValid) {
    return this.reset(initiallyValid);
  }

  registerError(label, error) {
    this.errorTracker[label] = error;
  }

  ignoreError(label) {
    delete this.errorTracker[label];
  }

  isValid() {
    let values = Object.values(this.errorTracker);
    // The validity check will generally be triggered before the field validity
    // is checked (in the field constructor). In that case, when nothing has
    // been registered, we use the 'initiallyValid' setting.
    if (values.length === 0) {
      return this.initiallyValid;
    }
    return !values.some(value => {
        return value;
      }
    );
  }

  /**
   * Note that we do not take 'touched' into account here, so fields that
   * should NOT display an error may have an error (e.g., 'Required').
   */
  getErrorFor(label) {
    return this.errorTracker[label];
  }

  registerValue(label, value) {
    if (!this.initialValues[label]) {
      this.initialValues[label] = value;
    }
    else if (this.initialValues[label] !== value) {
      this.changedValues[label] = value;
    }
    else {
      delete this.changedValues[label];
    }
  }

  forceChange(value) {
    if (value === undefined) value = true;
    this.changeForced = value;
  }

  changedFields() {
    return Object.keys(this.changedValues);
  }

  isChanged() {
    return this.changeForced || this.changedFields().length > 0;
  }

  isValidAndChanged() {
    return this.isValid() && this.isChanged();
  }

  // TODO: is there a valid use case for 'initiallyValid' to change on reset?
  reset(initiallyValid) {
    this.initiallyValid = initiallyValid === undefined
      ? this.initiallyValid
      : initiallyValid;
    this.initialValues = {};
    this.errorTracker = {};
    this.changedValues = {};
    this.changeForced = false;

    return this;
  }
}

const getFieldWatcher = (initiallyValid) => {
  return new FieldWatcher(initiallyValid);
}

export {
  bindOnInputChange,
  getFieldWatcher
}
