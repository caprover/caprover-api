const assert = require('node:assert/strict')
const test = require('node:test')

const ErrorFactory = require('../dist/api/ErrorFactory').default
const HttpClientModule = require('../dist/api/HttpClient')
const HttpClient = HttpClientModule.default
const { createPostRequestInit } = HttpClientModule
const { createPatchRequestInit } = HttpClientModule

test('JSON requests preserve the existing serialization and content type', () => {
    const payload = { appName: 'test-app' }
    const request = createPostRequestInit(
        payload,
        { 'x-captain-auth': 'token' },
        'json'
    )

    assert.deepEqual(request.headers, {
        'Content-Type': 'application/json',
        'x-captain-auth': 'token',
    })
    assert.equal(request.body, JSON.stringify(payload))
})

test('form data is passed through without setting a content type', () => {
    const formData = { sourceFile: 'tar contents' }
    const headers = { 'x-captain-auth': 'token' }
    const request = createPostRequestInit(formData, headers, 'form-data')

    assert.strictEqual(request.body, formData)
    assert.deepEqual(request.headers, headers)
    assert.equal(Object.hasOwn(request.headers, 'Content-Type'), false)
})

test('PATCH requests use JSON serialization and content type', () => {
    const payload = { appName: 'test-app', instanceCount: 2 }
    const request = createPatchRequestInit(payload, {
        'x-captain-auth': 'token',
    })

    assert.equal(request.method, 'PATCH')
    assert.deepEqual(request.headers, {
        'Content-Type': 'application/json',
        'x-captain-auth': 'token',
    })
    assert.equal(request.body, JSON.stringify(payload))
})

test('authentication retry preserves the form-data body type', async () => {
    let loginRequests = 0
    const bodyTypes = []
    const client = new HttpClient(
        'https://captain.example.com',
        () => Promise.resolve('token'),
        () => {
            loginRequests++
            return Promise.resolve()
        }
    )

    client.fetchInternal = (_method, _endpoint, _variables, bodyType) => {
        bodyTypes.push(bodyType)
        if (bodyTypes.length === 1) {
            return Promise.resolve({
                status: ErrorFactory.STATUS_AUTH_TOKEN_INVALID,
            })
        }

        return Promise.resolve({ status: ErrorFactory.OKAY, data: {} })
    }

    await client.fetch(client.POST, '/upload', {}, client.FORM_DATA)()

    assert.equal(loginRequests, 1)
    assert.deepEqual(bodyTypes, ['form-data', 'form-data'])
})
