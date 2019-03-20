/**
 * Tests needed:
 * - When data is initialized by the ValidInputs and they are not initially
 *   rendered (as in within a 'Waiter'), we defer the initial snapshot until we
 *   see "something". Need to test this case.
 */
/* global beforeAll describe expect jest test */
import React from 'react'

import { ValidationContext, useValidationContextAPI } from '../utils/ValidationContext'
import { ValidInput } from './ValidInput'

import { cleanup, fireEvent, render } from 'react-testing-library'

const TestData = () => {
  const vcAPI = useValidationContextAPI()

  return (
    <div>
      <button aria-label="resetButton" onClick={() => vcAPI.resetData()}>reset</button>
      <button aria-label="rewindButton" onClick={() => vcAPI.rewindData()}>rewind</button>
      <button aria-label="advanceButton" onClick={() => vcAPI.advanceData()}>advance</button>
      <button aria-label="resetHistoryButton" onClick={() => vcAPI.resetHistory()}>reset history</button>
      <span data-testid="fooValue">{vcAPI.getFieldInputValue('foo') + ''}</span>
      <span data-testid="isChanged">{vcAPI.isChanged() + ''}</span>
      <span data-testid="isValid">{vcAPI.isValid() + ''}</span>
      <span data-testid="errorMsg">{vcAPI.getFieldErrorMessage('foo') + ''}</span>
      <span data-testid="undoCount">{vcAPI.getUndoCount() + ''}</span>
      <span data-testid="redoCount">{vcAPI.getRedoCount() + ''}</span>
      <span data-testid="historyCount">{vcAPI.getHistoryCount() + ''}</span>
      <span data-testid="origData">{JSON.stringify(vcAPI.getOrigData())}</span>
      <span data-testid="exportData">{JSON.stringify(vcAPI.getData())}</span>
    </div>
  )
}

