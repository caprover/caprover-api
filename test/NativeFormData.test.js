const assert = require('node:assert/strict')
const { createServer } = require('node:http')
const { once } = require('node:events')
const test = require('node:test')
const {
    default: ApiManager,
    SimpleAuthenticationProvider,
} = require('../dist/api/ApiManager')

test('uploadAppData sends a real multipart file through the Node transport', async () => {
    const requests = []
    const server = createServer(async (req, res) => {
        const chunks = []
        for await (const chunk of req) chunks.push(chunk)
        requests.push({
            url: req.url,
            headers: req.headers,
            body: Buffer.concat(chunks),
        })
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ status: 100, data: {} }))
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
        const payload = new Uint8Array([0, 255, 128, 10, 42])
        await api.uploadAppData(
            'fixture',
            new File([payload], 'fixture.tar', { type: 'application/x-tar' }),
            false
        )
        assert.equal(requests.length, 1)
        const request = requests[0]
        assert.equal(request.url, '/api/v2/user/apps/appData/fixture')
        assert.equal(request.headers['x-captain-auth'], 'test-token')
        assert.match(
            request.headers['content-type'],
            /^multipart\/form-data; boundary=/
        )
        assert.match(
            request.body.toString(),
            /name="sourceFile"; filename="fixture.tar"/
        )
        assert.ok(request.body.includes(Buffer.from(payload)))
    } finally {
        api.destroy()
        server.closeAllConnections()
        await new Promise((resolve) => server.close(resolve))
    }
})
