import type CapRoverAPI from '../dist'

type RegistriesResponse = Awaited<ReturnType<CapRoverAPI['getDockerRegistries']>>
declare const response: RegistriesResponse

const defaultId: string | undefined = response.defaultPushRegistryId
// @ts-expect-error The backend does not return this legacy field.
response.defaultRegistryId
void defaultId
