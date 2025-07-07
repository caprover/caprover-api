import CapRoverAPI, { CapRoverModels } from './index'

const caprover = new CapRoverAPI(
    'https://captain.server.demo.caprover.com',
    () => {
        // get password and otp from user
        return Promise.resolve({
            password: 'captain42',
            otpToken: undefined,
        })
    }
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
    })
    .catch((error) => {
        console.log(error)
    })

// TODO: a good example of how to export with typescript type information
// https://github.com/dgreif/ring/blob/main/packages/ring-client-api/package.json
//
