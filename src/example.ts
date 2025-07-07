import CapRoverAPI, { CapRoverModels } from './index'

const caprover = new CapRoverAPI('http://127.0.0.1:3000', () => {
    // get password and otp from user
    return Promise.resolve({
        password: 'captain42',
        otpToken: undefined,
    })
})

console.log('===============================================')

Promise.resolve()
    .then(() => {
        return caprover.getAllNodes()
    })
    .then((response) => {
        console.log(response)
        return caprover.getDockerRegistries()
    })
    .then((response) => {
        console.log(response)
    })
    .catch((error) => {
        console.log(error)
    })

// TODO: a good example of how to export with typescript type information
// https://github.com/dgreif/ring/blob/main/packages/ring-client-api/package.json
//

console.log('===============================================')
