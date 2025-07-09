import { IAppDef } from '../models/AppDefinition'
import AppDefinitionsResponse from '../models/AppDefinitionsResponse'
import AppDeleteResponse from '../models/AppDeleteResponse'
import { IAutomatedCleanupConfigs } from '../models/AutomatedCleanupConfigs'
import { BuildLogsResponse } from '../models/BuildLogsResponse'
import CapRoverTheme from '../models/CapRoverTheme'
import CaptainInfo from '../models/CaptainInfo'
import { GoAccessInfo } from '../models/GoAccessInfo'
import GoAccessReportResponse from '../models/GoAccessReportResponse'
import { ICaptainDefinition } from '../models/ICaptainDefinition'
import IGoAccessInfo from '../models/IGoAccessInfo'
import {
    IProConfig,
    IProFeatures,
    TwoFactorAuthRequest,
    TwoFactorAuthResponse,
} from '../models/IProFeatures'
import { IRegistryInfo } from '../models/IRegistryInfo'
import { IVersionInfo } from '../models/IVersionInfo'
import LoadBalancerInfo from '../models/LoadBalancerInfo'
import LogsResponse from '../models/LogsResponse'
import { NetDataInfo } from '../models/NetDataInfo'
import NginxConfig from '../models/NginxConfig'
import OneClickAppDefinitionResponse from '../models/OneClickAppDefinitionResponse'
import OneClickAppRepositories from '../models/OneClickAppRepositories'
import OneClickAppResponse from '../models/OneClickAppResponse'
import { ProjectDefinition } from '../models/ProjectDefinition'
import ProjectsResponse from '../models/ProjectsResponse'
import RegistriesResponse from '../models/RegistriesResponse'
import { ServerDockerInfo } from '../models/ServerDockerInfo'
import UnusedImagesResponse from '../models/UnusedImagesResponse'
import HttpClient from './HttpClient'

export type AuthenticationContent = {
    password: string
    otpToken?: string
}

export interface AuthenticationProvider {
    onAuthTokenRequested(): Promise<string>
    onCredentialsRequested(): Promise<AuthenticationContent>
    onAuthTokenUpdated(authToken: string): void
}

export class SimpleAuthenticationProvider implements AuthenticationProvider {
    private authToken: string = ''

    constructor(
        private onCredRequestedImpl: () => Promise<AuthenticationContent>
    ) {}

    onAuthTokenRequested(): Promise<string> {
        return Promise.resolve(this.authToken)
    }

    onCredentialsRequested(): Promise<AuthenticationContent> {
        return this.onCredRequestedImpl()
    }

    onAuthTokenUpdated(newAuthToken: string) {
        this.authToken = newAuthToken
    }
}

export default class ApiManager {
    private http: HttpClient

    constructor(
        baseDomain: string,
        private authProvider: AuthenticationProvider
    ) {
        const self = this
        const URL = baseDomain + '/api/v2'
        this.http = new HttpClient(
            URL,
            () => {
                return authProvider.onAuthTokenRequested()
            },
            () => {
                return Promise.resolve() //
                    .then(() => {
                        return authProvider.onCredentialsRequested()
                    })
                    .then((authContent) => {
                        return self.login(
                            authContent.password,
                            authContent.otpToken
                        )
                    })
            }
        )
    }

    destroy() {
        this.http.destroy()
    }

    login(password: string, otpToken?: string): Promise<void> {
        const self = this
        const http = self.http

        return Promise.resolve() //
            .then((authContent) => {
                return Promise.resolve() //
                    .then(
                        http.fetch(http.POST, '/login', {
                            password: password,
                            otpToken: otpToken,
                        })
                    )
            })
            .then(function (data) {
                return data.token
            })
            .then((authToken) => {
                self.authProvider.onAuthTokenUpdated(authToken)
            })
    }

