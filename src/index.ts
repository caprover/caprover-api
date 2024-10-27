import ApiManager from './api/ApiManager'

new ApiManager('http://localhost:3000')
    .getAuthToken('captain42')
    .then((response: any) => {
        console.log(response)
    })
    .catch((error: any) => {
        console.log(error)
    })

// TODO:
// Change the signature to:
// new ApiManager('http://localhost:3000', () => {
//     // get password and otp from user
//     return Promise.resolve(ApiManager.createAuth(password, otp))
// })

console.log('Hello World!')
