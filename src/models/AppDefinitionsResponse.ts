import { IAppDef } from './AppDefinition'

export default interface AppDefinitionsResponse {
    appDefinitions: IAppDef[]
    rootDomain: string
    captainSubDomain: string
    defaultNginxConfig: string
}
