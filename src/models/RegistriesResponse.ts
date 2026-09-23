import { IRegistryInfo } from './IRegistryInfo'

export default interface RegistriesResponse {
    registries: IRegistryInfo[]
    defaultPushRegistryId?: string
}
