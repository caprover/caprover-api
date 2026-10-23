import type CapRoverAPI from '../dist'
import { CapRoverModels } from '../dist'

declare const api: CapRoverAPI
const collection: Promise<CapRoverModels.AppsRuntimeResponse> =
    api.getAppsRuntime()
const details: Promise<CapRoverModels.AppRuntimeDetails> =
    api.getAppRuntime('website')
declare const response: Awaited<ReturnType<CapRoverAPI['getAppsRuntime']>>
declare const detail: Awaited<ReturnType<CapRoverAPI['getAppRuntime']>>

const app: CapRoverModels.AppRuntime = response.apps[0]
const task: CapRoverModels.RuntimeTask = detail.currentTasks[0]
const history: CapRoverModels.RuntimeTask[] = detail.taskHistory
const failure: CapRoverModels.RuntimeFailure | null = detail.latestFailure
const state: CapRoverModels.TaskState = task.state
const desiredState: CapRoverModels.TaskState = task.desiredState
const status: CapRoverModels.AppRuntimeStatus = app.status

const unavailable: CapRoverModels.AppRuntimeDetails = {
    appName: 'missing',
    status: CapRoverModels.AppRuntimeStatus.Unavailable,
    desiredInstances: null,
    runningInstances: null,
    currentTasks: [],
    latestFailure: null,
    error: 'Service not found',
    taskHistory: [],
}

// @ts-expect-error Task history is only returned by the single-app endpoint.
const collectionHistory = app.taskHistory
// @ts-expect-error Runtime counts can be null when collection fails.
const definiteCount: number = app.runningInstances
// @ts-expect-error The backend defines a fixed set of runtime statuses.
const unknownStatus: CapRoverModels.AppRuntimeStatus = 'unknown'
// @ts-expect-error The backend defines a fixed set of task states.
const unknownState: CapRoverModels.TaskState = 'unknown'

void [
    collection,
    details,
    history,
    failure,
    state,
    desiredState,
    status,
    unavailable,
    collectionHistory,
    definiteCount,
    unknownStatus,
    unknownState,
]
