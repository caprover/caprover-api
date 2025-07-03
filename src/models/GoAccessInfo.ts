export interface GoAccessInfo {
    isEnabled: boolean
    data: {
        rotationFrequencyCron: string
        logRetentionDays: number
    }
}
