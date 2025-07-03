export interface BuildLogsResponse {
    isAppBuilding: boolean
    logs: { lines: string[]; firstLineNumber: number }
    isBuildFailed: boolean
}
