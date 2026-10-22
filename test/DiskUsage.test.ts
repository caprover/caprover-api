import type CapRoverAPI from '../dist'
import type { CapRoverModels } from '../dist'

declare const api: CapRoverAPI
const result: Promise<CapRoverModels.DiskUsageResponse> = api.getDiskUsage()
declare const response: Awaited<ReturnType<CapRoverAPI['getDiskUsage']>>

const coverage: 'captain-node' = response.coverage
const node: CapRoverModels.DiskUsageNode = response.nodes[0]
const disk: CapRoverModels.DiskUsageDisk = node.disks[0]
const severity: CapRoverModels.DiskUsageSeverity = disk.severity
const totalBytes: number = disk.totalBytes
const usedBytes: number = disk.usedBytes
const availableBytes: number = disk.availableBytes

// @ts-expect-error Only the Captain node is covered by this endpoint.
const clusterCoverage: typeof coverage = 'cluster'
// @ts-expect-error The backend defines a fixed set of severity values.
const unknownSeverity: typeof severity = 'unknown'

void [
    result,
    totalBytes,
    usedBytes,
    availableBytes,
    clusterCoverage,
    unknownSeverity,
]
