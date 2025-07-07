# CapRover API SDK (TypeScript)

A simple, typed TypeScript SDK for the CapRover API.

## Install

npm install caprover-api

csharp
Copy
Edit

## Usage

```ts
import CapRoverAPI, { CapRoverModels } from 'caprover-api'

const api = new CapRoverAPI('password', 'https://captain.domain.com')

const info = await api.serverInfo()

const app: CapRoverModels.AppDefinition = {
    appName: 'test',
    hasPersistentData: false,
}
await api.createApp(app)
```

---

## **How to Run Locally**

1. `npm install`
2. `npm run build`
3. `node dist/example.js` _(after putting your own password/URL!)_

---

## **Summary**

- **Browser + Node.js** support via `cross-fetch`.
- **TypeScript types** are exported for models.
- Super easy to expand with more API endpoints!

---
