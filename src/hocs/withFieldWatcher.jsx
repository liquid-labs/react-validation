import { compose, withStateHandlers } from 'recompose'
import { getFieldWatcher } from '../helpers'
import camelCase from 'lodash.camelcase'

export const withFieldWatcher = (options) => {
  const key = (options && options.key) || 'fieldWatcher'
  const resetKey = camelCase(`reset ${key}`)

  return compose(
    withStateHandlers(
      ({ mode }) => {
        const initiallyValid = (options
              && options.initiallyValid
              && options.initiallyValid(mode))
            || ((!options || !options.initiallyValid)
              && mode === 'edit')
        return {
          [key] : getFieldWatcher(initiallyValid)
        }
      },
      {
        [resetKey] : (state) => () => {
          const fw = state[key]
          return {
            [key] : fw.reset()
          }
        }
      }
    )
  )
}
