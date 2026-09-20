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

for (const cachedToken of ['', 'stale-token']) {
    test(`automatic login retries once with cached token ${JSON.stringify(cachedToken)}`, async () => {
        let token = cachedToken
        let logins = 0
        const seen = []
        const client = new HttpClient(
            'https://captain.example.com',
            async () => token,
            async () => {
                logins++
                token = 'fresh-token'
            }
        )
        client.fetchInternal = async () => {
            const headers = await client.createHeaders()
            seen.push(headers['x-captain-auth'])
            return seen.length === 1
                ? { status: ErrorFactory.STATUS_AUTH_TOKEN_INVALID }
                : { status: ErrorFactory.OKAY, data: { success: true } }
        }
        assert.deepEqual(await client.fetch(client.GET, '/user/apps', {})(), {
            success: true,
        })
        assert.equal(logins, 1)
        assert.deepEqual(seen, [cachedToken || undefined, 'fresh-token'])
    })
}

test('repeated authorization failure is propagated after one retry', async () => {
    let requests = 0
    let logins = 0
    const client = new HttpClient(
        'https://captain.example.com',
        async () => '',
        async () => {
            logins++
        }
    )
    client.fetchInternal = async () => {
        requests++
        return {
            status: ErrorFactory.STATUS_AUTH_TOKEN_INVALID,
            description: 'still invalid',
        }
    }
    await assert.rejects(
        client.fetch(client.GET, '/user/apps', {})(),
        (error) => {
            assert.equal(
                error.captainStatus,
                ErrorFactory.STATUS_AUTH_TOKEN_INVALID
            )
            assert.equal(error.captainMessage, 'still invalid')
            return true
        }
    )
    assert.equal(requests, 2)
    assert.equal(logins, 1)
})

test('ordinary server errors preserve status and message without retrying', async () => {
    let requests = 0
    const client = new HttpClient(
        'https://captain.example.com',
        async () => 'valid',
        async () => {
            assert.fail('unexpected login')
        }
    )
    client.fetchInternal = async () => {
        requests++
        return {
            status: ErrorFactory.ILLEGAL_PARAMETER,
            description: 'invalid input',
        }
    }
    await assert.rejects(
        client.fetch(client.POST, '/user/apps', {})(),
        (error) => {
            assert.equal(error.captainStatus, ErrorFactory.ILLEGAL_PARAMETER)
            assert.equal(error.captainMessage, 'invalid input')
            return true
        }
    )
    assert.equal(requests, 1)
})
