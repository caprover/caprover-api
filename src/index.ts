import ApiManager from './api/ApiManager'

new ApiManager('http://localhost:3000')
    .getAuthToken('captain42')
    .then((response: any) => {
        console.log(response)
    })
    .catch((error: any) => {
        console.log(error)
    })

console.log('Hello World!')
