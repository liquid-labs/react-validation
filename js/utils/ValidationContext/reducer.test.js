/* global describe expect test */
import { reducer, INITIAL_STATE } from './reducer'
import { actions } from './actions'

describe('ValidationContext/reducer', () => {
  describe('after updating validators', () => {
    const wrongifier = () => 'Wrong!'
    const validators = [ wrongifier ]
    let baselineState
    beforeAll(() => {
      baselineState =
        reducer(INITIAL_STATE, actions.updateFieldValidators('foo', validators))
    })

    test('should create a field entry with validators', () => {
      expect(baselineState).toHaveProperty('fieldData.foo.validators', validators)
    })

    test(`that is untouched and blurred (after change)`, () => {
      expect(baselineState).toHaveProperty('fieldData.foo.touched', false)
      expect(baselineState).toHaveProperty('fieldData.foo.blurredAfterChange', true)
    })

    describe(`after update with same validators`, () => {
      let postUpdateState
      beforeAll(() => {
        postUpdateState = reducer(baselineState, actions.updateFieldValidators('foo', validators))
      })

      test(`state should be unchanged`, () => {
        expect(postUpdateState).toBe(baselineState)
      })
    })

    describe(`after update with equivalent validators`, () => {
      let postUpdateState
      beforeAll(() => {
        postUpdateState = reducer(baselineState, actions.updateFieldValidators('foo', [ wrongifier ]))
      })

      test(`state should be unchanged`, () => {
        expect(postUpdateState).toBe(baselineState)
      })
    })
  })

  describe(`after data update with 'foo'`, () => {
    let baselineState
    beforeAll(() => {
      baselineState = reducer(INITIAL_STATE, actions.updateData({ foo: 'foo' }))
    })

    test(`should create field entry 'foo' is untouched and blurred (after change)`, () => {
      expect(baselineState).toHaveProperty('fieldData.foo.touched', false)
      expect(baselineState).toHaveProperty('fieldData.foo.blurredAfterChange', true)
    })

    describe(`after blurring foo`, () => {
      let postBlurState
      beforeAll(() => {
        postBlurState = reducer(baselineState, actions.blurField('foo'))
      })

      test(`field should be touched and blurred (after change)`, () => {
        expect(postBlurState).toHaveProperty('fieldData.foo.touched', true)
        expect(postBlurState).toHaveProperty('fieldData.foo.blurredAfterChange', true)
      })

      describe(`after a second blur`, () => {
        let postBlurStateB
        beforeAll(() => {
          postBlurStateB = reducer(postBlurState, actions.blurField('foo'))
        })

        test(`state to be unchanged`, () => {
          expect(postBlurStateB).toBe(postBlurState)
        })
      })
    })
  })
})
