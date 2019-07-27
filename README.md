# react-validation

Self-validating React user-input component built on top of Material UI.

## Installation & usage

```
npm i @liquid-labs/react-validation
```
Then:
```
import React from 'react'

import {
  ValidationContext,
  ValidInput,
  useValidationAPI } from '@liquid-labs/react-validation'

const HelloInternals = () => {
  const vcAPI = useValidationAPI()

  return (
    <>
      <ValidInput label="Name" />
      <submit disabled={ !vcAPI.isValid() } />
    </>
  )
}

const HelloWidget = () =>
  <ValidationContext>
    <HelloInternals />
  </ValidationContext>
```
