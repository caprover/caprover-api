import type CapRoverAPI from '../dist'

type RegistriesResponse = Awaited<ReturnType<CapRoverAPI['getDockerRegistries']>>

declare const response: RegistriesResponse
const defaultPushRegistryId: string | undefined = response.defaultPushRegistryId

// @ts-expect-error The backend never returns this old property.
response.defaultRegistryId

void defaultPushRegistryId
