/* global afterEach describe expect test */
import React from 'react'

import { ValidationContext, useValidationContextAPI } from './ValidationContext'

import { cleanup, fireEvent, render } from 'react-testing-library'
import isEqual from 'lodash.isequal'

const TestChild = ({fooValue}) => {
  const vcAPI = useValidationContextAPI()
  return (
    <div>
      <input aria-label="foo" name="foo"
        onChange={(event) => vcAPI.updateFieldValue('foo', event.target.value)}
        onBlur={(event) => vcAPI.blurField('foo')}
        value={fooValue} />
      <span data-testid="isChanged">{vcAPI.isChanged() + ''}</span>
    </div>
  )
}

describe('ValidationContext', () => {
  const origData = { foo : 'foo', bar : 'bar' }
  let currData = Object.assign({}, origData)
  const updateCallback = (newData) => currData = newData

  const { getByLabelText, getByTestId, rerender } = render(
    <ValidationContext data={currData} updateCallback={updateCallback}>
      <TestChild fooValue={currData.foo} />
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
})
