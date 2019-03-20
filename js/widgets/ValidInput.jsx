import React, { useMemo } from 'react'

import Grid from '@material-ui/core/Grid'
import { Help } from '@liquid-labs/mui-extensions'
import InputAdornment from '@material-ui/core/InputAdornment'
import MenuItem from '@material-ui/core/MenuItem'
import TextField from '@material-ui/core/TextField'

import { useValidationContextAPI } from '../utils/ValidationContext'
import { withStyles } from '@material-ui/core/styles'

import camelCase from 'lodash.camelcase'
import classNames from 'classnames'
import { isRequired } from '@liquid-labs/validators'
import { routes } from '@liquid-labs/catalyst-core-api'

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

const ValidInput = withStyles(styles)(({
  label, propName, initialValue, noExport,
  select,
  required, validators,
  format, gridded,
  onChange,
  helperText,
  viewOnly, defaultViewValue,
  noJump, help, className, classes,
  ...muiProps}) => {
  // TODO: allow 'noJump' to be set on context (and from there in settings)
  const vcAPI = useValidationContextAPI()
  if (!vcAPI) {
    throw new Error(`No validation context API found. Perhaps you are trying to use 'ValidInput' outside a 'ValidationContext.'`)
  }

  const effectivePropName = propName || camelCase(label)
  const touched = vcAPI.isFieldTouched(effectivePropName)

  if (muiProps.value) {
    // eslint-disable-next-line no-console
    console.warn(`A value has been set on field '${effectivePropName}'. You should set 'initialValue' only for 'ValidInput' fields.`)
    if (initialValue === undefined) {
      // eslint-disable-next-line no-console
      console.log(`Converting 'value' to 'initialValue'.`)
      initialValue = muiProps.value
    }
    delete muiProps.value
  }

  const hasValue = vcAPI.hasFieldValue(effectivePropName)
  let value;
  if (!hasValue && initialValue !== undefined) {
    vcAPI.updateFieldValue(effectivePropName, initialValue)
    value = initialValue
  }
  else if (hasValue) {
    value = vcAPI.getFieldInputValue(effectivePropName)
  }
  else { // no value in context and no initialValue provided
    // eslint-disable-next-line no-console
    console.error(`No value in context nor 'initialValue' for 'ValidInput' '${effectivePropName}'.`)
  }

  if (noExport) vcAPI.excludeFieldFromExport(effectivePropName)

  useMemo(() => {
    validators =
      validators === undefined
        ? []
        : Array.isArray(validators) ? validators : [ validators ]

    if (required && !validators.includes(isRequired)) {
      validators.unshift(isRequired)
    }
    if (validators.length > 0) {
      vcAPI.updateFieldValidators(effectivePropName, validators)
    }
  }, [validators])

  const onBlur = (event) => {
    vcAPI.blurField(effectivePropName)
  }

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

  const conditionalProps = {}
  const InputProps = { ...muiProps.InputProps, onBlur : onBlur }
  const view = viewOnly || routes.getRenderMode() === 'view'

  if (view) {
    conditionalProps.disabled = true
    // TODO: pull this from the theme
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

    // setup change handlers for non-view only
    if (onChange) {
      conditionalProps.onChange = (event) => {
        const potentialVal = onChange(event)
        const newVal = potentialVal !== undefined
          ? potentialVal : event.target.value
        vcAPI.updateFieldValue(effectivePropName, newVal)
      }
    }
    else {
      conditionalProps.onChange = (event) =>
        vcAPI.updateFieldValue(effectivePropName, event.target.value)
    }
  }

  if (help) {
    InputProps.endAdornment =
      <InputAdornment position='end'>
        <Help help={help} />
      </InputAdornment>
  }

  const errorMsg = vcAPI.getFieldErrorMessage(effectivePropName)

  // memo-ize this?
  const ValidatedTextField =
    <TextField
        label={label}
        className={classNames(classes.iconAdornmentFix, className)}
        {...muiProps}
        {...conditionalProps}
        InputProps={InputProps}
        error={Boolean(errorMsg)}
        FormHelperTextProps={{ ...muiProps.FormHelperTextProps, component : 'div' }}
        helperText={errorMsg || helperText || noJump ? <div style={{ height : '1em' }}>{errorMsg || helperText}</div> : null}
        fullWidth={'fullWidth' in muiProps ? muiProps.fullWidth : Boolean(gridded)}
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
})

export { ValidInput }
