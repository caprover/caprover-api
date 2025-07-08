import axios from 'axios'
import ErrorFactory from './ErrorFactory'
import { AuthenticationProvider } from './ApiManager'

let TOKEN_HEADER = 'x-captain-auth'
let NAMESPACE = 'x-namespace'
let CAPTAIN = 'captain'

export default class HttpClient {
    public readonly GET = 'GET'
    public readonly POST = 'POST'
    public isDestroyed = false

    constructor(
        private baseUrl: string,
        private authTokenProvider: () => Promise<string>,
        private onLoginRequested: () => Promise<void>
    ) {
        //
    }

    createHeaders() {
        let headers: any = {}
        headers[NAMESPACE] = CAPTAIN

        // check user/appData or apiManager.uploadAppData before changing this signature.

        return Promise.resolve() //
            .then(() => {
                return this.authTokenProvider()
            })
            .then((authToken) => {
                if (authToken) headers[TOKEN_HEADER] = authToken
                return headers
            })
    }

    destroy() {
        this.isDestroyed = true
    }

    fetch(method: 'GET' | 'POST', endpoint: string, variables: any) {
        const self = this
        return function (): Promise<any> {
            return Promise.resolve() //
                .then(function () {
                    return self.fetchInternal(method, endpoint, variables) //
                })
                .then(function (axiosResponse) {
                    const data = axiosResponse.data // this is an axios thing!

                    if (
                        // if we ever get STATUS_ERROR_NOT_AUTHORIZED when trying to log in, we will end up in an infinite loop!
                        data.status === ErrorFactory.STATUS_AUTH_TOKEN_INVALID
                    ) {
                        return self
                            .onLoginRequested() //
                            .then(function () {
                                return self
                                    .fetchInternal(method, endpoint, variables)
                                    .then(function (newAxiosResponse) {
                                        return newAxiosResponse.data
                                    })
                            })
                            .catch(function (error) {
                                return Promise.reject(error)
                            })
                    } else {
                        return data
                    }
                })
                .then(function (data) {
                    if (
                        data.status !== ErrorFactory.OKAY &&
                        data.status !== ErrorFactory.OK_PARTIALLY &&
                        data.status !== ErrorFactory.OKAY_BUILD_STARTED
                    ) {
                        throw ErrorFactory.createError(
                            data.status || ErrorFactory.UNKNOWN_ERROR,
                            data.description || ''
                        )
                    }
                    return data
                })
                .then(function (data) {
                    // These two blocks are clearly memory leaks! But I don't have time to fix them now... I need to CANCEL the promise, but since I don't
                    // have CANCEL method on the native Promise, I return a promise that will never RETURN if the HttpClient is destroyed.
                    // Will fix them later... but it shouldn't be a big deal anyways as it's only a problem when user navigates away from a page before the
                    // network request returns back.
                    return new Promise(function (resolve, reject) {
                        // data.data here is the "data" field inside the API response! {status: 100, description: "Login succeeded", data: {…}}
                        if (!self.isDestroyed) return resolve(data.data)
                    })
                })
                .catch(function (error) {
                    return new Promise(function (resolve, reject) {
                        if (!self.isDestroyed) return reject(error)
                    })
                })
        }
    }

    fetchInternal(method: 'GET' | 'POST', endpoint: string, variables: any) {
        if (method === this.GET) return this.getReq(endpoint, variables)

        if (method === this.POST) return this.postReq(endpoint, variables)

        throw new Error(`Unknown method: ${method}`)
    }

    getReq(endpoint: string, variables: any) {
        const self = this
        return Promise.resolve() //
            .then(function () {
                return self.createHeaders()
            })
            .then(function (headers) {
                return axios.get(self.baseUrl + endpoint, {
                    params: variables,
                    headers: headers,
                })
            })
            .then(function (data) {
                // console.log(data);
                return data
            })
    }

    postReq(endpoint: string, variables: any) {
        const self = this
        return Promise.resolve() //
            .then(function () {
                return self.createHeaders()
            })
            .then(function (headers) {
                return axios.post(self.baseUrl + endpoint, variables, {
                    headers: headers,
                }) //
            }) //
            .then(function (data) {
                // console.log(data);
                return data
            })
    }
}
