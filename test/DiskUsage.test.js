const assert = require('node:assert/strict')
const { once } = require('node:events')
const { createServer } = require('node:http')
const test = require('node:test')
const { default: ApiManager, SimpleAuthenticationProvider } = require('../dist')

test('getDiskUsage uses authenticated GET and handles the backend response envelope', async () => {
    const data = {
        coverage: 'captain-node',
        nodes: [
            {
                nodeId: 'node-1',
                hostname: 'captain-host',
                disks: [
                    {
                        totalBytes: 1000,
                        usedBytes: 900,
                        availableBytes: 100,
                        severity: 'warning',
                    },
                ],
            },
        ],
    }
    let response = { status: 100, description: 'Disk usage retrieved', data }
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
        assert.deepEqual(await api.getDiskUsage(), data)
        response = {
            status: 1000,
            description: 'Unable to retrieve disk usage',
            data: {},
        }
        await assert.rejects(api.getDiskUsage(), (error) => {
            assert.equal(error.captainStatus, 1000)
            assert.equal(error.captainMessage, response.description)
            return true
        })
        assert.deepEqual(
            requests,
            Array(2).fill({
                method: 'GET',
                url: '/api/v2/user/system/diskusage',
                token: 'test-token',
            })
        )
    } finally {
        api.destroy()
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
    }
})
