export default interface LoadBalancerInfo {
    activeConnections: number

    accepted: number
    handled: number
    total: number

    reading: number
    writing: number
    waiting: number
}
