import type CapRoverAPI from '../dist'
import type { CapRoverModels } from '../dist'

type OneClickAppDefinitionResponse = Awaited<
    ReturnType<CapRoverAPI['getOneClickAppByName']>
>

declare const response: OneClickAppDefinitionResponse
const appTemplate: CapRoverModels.IOneClickTemplate = response.appTemplate

void appTemplate
