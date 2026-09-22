const assert = require('node:assert/strict')
const test = require('node:test')

const ApiManagerModule = require('../dist/api/ApiManager')
const ApiManager = ApiManagerModule.default
const { SimpleAuthenticationProvider } = ApiManagerModule

function createApiWithRequestRecorder() {
    const api = new ApiManager(
        'https://captain.example.com',
        new SimpleAuthenticationProvider(() =>
            Promise.resolve({ password: 'password' })
        )
    )
    const requests = []

    api.http = {
        GET: 'GET',
        POST: 'POST',
        PATCH: 'PATCH',
        FORM_DATA: 'form-data',
        fetch(method, endpoint, data, bodyType = 'json') {
            requests.push({ method, endpoint, data, bodyType })
            return () => Promise.resolve({})
        },
    }

    return { api, requests }
}

test('patchAppDefinition uses the partial update endpoint', async () => {
    const { api, requests } = createApiWithRequestRecorder()

    await api.patchAppDefinition('test-app', {
        instanceCount: 2,
        description: 'scaled app',
    })

    assert.deepEqual(requests, [
        {
            method: 'PATCH',
            endpoint: '/user/apps/appDefinitions/update',
            data: {
                instanceCount: 2,
                description: 'scaled app',
                appName: 'test-app',
            },
            bodyType: 'json',
        },
    ])
})

test('fetchAppLogs exposes the backend encoding argument', async () => {
    const { api, requests } = createApiWithRequestRecorder()

    await api.fetchAppLogs('test-app', 'utf8')

    assert.deepEqual(requests[0], {
        method: 'GET',
        endpoint: '/user/apps/appData/test-app/logs',
        data: { encoding: 'utf8' },
        bodyType: 'json',
    })
})

test('fetchAppLogsInHex remains backward compatible', async () => {
    const { api, requests } = createApiWithRequestRecorder()

    await api.fetchAppLogsInHex('test-app')

    assert.deepEqual(requests[0].data, { encoding: 'hex' })
})

test('uploadAppData keeps detached deployment as the default', async () => {
    const { api, requests } = createApiWithRequestRecorder()

    await api.uploadAppData('test-app', 'tar contents')

    assert.equal(
        requests[0].endpoint,
        '/user/apps/appData/test-app?detached=1'
    )
    assert.equal(requests[0].bodyType, 'form-data')
})

test('uploadAppData can wait for an attached deployment', async () => {
    const { api, requests } = createApiWithRequestRecorder()

    await api.uploadAppData('test-app', 'tar contents', false)

    assert.equal(requests[0].endpoint, '/user/apps/appData/test-app')
    assert.equal(requests[0].bodyType, 'form-data')
})

test('executeGenericApiCommand accepts PATCH', async () => {
    const { api, requests } = createApiWithRequestRecorder()

    await api.executeGenericApiCommand('PATCH', '/user/example', {
        value: true,
    })

    assert.equal(requests[0].method, 'PATCH')
})

test('saveTheme sends supplied writable theme fields', async () => {
    const { api, requests } = createApiWithRequestRecorder()

    await api.saveTheme('old-theme', {
        name: 'new-theme',
        content: 'theme-content',
        extra: '{"siderTheme":"dark"}',
        headEmbed: '<meta name="theme-marker" content="test">',
        builtIn: true,
    })

    assert.deepEqual(requests, [
        {
            method: 'POST',
            endpoint: '/user/system/themes/update',
            data: {
                oldName: 'old-theme',
                name: 'new-theme',
                content: 'theme-content',
                extra: '{"siderTheme":"dark"}',
                headEmbed: '<meta name="theme-marker" content="test">',
            },
            bodyType: 'json',
        },
    ])
})

test('saveTheme omits unspecified optional theme fields', async () => {
    const { api, requests } = createApiWithRequestRecorder()

    await api.saveTheme('old-theme', {
        name: 'new-theme',
        content: 'theme-content',
    })

    assert.deepEqual(requests[0].data, {
        oldName: 'old-theme',
        name: 'new-theme',
        content: 'theme-content',
    })
    assert.equal('extra' in requests[0].data, false)
    assert.equal('headEmbed' in requests[0].data, false)
    assert.equal(JSON.stringify(requests[0].data).includes('undefined'), false)
})
