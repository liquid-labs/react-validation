/* global afterEach describe expect test */
import React from 'react'

import { ValidationContext, useValidationContextAPI } from './ValidationContext'

import { cleanup, fireEvent, render } from 'react-testing-library'
import isEqual from 'lodash.isequal'

const TestChild = () => {
  const vcAPI = useValidationContextAPI()
  return (
    <div>
      <input aria-label="foo" name="foo"
        onChange={(event) => vcAPI.updateFieldValue('foo', event.target.value)}
        onBlur={(event) => { console.log('blurring'); vcAPI.blurField('foo')}}
        value={vcAPI.getFieldInputValue('foo')} />
      <span data-testid="isChanged">{vcAPI.isChanged() + ''}</span>
    </div>
  )
}

describe('ValidationContext', () => {
  const origData = { foo : 'foo', bar : 'bar' }
  let currData = Object.assign({}, origData)
  const updateCallback = (newData) => {
    currData = newData
  }

  const { getByLabelText, getByTestId, rerender } = render(
    <ValidationContext data={currData} updateCallback={updateCallback}>
      <TestChild/>
    </ValidationContext>
  )

  test('should initially be unchanged', () => {
    expect(getByTestId("isChanged").textContent).toBe('false')
  })

  test('should recognize changed data', () => {
    const input = getByLabelText('foo')
    fireEvent.change(input, { target : { value : 'foo2' } })
    expect(getByTestId("isChanged").textContent).toBe('true')
  })

  test('should not invoke callback until field blurred', () => {
    expect(isEqual(origData, currData)).toBe(true)
  })

  test('should invoke update callback on blur', () => {
    const input = getByLabelText('foo')
    fireEvent.blur(input)
    expect(isEqual(origData, currData)).toBe(false)
    expect(currData.foo).toBe('foo2')
  })
})
