import axios from 'axios'
import ErrorFactory from '../utils/ErrorFactory'
import Logger from '../utils/Logger'

let TOKEN_HEADER = 'x-captain-auth'
let NAMESPACE = 'x-namespace'
let CAPTAIN = 'captain'

export default class HttpClient {
    public readonly GET = 'GET'
    public readonly POST = 'POST'
    public isDestroyed = false
    private authToken: string = ''

    constructor(
        private baseUrl: string,
        private onAuthFailure: () => Promise<string>
    ) {
        //
    }

    createHeaders() {
        let headers: any = {}
        if (this.authToken) headers[TOKEN_HEADER] = this.authToken
        headers[NAMESPACE] = CAPTAIN

        // check user/appData or apiManager.uploadAppData before changing this signature.
        return headers
    }

    setAuthToken(authToken: string) {
        this.authToken = authToken
    }

    destroy() {
        this.isDestroyed = true
    }

    fetch(method: 'GET' | 'POST', endpoint: string, variables: any) {
        const self = this
        return function (): Promise<any> {
            return Promise.resolve() //
                .then(function () {
                    console.log(
                        `Fetching ${method} ${endpoint} with variables:`,
                        variables
                    )
                    return self.fetchInternal(method, endpoint, variables) //
                })
                .then(function (axiosResponse) {
                    console.log(
                        `Axios response for ${method} ${endpoint}:`,
                        axiosResponse
                    )
                    const data = axiosResponse.data // this is an axios thing!

                    if (
                        data.status === ErrorFactory.STATUS_AUTH_TOKEN_INVALID
                    ) {
                        return self
                            .onAuthFailure() //
                            .then(function (authToken) {
                                self.setAuthToken(authToken)
                                return self
                                    .fetchInternal(method, endpoint, variables)
                                    .then(function (newAxiosResponse) {
                                        return newAxiosResponse.data
                                    })
                            })
                            .catch(function (error) {
                                // Upon wrong password or back-off error, we force logout the user
                                // to avoid getting stuck with wrong password loop
                                if (
                                    error.captainStatus + '' ===
                                        ErrorFactory.STATUS_PASSWORD_BACK_OFF +
                                            '' ||
                                    error.captainStatus + '' ===
                                        ErrorFactory.STATUS_WRONG_PASSWORD + ''
                                ) {
                                    self.setAuthToken('')
                                }

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
                        Logger.dev('Destroyed then not called')
                    })
                })
                .catch(function (error) {
                    Logger.error(error)
                    return new Promise(function (resolve, reject) {
                        if (!self.isDestroyed) return reject(error)
                        Logger.dev('Destroyed catch not called')
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
        return axios
            .get(this.baseUrl + endpoint, {
                params: variables,
                headers: self.createHeaders(),
            }) //
            .then(function (data) {
                // console.log(data);
                return data
            })
    }

    postReq(endpoint: string, variables: any) {
        const self = this
        return axios
            .post(this.baseUrl + endpoint, variables, {
                headers: self.createHeaders(),
            }) //
            .then(function (data) {
                // console.log(data);
                return data
            })
    }
}