describe(`ValidInput`, () => {
  test('should raise an exception if used outside a ValidationContext', () => {
    const errMock = jest.spyOn(console, 'error').mockImplementation()
    expect(() => { render(<ValidInput initialValue='foo' />); }).toThrow()
    errMock.mockReset()
  })

  describe('within a ValidationContext', () => {

    describe('taking a value as a property with no context data', () => {
      let getByLabelText, getByTestId, fooInput

      beforeAll(() => {
        cleanup();
        ({ getByLabelText, getByTestId } = render(
          <ValidationContext>
            <ValidInput id="foo" label="foo" initialValue="fooVal" />
            <TestData />
          </ValidationContext>
        ))
        fooInput = getByLabelText('foo');
      })

      test('will display the value', () => {
        expect(fooInput.value).toBe('fooVal')
      })

      test('update the value in the context', () => {
        expect(getByTestId('fooValue').textContent).toBe('fooVal')
      })

      test(`snapshot 'origData' after initial render`, () => {
        expect(getByTestId('origData').textContent).toEqual(JSON.stringify({foo : 'fooVal'}))
      })

      describe('after updating the value', () => {
        beforeAll(() => { fireEvent.change(fooInput, { target : { value : 'foo2' } }) })

        test('will display the value', () => {
          expect(fooInput.value).toBe('foo2')
        })

        test('update the value in the context', () => {
          expect(getByTestId('fooValue').textContent).toBe('foo2')
        })

        describe('after blurring the field', () => {
          beforeAll(() => fireEvent.blur(fooInput))

          test("we point at the the 1 and only history", () => {
            expect(getByTestId('undoCount').textContent).toBe('0')
            expect(getByTestId('redoCount').textContent).toBe('0')
            expect(getByTestId('historyCount').textContent).toBe('1')
          })
        }) // field blur
      }) // update
    }) // value as a property / no context data sequence

    describe(`'noExport' inputs`, () => {
      describe(`receiving value from the context data`, () => {
        let getByTestId
        beforeAll(() => {
          cleanup();
          ({ getByTestId } = render(
            <ValidationContext data={{ foo : 'fooVal', bar : 'bar' }}>
              <ValidInput id="foo" label="foo" noExport />
              <ValidInput id="bar" label="bar" />
              <TestData />
            </ValidationContext>
          ))
        })

        test('will be excluded from the data export', () => {
          expect(getByTestId('exportData').textContent).toBe(JSON.stringify({ bar : 'bar' }))
        })
      })

      describe('with value set from the input', () => {
        let getByTestId
        beforeAll(() => {
          cleanup();
          ({ getByTestId } = render(
            <ValidationContext>
              <ValidInput id="foo" label="foo" initialValue="fooVal" noExport />
              <ValidInput id="bar" label="bar" initialValue="bar" />
              <TestData />
            </ValidationContext>
          ))
        })

        test('will be excluded from the data export', () => {
          expect(getByTestId('exportData').textContent).toBe(JSON.stringify({ bar : 'bar' }))
        })
      })
    })

    describe('when gridded', () => {
      let container

      beforeAll(() => {
        cleanup();
        ({ container } = render(
          <ValidationContext data={{ foo : 'fooVal' }}>
            <ValidInput id="foo" label="foo" gridded />
            <TestData />
          </ValidationContext>
        ))
      })

      test('the input is displayed in a grid item', () => {
        expect(container.querySelector("[class^='MuiGrid-item']")).not.toBeNull()
      })
    })

    describe('with help', () => {
      let container, getByText, helpButton
      beforeAll(() => {
        cleanup();
        ({ container, getByText } = render(
          <ValidationContext data={{ foo : 'fooVal' }}>
            <ValidInput id="foo" label="foo" help="Foo is not bar." />
            <TestData />
          </ValidationContext>
        ))
        helpButton = container.querySelector("[class^='Help-root'] button")
      })

      test('includes the help button', () => {
        expect(helpButton).not.toBeNull()
      })

      describe('after clicking the help control', () => {
        beforeAll(() => fireEvent.click(helpButton))
        test('includes the help', () => {
          expect(getByText("Foo is not bar.")).not.toBeNull()
        })
      })
    }) // with help

    describe('with onChange (no result)', () => {
      let getByLabelText, getByTestId, fooInput, changeSpy

      beforeAll(() => {
        cleanup()
        changeSpy = jest.fn();
        ({ getByLabelText, getByTestId } = render(
          <ValidationContext data={{ foo : "fooVal" }}>
            <ValidInput id="foo" label="foo" onChange={changeSpy} />
            <TestData />
          </ValidationContext>
        ));
        fooInput = getByLabelText('foo')
      })

      test('will show the baseline value', () => {
        expect(fooInput.value).toBe('fooVal')
      })

      describe('after updating the value', () => {
        beforeAll(() => { fireEvent.change(fooInput, { target : { value : 'foo2' } }) })

        test('will display the value', () => {
          expect(fooInput.value).toBe('foo2')
        })

        test('update the value in the context', () => {
          expect(getByTestId('fooValue').textContent).toBe('foo2')
        })

        test("call the passed in 'onChange'", () => {
          expect(changeSpy).toHaveBeenCalledTimes(1)
        })
      })
    }) // with onChange (no result)

    describe('with onChange (value modifying)', () => {
      let getByLabelText, getByTestId, fooInput, changeSpy

      beforeAll(() => {
        cleanup()
        const onChange = () => 'FOO2'
        changeSpy = jest.fn(onChange);
        ({ getByLabelText, getByTestId } = render(
          <ValidationContext data={{ foo : "fooVal" }}>
            <ValidInput id="foo" label="foo" onChange={changeSpy} />
            <TestData />
          </ValidationContext>
        ));
        fooInput = getByLabelText('foo')
      })

      test('will show the baseline value', () => {
        expect(fooInput.value).toBe('fooVal')
      })

      describe('after updating the value', () => {
        beforeAll(() => { fireEvent.change(fooInput, { target : { value : 'foo2' } }) })

        test('will display the modified value', () => {
          expect(fooInput.value).toBe('FOO2')
        })

        test('update the modified value in the context', () => {
          expect(getByTestId('fooValue').textContent).toBe('FOO2')
        })

        test("call the passed in 'onChange'", () => {
          expect(changeSpy).toHaveBeenCalledTimes(1)
        })
      })
    }) // with onChange (value modifying)
  }) // within a valid context
})
