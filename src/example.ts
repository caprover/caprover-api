import CapRoverAPI, {
    CapRoverModels,
    SimpleAuthenticationProvider,
} from './index'

const caprover = new CapRoverAPI(
    'https://captain.server.demo.caprover.com',
    new SimpleAuthenticationProvider(() => {
        return Promise.resolve({
            password: 'captain42',
            otpToken: undefined,
        })
    })
)

console.log('===============================================')

Promise.resolve()
    .then(() => {
        return caprover.getAllNodes()
    })
    .then((response) => {
        console.log(
            '=============================================== getAllNodes:'
        )

        console.log(response)
        return caprover.getDockerRegistries()
    })
    .then((response) => {
        console.log(
            '=============================================== getDockerRegistries:'
        )
        console.log(response)
        return caprover.executeGenericApiCommand('GET', '/user/registries', {})
    })
    .then((response) => {
        console.log(
            '=============================================== getDockerRegistries:'
        )
        console.log(response)
    })
    .catch((error) => {
        console.log(error)
    })
