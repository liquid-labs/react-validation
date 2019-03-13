/* global afterEach describe expect test */
import React, { useEffect } from 'react'

import { ValidationContext, useValidationContextAPI } from './ValidationContext'

import { act, cleanup, fireEvent, render } from 'react-testing-library'
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
        <TestChild validators={validators} />
      </ValidationContext>
    ),
    updateCallback,
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

  test('should not invorke callback on no-change edits', () => {
    throw('implement me')
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

  test('will reload new data as original after total reset', () => {
    // TODO: could this test be cleaner?
    const dataEnvelope = {}
    const { getByLabelText, rerender, updateCallback } = stdSetup(dataEnvelope)
    dataEnvelope.data = { foo: 'foo3'}
    rerender(
      <ValidationContext data={dataEnvelope.data} updateCallback={updateCallback}>
        <TestChild />
      </ValidationContext>
    )
    const input = getByLabelText('foo')
    expect(input.value).toBe('foo3')
  })

  test("external data updates reset history and trigger warning when 'noHistory' is 'false' (default)", () => {
    throw('implement me')
  })

  test("external data updates produce no warning when history disabled ('noHistory={true}')", () => {
    throw('implement me')
  })

  test("external data updates paired 'resetHistory={true}' produce no warning and resets the history", () => {
    throw('implement me')
  })

  // test 'resetToOriginalData', 'undoCount', 'redoCount', 'undo(n)', 'redo(n)', 'historyPosition', reset of forward history after update, and no reset after non-change change (edit, and then edit back without blur)
})
