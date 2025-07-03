import { IRegistryInfo } from './IRegistryInfo'

export default interface RegistriesResponse {
    registries: IRegistryInfo[]
    defaultRegistryId?: string
}
