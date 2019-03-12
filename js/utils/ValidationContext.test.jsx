/* global afterEach describe expect test */
import React from 'react'

import { ValidationContext, useValidationContextAPI } from './ValidationContext'

import { cleanup, fireEvent, render } from 'react-testing-library'
import isEqual from 'lodash.isequal'

const TestChild = ({validators}) => {
  const vcAPI = useValidationContextAPI()
  if (validators) {
    vcAPI.updateFieldValidators('foo', validators)
  }
  return (
    <div>
      <input aria-label="foo" name="foo"
        onChange={(event) => vcAPI.updateFieldValue('foo', event.target.value)}
        onBlur={(event) => vcAPI.blurField('foo')}
        value={vcAPI.getFieldInputValue('foo')} />
      <span data-testid="isChanged">{vcAPI.isChanged() + ''}</span>
      <span data-testid="isValid">{vcAPI.isValid() + ''}</span>
      <span data-testid="errorMsg">{vcAPI.getFieldErrorMessage('foo') + ''}</span>
    </div>
  )
}

const testValidators = [
  (value) => value === '' ? "Required." : null,
  (value) => value === 'bar' ? "No bar!" : null,
]

const stdSetup = (dataEnvelope, validators=undefined) => {
  const origData = dataEnvelope.data || { foo : 'foo', bar : 'bar' }
  dataEnvelope.data = Object.assign({}, origData)
  const updateCallback = (newData) => dataEnvelope.data = newData

  return {
    ...render(
      <ValidationContext data={dataEnvelope.data} updateCallback={updateCallback}>
        <TestChild validators={validators}/>
      </ValidationContext>
    ),
    origData,
  }
}

describe('ValidationContext', () => {
  afterEach(cleanup)

  test('should initially be unchanged', () => {
    const { getByTestId } = stdSetup({})
    expect(getByTestId("isChanged").textContent).toBe('false')
  })

  test('should recognize changed data', () => {
    const { getByLabelText, getByTestId } = stdSetup({})
    const input = getByLabelText('foo')
    fireEvent.change(input, { target : { value : 'foo2' } })
    expect(getByTestId("isChanged").textContent).toBe('true')
    expect(input.value).toBe('foo2') // sanity check
  })

  test('should not invoke callback until field blurred', () => {
    const dataEnvelope = {}
    const { origData } = stdSetup(dataEnvelope)
    expect(isEqual(origData, dataEnvelope.data)).toBe(true)
  })

  test('should invoke update callback on blur', () => {
    const dataEnvelope = {}
    const { origData, getByLabelText } = stdSetup(dataEnvelope)
    const input = getByLabelText('foo')
    fireEvent.change(input, { target : { value : 'foo2' } })
    fireEvent.blur(input)
    expect(isEqual(origData, dataEnvelope.data)).toBe(false)
    expect(dataEnvelope.data.foo).toBe('foo2')
  })

  test('should not produce errors on invalid, untouched fields', () => {
    const { getByTestId } = stdSetup({ data: { foo: null } }, testValidators)
    expect(getByTestId("errorMsg").textContent).toBe('null')
    expect(getByTestId("isValid").textContent).toBe('false')
  })

  test('should produce errors on invalid field after blur', () => {
    const { getByLabelText, getByTestId } =
      stdSetup({ data : { foo: null } }, testValidators)
    const input = getByLabelText('foo')
    fireEvent.blur(input)
    expect(getByTestId("errorMsg").textContent).toBe('Required.')
    expect(getByTestId("isValid").textContent).toBe('false')
  })
})
