export type WithRouter = HTMLElement & {
    get router(): Router | undefined
    set router(value: Router)
}

export type Route = {
    url: string
    name: string
    onEnter: (url: string, name: string) => void
    onLeave?: (url: string, name: string) => void
    children?: Route[]
}

export class Router {
    private routes: Route[] = []
    private routeMap: Map<string, Route> = new Map()
    private currentChain: Route[] = []

    constructor(routes: Route[]) {
        this.routes = routes
        this.buildRouteMap(routes)
        window.addEventListener('popstate', () => this.handlePopState())
        this.handlePopState() // Initial load
    }

    navigateTo(url: string) {
        if (window.location.pathname !== url) {
            history.pushState({}, '', url)
            this.transitionTo(url)
        }
    }

    getCurrentRoute(): Route | null {
        return this.currentChain[this.currentChain.length - 1] || null
    }

    private buildRouteMap(routes: Route[], parentUrl: string = '') {
        for (const route of routes) {
            const fullUrl = parentUrl + route.url
            this.routeMap.set(fullUrl, { ...route, url: fullUrl })
            if (route.children?.length) {
                this.buildRouteMap(route.children, fullUrl)
            }
        }
    }

    private transitionTo(path: string, isFirstLoad = false) {
        const newChain = this.resolveRouteChain(path)
        if (!newChain.length) {
            console.warn(`Route not found: ${path}`)
            return
        }

        const oldChain = this.currentChain
        const leaveRoutes = oldChain.filter(route => !newChain.includes(route)).reverse()
        const enterRoutes = newChain.filter(route => !oldChain.includes(route))

        for (const route of leaveRoutes) {
            route.onLeave?.(route.url, route.name)
        }

        for (const route of enterRoutes) {
            route.onEnter(route.url, route.name)
        }

        if (isFirstLoad && oldChain.length === 0 && newChain.length > 0 && enterRoutes.length === 0) {
            const lastRoute = newChain[newChain.length - 1]
            lastRoute.onEnter(lastRoute.url, lastRoute.name)
        }

        this.currentChain = newChain
    }

    private handlePopState() {
        const path = window.location.pathname
        this.transitionTo(path, true)
    }

    private resolveRouteChain(path: string): Route[] {
        const chain: Route[] = []

        if (path === '/') {
            const rootRoute = this.routeMap.get('/')
            if (rootRoute) chain.push(rootRoute)
            return chain
        }

        const segments = path.split('/').filter(Boolean)
        let currentRoutes = this.routes
        let currentPath = ''

        for (const segment of segments) {
            const nextPath = currentPath + '/' + segment
            const match = currentRoutes.find(r => (currentPath + r.url) === nextPath)
            if (!match) break

            currentPath += match.url
            const fullRoute = this.routeMap.get(currentPath)
            if (fullRoute) {
                chain.push(fullRoute)
            }

            currentRoutes = match.children ?? []
        }

        return chain
    }
}