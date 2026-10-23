const assert = require('node:assert/strict')
const { once } = require('node:events')
const { createServer } = require('node:http')
const test = require('node:test')
const {
    default: ApiManager,
    SimpleAuthenticationProvider,
    CapRoverModels,
} = require('../dist')

test('runtime methods use authenticated GETs and preserve runtime data and API errors', async () => {
    const { AppRuntimeStatus, TaskState } = CapRoverModels
    const task = {
        taskId: 'task-1',
        slot: 1,
        nodeId: 'node-1',
        nodeName: null,
        image: 'nginx:alpine',
        state: TaskState.Running,
        desiredState: TaskState.Running,
        stateChangedAt: '2026-10-22T12:00:00.123456789Z',
        message: 'started',
        error: null,
        exitCode: 0,
    }
    const app = {
        appName: 'website',
        status: AppRuntimeStatus.Running,
        desiredInstances: 1,
        runningInstances: 1,
        currentTasks: [task],
        latestFailure: {
            taskId: 'old-task',
            occurredAt: null,
            error: 'task: non-zero exit (1)',
        },
        error: null,
    }
    const unavailable = {
        ...app,
        appName: 'missing',
        status: AppRuntimeStatus.Unavailable,
        desiredInstances: null,
        runningInstances: null,
        currentTasks: [],
        latestFailure: null,
        error: 'Service not found',
    }
    let response = { status: 100, data: { apps: [app, unavailable] } }
    const requests = []
    const server = createServer((req, res) => {
        requests.push({
            method: req.method,
            url: req.url,
            token: req.headers['x-captain-auth'],
        })
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(response))
    })
    server.listen(0, '127.0.0.1')
    await once(server, 'listening')
    const provider = new SimpleAuthenticationProvider(async () => ({
        password: 'unused',
    }))
    provider.onAuthTokenUpdated('test-token')
    const api = new ApiManager(
        `http://127.0.0.1:${server.address().port}`,
        provider
    )
    try {
        assert.deepEqual(await api.getAppsRuntime(), response.data)
        response = { status: 100, data: { apps: [] } }
        assert.deepEqual(await api.getAppsRuntime(), { apps: [] })

        const details = {
            ...app,
            taskHistory: [{ ...task, taskId: 'old-task', state: TaskState.Failed }],
        }
        response = { status: 100, data: details }
        assert.deepEqual(await api.getAppRuntime('website'), details)
        response = { status: 100, data: { ...unavailable, taskHistory: [] } }
        assert.deepEqual(await api.getAppRuntime('missing'), response.data)

        response = { status: 1101, description: 'App not found', data: {} }
        await assert.rejects(api.getAppRuntime('unknown/?#'), (error) => {
            assert.equal(error.captainStatus, 1101)
            assert.equal(error.captainMessage, 'App not found')
            return true
        })
        response = { status: 1000, description: 'Runtime lookup failed', data: {} }
        await assert.rejects(api.getAppsRuntime(), (error) => {
            assert.equal(error.captainStatus, 1000)
            assert.equal(error.captainMessage, 'Runtime lookup failed')
            return true
        })
        assert.deepEqual(
            requests,
            ['', '', '/website', '/missing', '/unknown%2F%3F%23', ''].map(
                (suffix) => ({
                    method: 'GET',
                    url: `/api/v2/user/apps/runtime${suffix}`,
                    token: 'test-token',
                })
            )
        )
    } finally {
        api.destroy()
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
    }
})
