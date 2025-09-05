export default interface OneClickAppDeploymentState {
    steps: string[]
    error?: string
    successMessage?: string
    currentStep: number
}
