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
      <span data-testid="undoCount">{vcAPI.getUndoCount() + ''}</span>
      <span data-testid="redoCount">{vcAPI.getRedoCount() + ''}</span>
    </div>
  )
}

const testValidators = [
  (value) => value === '' ? "Required." : null,
  (value) => value === 'bar' ? "No bar!" : null,
]

const stdSetup = (validators=undefined, origData={ foo : 'foo', bar : 'bar' }) => {
  const warningSpy = jest.spyOn(console, 'warn').mockImplementation()
  // Even though 'warningSpy' is new, jest appareantly reconizes the previous
  // mock and preseves it, so we have to clear it.
  warningSpy.mockClear()

  const dataEnvelope = {}
  dataEnvelope.data = Object.assign({}, origData)
  const updateCallback = jest.fn((newData) => {
    dataEnvelope.data = newData
  })
  const renderAPI = render(
    <ValidationContext data={dataEnvelope.data} updateCallback={updateCallback}>
      <TestChild validators={validators} />
    </ValidationContext>
  )

  const fooInput = renderAPI.getByLabelText('foo')

  return {
    dataEnvelope,
    fooInput,
    origData,
    updateCallback,
    warningSpy,
    ...renderAPI,
  }
}

describe('ValidationContext', () => {
  [['with no initial validators', undefined],
   ['with initial validators', testValidators]].forEach(([desc, validators]) => {
    describe(desc, () => {
      let dataEnvelope, fooInput, warningSpy,
        getByTestId, getByLabelText, rerender,
        origData, updateCallback;

      beforeAll(() => {
        ({ dataEnvelope, fooInput, warningSpy,
          getByTestId, getByLabelText,
          origData, updateCallback } = stdSetup(validators))
      })

      afterAll(cleanup)

      describe('should initially', () =>{
        test('be unchaned', () => {
          expect(getByTestId("isChanged").textContent).toBe('false')
        })

        test('not call the update callback', () => {
          expect(updateCallback).toHaveBeenCalledTimes(0)
        })
      })

      describe('on field change', () => {
        beforeAll(() =>
          fireEvent.change(fooInput, { target : { value : 'foo2' } }))

        test("should indicate 'isChanged'", () => {
          expect(getByTestId("isChanged").textContent).toBe('true')
        })

        test("reflect change to input", () => {
          expect(fooInput.value).toBe('foo2')
        })

        test("should not invoke 'updateCallback'", () => {
          expect(updateCallback).toHaveBeenCalledTimes(0)
        })

        test("should not change the 'origData'", () => {
          expect(isEqual(origData, dataEnvelope.data)).toBe(true)
        })

        describe('after blur', () => {
          beforeAll(() => {
            fireEvent.blur(fooInput)}
          )

          test('should invoke update callback', () => {
            expect(updateCallback).toHaveBeenCalledTimes(1)
          })

          test("we double check the tests setup works like expected and 'dataEnvelope.data' is updated", () => {
            expect(origData).not.toBe(dataEnvelope.data)
          })

          test("we double check the tests setup works like expected and 'dataEnvelope' is a different object", () => {
            // This is important in the react context. We want to make sure we're using new objects.
            expect(origData).not.toEqual(dataEnvelope.data)
          })

          test("should not effect the field input value", () => {
            expect(dataEnvelope.data.foo).toBe('foo2')
          })
        })
      })

      test(`should not have triggered warnings`, () => {
        expect(warningSpy).toHaveBeenCalledTimes(0)
      })

      describe('after no-change edit and blur', () => {
        let dataEnvelope, fooInput, warningSpy,
          getByTestId, getByLabelText,
          origData, updateCallback

        beforeAll(() => {
          ({ dataEnvelope, fooInput, warningSpy,
            getByTestId, getByLabelText,
            origData, updateCallback } = stdSetup(validators))

          fireEvent.change(fooInput, { target : { value : 'foo2' } })
          fireEvent.change(fooInput, { target : { value : 'foo' } })
          fireEvent.blur(fooInput)
        })

        afterAll(cleanup)

        test("should not invoke callback", () => {
          expect(updateCallback).toHaveBeenCalledTimes(0)
        })

        test("'origData' should equal local reference", () => {
          expect(origData).toEqual(dataEnvelope.data)
        })

        test(`should not have triggered warnings`, () => {
          expect(warningSpy).toHaveBeenCalledTimes(0)
        })
      })

      describe('after external data change', () => {
        let fooInput, dataEnvelope, updateCallback,
          getByLabelText, getByTestId, rerender

        beforeAll(() => {
          ({ fooInput, dataEnvelope, updateCallback,
            getByLabelText, getByTestId, rerender }
            = stdSetup(validators))
          dataEnvelope.data = { foo: 'foo3'}
          rerender(
            <ValidationContext data={dataEnvelope.data} updateCallback={updateCallback}>
              <TestChild validators={validators} />
            </ValidationContext>
          )
        })

        afterAll(cleanup)

        test("will reflect change", () => {
          expect(fooInput.value).toBe('foo3')
        })

        test("will reset history", () => {
          expect(getByTestId('undoCount').textContent).toBe('0')
          expect(getByTestId('redoCount').textContent).toBe('0')
        })

        test(`should trigger reset warning`, () => {
          expect(warningSpy).toHaveBeenCalledTimes(1)
          expect(warningSpy).toHaveBeenCalledWith(`Programatic update of data detected. Form history will be reset.`)
        })
      })
    }) // validators variation describe
  }) // validators variation loop

  describe("with initially invalid fields", () => {
    let fooInput, getByTestId, warningSpy
    beforeAll(() => {
      ({ fooInput, getByTestId, warningSpy }
        = stdSetup(testValidators, { foo: null }))
    })

    test('should not produce errors on invalid, untouched fields', () => {
      expect(getByTestId("errorMsg").textContent).toBe('null')
    })

    test('should be invalid', () => {
      expect(getByTestId("isValid").textContent).toBe('false')
    })

    describe("after blur", () => {
      beforeAll(() => {
        fireEvent.blur(fooInput)
      })

      test('should produce errors', () => {
        expect(getByTestId("errorMsg").textContent).toBe('Required.')
      })

      test('be invalid', () => {
        expect(getByTestId("isValid").textContent).toBe('false')
      })
    })

    test(`should not have triggered warnings`, () => {
      expect(warningSpy).toHaveBeenCalledTimes(0)
    })
  })
}) // describe('Validators', ...)
/*

  test("external data updates produce no warning when history disabled ('noHistory={true}')", () => {
    throw('implement me')
  })

  test("external data updates paired 'resetHistory={true}' produce no warning and resets the history", () => {
    throw('implement me')
  })*/

  // test 'resetToOriginalData', 'undoCount', 'redoCount', 'undo(n)', 'redo(n)', 'historyPosition', reset of forward history after update, and no reset after non-change change (edit, and then edit back without blur)