    getAllThemes(): Promise<{ themes: CapRoverTheme[] | undefined }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/themes/all', {}))
    }

    getCurrentTheme(): Promise<{ theme: CapRoverTheme }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/theme/current', {}))
    }

    setCurrentTheme(themeName: string): Promise<{}> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/themes/setcurrent', {
                    themeName,
                })
            )
    }

    saveTheme(oldName: string, theme: CapRoverTheme): Promise<{}> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/themes/update', {
                    oldName,
                    name: theme.name,
                    content: theme.content,
                })
            )
    }

    deleteTheme(themeName: string): Promise<{}> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/themes/delete', {
                    themeName,
                })
            )
    }

    getProFeaturesState(): Promise<{ proFeaturesState: IProFeatures }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/pro/state', {}))
    }

    setProApiKey(apiKey: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.POST, '/user/pro/apikey', { apiKey: apiKey }))
    }

    getProConfigs(): Promise<{ proConfigs: IProConfig }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/pro/configs', {}))
    }

    setProConfigs(data: IProConfig): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/pro/configs', { proConfigs: data })
            )
    }

    getOtpStatus(): Promise<TwoFactorAuthResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/pro/otp', {}))
    }

    setOtpStatus(data: TwoFactorAuthRequest): Promise<TwoFactorAuthResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.POST, '/user/pro/otp', data))
    }

    getCaptainInfo(): Promise<CaptainInfo> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/info', {}))
    }

    updateRootDomain(rootDomain: string, force: boolean): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/changerootdomain', {
                    rootDomain,
                    force,
                })
            )
    }

    enableRootSsl(emailAddress: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/enablessl', {
                    emailAddress,
                })
            )
    }

    forceSsl(isEnabled: boolean): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.POST, '/user/system/forcessl', { isEnabled }))
    }

    getAllApps(): Promise<AppDefinitionsResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/apps/appDefinitions', {}))
    }

    getAllProjects(): Promise<ProjectsResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/projects', {}))
    }

    fetchBuildLogs(appName: string): Promise<BuildLogsResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, `/user/apps/appData/${appName}`, {}))
    }

    fetchAppLogsInHex(appName: string): Promise<LogsResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.GET,
                    `/user/apps/appData/${appName}/logs?encoding=hex`,
                    {}
                )
            )
    }

    uploadAppData(appName: string, file: File): Promise<void> {
        const http = this.http
        let formData = new FormData()
        formData.append('sourceFile', file)
        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appData/${appName}?detached=1`,
                    formData
                )
            )
    }

    registerProject(
        selectedProject: ProjectDefinition
    ): Promise<ProjectDefinition> {
        const http = this.http
        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/projects/register', {
                    ...selectedProject,
                })
            )
    }

    updateProject(project: ProjectDefinition): Promise<void> {
        const http = this.http
        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/projects/update', {
                    projectDefinition: project,
                })
            )
    }

    uploadCaptainDefinitionContent(
        appName: string,
        captainDefinition: ICaptainDefinition,
        gitHash: string,
        detached: boolean
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appData/${appName}${
                        detached ? '?detached=1' : ''
                    }`,
                    {
                        captainDefinitionContent:
                            JSON.stringify(captainDefinition),
                        gitHash,
                    }
                )
            )
    }

    updateConfigAndSave(
        appName: string,
        appDefinition: IAppDef
    ): Promise<void> {
        let instanceCount = appDefinition.instanceCount
        let captainDefinitionRelativeFilePath =
            appDefinition.captainDefinitionRelativeFilePath
        let envVars = appDefinition.envVars
        let notExposeAsWebApp = appDefinition.notExposeAsWebApp
        let forceSsl = appDefinition.forceSsl
        let websocketSupport = appDefinition.websocketSupport
        let volumes = appDefinition.volumes
        let ports = appDefinition.ports
        let nodeId = appDefinition.nodeId
        let appPushWebhook = appDefinition.appPushWebhook
        let customNginxConfig = appDefinition.customNginxConfig
        let preDeployFunction = appDefinition.preDeployFunction
        let serviceUpdateOverride = appDefinition.serviceUpdateOverride
        let containerHttpPort = appDefinition.containerHttpPort
        let description = appDefinition.description
        let httpAuth = appDefinition.httpAuth
        let appDeployTokenConfig = appDefinition.appDeployTokenConfig
        let tags = appDefinition.tags
        let redirectDomain = appDefinition.redirectDomain
        let projectId = appDefinition.projectId
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appDefinitions/update', {
                    appName: appName,
                    instanceCount: instanceCount,
                    captainDefinitionRelativeFilePath:
                        captainDefinitionRelativeFilePath,
                    notExposeAsWebApp: notExposeAsWebApp,
                    forceSsl: forceSsl,
                    websocketSupport: websocketSupport,
                    volumes: volumes,
                    ports: ports,
                    customNginxConfig: customNginxConfig,
                    appPushWebhook: appPushWebhook,
                    nodeId: nodeId,
                    preDeployFunction: preDeployFunction,
                    serviceUpdateOverride: serviceUpdateOverride,
                    containerHttpPort: containerHttpPort,
                    description: description,
                    httpAuth: httpAuth,
                    envVars: envVars,
                    appDeployTokenConfig: appDeployTokenConfig,
                    tags: tags,
                    redirectDomain: redirectDomain,
                    projectId: projectId,
                })
            )
    }

    renameApp(oldAppName: string, newAppName: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appDefinitions/rename', {
                    oldAppName,
                    newAppName,
                })
            )
    }

    registerNewApp(
        appName: string,
        projectId: string,
        hasPersistentData: boolean,
        detached: boolean
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appDefinitions/register${
                        detached ? '?detached=1' : ''
                    }`,
                    {
                        appName,
                        projectId,
                        hasPersistentData,
                    }
                )
            )
    }

    deleteApp(
        appName: string | undefined,
        volumes: string[],
        appNames: string[] | undefined
    ): Promise<AppDeleteResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appDefinitions/delete', {
                    appName,
                    volumes,
                    appNames,
                })
            )
    }

    deleteProjects(projectIds: string[]): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/projects/delete', {
                    projectIds,
                })
            )
    }

    enableSslForBaseDomain(appName: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/enablebasedomainssl',
                    {
                        appName,
                    }
                )
            )
    }

    attachNewCustomDomainToApp(
        appName: string,
        customDomain: string
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/customdomain',
                    {
                        appName,
                        customDomain,
                    }
                )
            )
    }

    enableSslForCustomDomain(
        appName: string,
        customDomain: string
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/enablecustomdomainssl',
                    {
                        appName,
                        customDomain,
                    }
                )
            )
    }

    removeCustomDomain(appName: string, customDomain: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/removecustomdomain',
                    {
                        appName,
                        customDomain,
                    }
                )
            )
    }

    getLoadBalancerInfo(): Promise<LoadBalancerInfo> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/loadbalancerinfo', {}))
    }

    getNetDataInfo(): Promise<NetDataInfo> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/netdata', {}))
    }

    updateNetDataInfo(netDataInfo: NetDataInfo): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/netdata', { netDataInfo })
            )
    }

    getGoAccessInfo(): Promise<IGoAccessInfo> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/goaccess', {}))
    }

    updateGoAccessInfo(goAccessInfo: GoAccessInfo): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/goaccess', { goAccessInfo })
            )
    }
    getGoAccessReports(appName: string): Promise<GoAccessReportResponse[]> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.GET,
                    `/user/system/goaccess/${appName}/files`,
                    {}
                )
            )
    }

    getGoAccessReport(reportUrl: string): Promise<string> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, reportUrl, {}))
    }

    changePass(oldPassword: string, newPassword: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/changepassword', {
                    oldPassword,
                    newPassword,
                })
            )
    }

    getVersionInfo(): Promise<IVersionInfo> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/versioninfo', {}))
    }

    createBackup(): Promise<{ downloadToken: string }> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/createbackup', {
                    postDownloadFileName: 'backup.tar',
                })
            )
    }

    performUpdate(latestVersion: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/versioninfo', {
                    latestVersion,
                })
            )
    }

    getNginxConfig(): Promise<NginxConfig> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/nginxconfig', {}))
    }

    setNginxConfig(customBase: string, customCaptain: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/nginxconfig', {
                    baseConfig: { customValue: customBase },
                    captainConfig: { customValue: customCaptain },
                })
            )
    }

    getUnusedImages(mostRecentLimit: number): Promise<UnusedImagesResponse> {
        const http = this.http
        return Promise.resolve() //
            .then(
                http.fetch(http.GET, '/user/apps/appDefinitions/unusedImages', {
                    mostRecentLimit: mostRecentLimit + '',
                })
            )
    }

    deleteImages(imageIds: string[]): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/deleteImages',
                    {
                        imageIds,
                    }
                )
            )
    }

    getDiskCleanUpSettings(): Promise<IAutomatedCleanupConfigs> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/diskcleanup', {}))
    }

    setDiskCleanUpSettings(
        mostRecentLimit: number,
        cronSchedule: string,
        timezone: string
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/diskcleanup', {
                    mostRecentLimit,
                    cronSchedule,
                    timezone,
                })
            )
    }

    getDockerRegistries(): Promise<RegistriesResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/registries', {}))
    }

    enableSelfHostedDockerRegistry(): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/system/selfhostregistry/enableregistry',
                    {}
                )
            )
    }

    disableSelfHostedDockerRegistry(): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/system/selfhostregistry/disableregistry',
                    {}
                )
            )
    }

    addDockerRegistry(dockerRegistry: IRegistryInfo): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/insert', {
                    ...dockerRegistry,
                })
            )
    }

    updateDockerRegistry(dockerRegistry: IRegistryInfo): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/update', {
                    ...dockerRegistry,
                })
            )
    }

    deleteDockerRegistry(registryId: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/delete', {
                    registryId,
                })
            )
    }

    setDefaultPushDockerRegistry(registryId: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/setpush', {
                    registryId,
                })
            )
    }

    forceBuild(webhookPath: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.POST, webhookPath, {}))
    }

    getAllNodes(): Promise<{ nodes: ServerDockerInfo[] }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/nodes', {}))
    }

    getAllOneClickApps(): Promise<OneClickAppResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/oneclick/template/list', {}))
    }

    getOneClickAppByName(
        appName: string,
        baseDomain: string
    ): Promise<OneClickAppDefinitionResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.GET, '/user/oneclick/template/app', {
                    appName,
                    baseDomain,
                })
            )
    }

    getAllOneClickAppRepos(): Promise<OneClickAppRepositories> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/oneclick/repositories', {}))
    }

    addNewCustomOneClickRepo(repositoryUrl: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/oneclick/repositories/insert', {
                    repositoryUrl,
                })
            )
    }

    deleteCustomOneClickRepo(repositoryUrl: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/oneclick/repositories/delete', {
                    repositoryUrl,
                })
            )
    }

    addDockerNode(
        nodeType: string,
        privateKey: string,
        remoteNodeIpAddress: string,
        sshPort: string,
        sshUser: string,
        captainIpAddress: string
    ): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/nodes', {
                    nodeType,
                    privateKey,
                    remoteNodeIpAddress,
                    sshPort,
                    sshUser,
                    captainIpAddress,
                })
            )
    }
}
