import React, { Component } from 'react'
import classNames from 'classnames'

import Grid from '@material-ui/core/Grid'
import InputAdornment from '@material-ui/core/InputAdornment'
import MenuItem from '@material-ui/core/MenuItem'
import TextField from '@material-ui/core/TextField'
import { withStyles } from '@material-ui/core/styles'

import camelCase from 'lodash.camelcase'

import { isRequired } from '@liquid-labs/validators'

import { Help } from '@liquid-labs/mui-extensions'

const styles = (theme) => ({
  iconAdornmentFix : {
    '& svg' : {
      /* the default icon setting sets the font size to 24px, which makes it
         taller than the input box. This actually shrinks it a bit, and, by
         using percents, we can scale with 'renderCompact' */
      fontSize : '125%'
    }
  }
})

class ValidInputBase extends Component {
  constructor(props) {
    super(props)

    this.state = {
      errorMsg : null,
      touched  : false
    }

    // TODO: I think this binding may be redundant with our construction.
    // https://medium.com/@jacobworrel/babels-transform-class-properties-plugin-how-it-works-and-what-it-means-for-your-react-apps-6983539ffc22
    this.onBlur = this.onBlur.bind(this)
    this.doValidate = this.doValidate.bind(this)

    // Set initial valid state
    props.fieldWatcher && this.doValidate(props.value, true)
  }

  onBlur = (event) => {
    this.setState({ touched : true })
    // State updates asynchrounously, so we trigger a forced validation check.
    this.doValidate(this.props.value, true)
  }

  doValidate = (value, forced) => {
    const { touched } = this.state
    const { fieldWatcher, required } = this.props
    let { validate } = this.props

    if (validate === undefined) {
      validate = []
    }
    else if (!Array.isArray(validate)) {
      validate = [ validate ]
    }

    if (required && !validate.includes(isRequired)) {
      validate.unshift(isRequired)
    }

    if (fieldWatcher) {
      fieldWatcher.registerValue(this.props.label, value)
    }
    // We always run checks so the 'fieldWatcher' can be updated, though
    // 'errorMsg' is only set if the field has been 'touched' or the validaiton
    // 'forced'. Allows the user to start typing an invalid string for the first
    // time (like an email that takes a few characters to get valid) while also
    // without marking an error, but also keeps the field 'invalid' as far as
    // the 'fieldWatcher' is concerned.
    // TODO: could we not move this logic to the constructor and do once?
    if (validate.length > 0) {
      // First validator to fail is the one we use.
      let error = null
      validate.some((validator) => {
        error = validator(value)
        return error
      })
      if (fieldWatcher) {
        fieldWatcher.registerError(this.props.label, error)
      }
      return touched || forced
        ? error
        : null
    }
    else {
      return null
    }
  }

  render() {
    const { label, propName, value, validate, format, gridded, select, fieldWatcher,
      onValueChangeFactory, onInputChange, onChange, helperText, viewOnly, defaultViewValue,
      noJump, help, className, classes,
      ...muiProps } = this.props
    const { touched } = this.state
    const effectivePropName = this.props.propName || camelCase(label)

    // TODO: verify that only one of onInputChange or onChange is supplied.

    const selectOptions = {}
    if (select) {
      selectOptions.select = true
      selectOptions.children = select.map(option => (
        <MenuItem key={option.value} value={option.value}>
          {option.label || option.value}
        </MenuItem>
      ))
    }

    const dispValue = !viewOnly && format && !touched ? format(value) : value

    /* If there's a fieldWatcher, we'd like to avoid re-validating and do this:
    const error = !touched
      ? null
      : fieldWatcher
        ? fieldWatcher.getErrorFor(label)
        : this.doValidate(value);

    Because with user changes, the validation will already have been established
    on 'onChange' or 'onBlur'.

    But, this failes to catch injected changes, such as when the state is
    programatically chaned and the ValidatedTextField re-rendered.
    */
    const error = this.props.error || this.doValidate(value)

    const conditionalProps = {}
    const InputProps = { ...muiProps.InputProps, onBlur : this.onBlur }
    // First, we handle the onChange and implicit validaiton
    if (!viewOnly && (onValueChangeFactory || onChange || onInputChange)) { // is there any change handler?
      // the latest and greatest
      if (onValueChangeFactory) {
        const handler = onValueChangeFactory(effectivePropName)
        conditionalProps.onChange = (event) => {
          const value = event.target.value
          this.doValidate(value)
          handler(value, event)
        }
      }
      else { // TODO: keep setting 'onChange' directly, but deprecate 'onInputChange'
        const handler = onChange
          || onInputChange(effectivePropName)
        conditionalProps.onChange = (event) => {
          this.doValidate(event.target.value)
          handler(event)
        }
      }
    }
    // Now, we handle viewOnly logic
    if (viewOnly) {
      conditionalProps.disabled = true
      // TODO: I don't like hard coding this, but I'm not sure the best way to reference.
      InputProps.style = { color : 'rgba(0,0,0,0.87)' }
      if (defaultViewValue && !dispValue) {
        conditionalProps.defaultValue = defaultViewValue
      }
      else {
        conditionalProps.value = dispValue
      }
    }
    else {
      conditionalProps.value = dispValue
    }

    if (help) {
      InputProps.endAdornment =
        <InputAdornment position='end'>
          <Help help={help} />
        </InputAdornment>
    }

    const ValidatedTextField =
      <TextField
          label={label}
          className={classNames(classes.iconAdornmentFix, className)}
          {...muiProps}
          {...conditionalProps}
          InputProps={InputProps}
          error={!!error}
          FormHelperTextProps={{ ...muiProps.FormHelperTextProps, component : 'div' }}
          helperText={error || helperText || noJump ? <div style={{ height : '1em' }}>{error || helperText}</div> : null}
          fullWidth={'fullWidth' in muiProps ? muiProps.fullWidth : (!!gridded)}
          {...selectOptions}
      />

    if (gridded) {
      return (
        <Grid item {...gridded}>
          {ValidatedTextField}
        </Grid>
      )
    }
    else {
      return ValidatedTextField
    }
  }
}

export const ValidInput = withStyles(styles)(ValidInputBase)
