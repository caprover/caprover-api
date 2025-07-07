https://github.com/caprover/caprover-api

# Official CapRover API SDK (TypeScript)

A simple, typed Typescript SDK for the CapRover API.

## Install

```
npm install caprover-api
```

## Usage

```ts
import CapRoverAPI, { CapRoverModels } from 'caprover-api'

const caprover = new CapRoverAPI(
    'https://captain.server.demo.caprover.com',
    () => {
        // get password and otp from user
        return Promise.resolve({
            password: 'captain42',
            otpToken: undefined, // only if 2FA is enabled
        })
    }
)

caprover
    .getAllNodes()
    .then((response) => {
        console.log(response)
    })
    .catch((error) => {
        console.log(error)
    })
```

---

## **How to Run Locally**

1. `npm install`
2. `npm run dev` _(after putting your own password/URL!)_
