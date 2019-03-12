/* global describe expect test */
import React from 'react'

import { ValidationContext, useValidationContextAPI } from './ValidationContext'

import { cleanup, fireEvent, render } from 'react-testing-library'

const TestChild = ({fooValue}) => {
  const vcAPI = useValidationContextAPI()
  return (
    <div>
      <input aria-label="foo" name="foo" onChange={(event) => vcAPI.updateDataField('foo', event.target.value)} value={fooValue} />
      <span data-testid="isChanged">{vcAPI.isChanged() + ''}</span>
    </div>
  )
}

describe('ValidationContext', () => {
  afterEach(cleanup)

  test('should recognize changed data', () => {
    const origData = { foo: 'foo', bar: 'bar' }
    let currData = Object.assign({}, origData)
    const updateData = (newData) => currData = newData

    const { getByLabelText, getByTestId, rerender } = render(
      <ValidationContext origData={origData} currData={currData} updateData={updateData}>
        <TestChild fooValue={currData.foo}/>
      </ValidationContext>
    )

    expect(getByTestId("isChanged").textContent).toBe('false')

    const input = getByLabelText('foo')
    fireEvent.change(input, { target: { value: 'foo2' }})

    rerender(
      <ValidationContext origData={origData} currData={currData} updateData={updateData}>
        <TestChild fooValue={currData.foo}/>
      </ValidationContext>
    )

    expect(getByTestId("isChanged").textContent).toBe('true')
  })
})
