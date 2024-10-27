import ApiManager from './api/ApiManager'

const apiManager = new ApiManager('http://localhost:3000', () => {
    // get password and otp from user
    return Promise.resolve({
        password: 'captain42',
        otpToken: undefined,
    })
})

Promise.resolve()
    .then(() => {
        return apiManager.getCaptainInfo()
    })
    .then((response: any) => {
        console.log(response)
        return apiManager.getDockerRegistries()
    })
    .then((response: any) => {
        console.log(response)
    })
    .catch((error: any) => {
        console.log(error)
    })

// Think about what if one future requests fails and we need to reuse the same password and otp
// For example, if the server restarts, we need to re-authenticate the user using the same password
// and otp. So we need to store them somewhere. Maybe in the ApiManager instance itself?

// TODO: a good example of how to export with typescript type information
// https://github.com/dgreif/ring/blob/main/packages/ring-client-api/package.json
//

console.log('===============================================')
