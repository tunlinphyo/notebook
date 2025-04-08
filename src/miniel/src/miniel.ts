export type PropertyGuard = {
    converter: (value: string) => any // used for runtime conversion
}

export type PropertyDefinition = Record<string, PropertyGuard>

export type PropertyChange<T extends PropertyDefinition> = {
    name: keyof T
    oldValue: ReturnType<T[keyof T]['converter']>
    newValue: ReturnType<T[keyof T]['converter']>
}

export abstract class MiniEl extends HTMLElement {
    protected renderRoot: ShadowRoot
    static styles?: CSSStyleSheet[]
    static properties?: PropertyDefinition

    static get observedAttributes(): string[] {
        return Object.keys(this.properties || {})
    }

    constructor() {
        super()
        this.renderRoot = this.attachShadow({ mode: 'open' })

        const ctor = this.constructor as typeof MiniEl
        if (ctor.styles?.length) {
            this.renderRoot.adoptedStyleSheets = ctor.styles
        }
        if (ctor.properties) {
            for (const [key, value] of Object.entries(ctor.properties)) {
                const data = this.getAttribute(key) || '';
                (this as any)[key] = value.converter(data)
            }
        }
    }

    connectedCallback(): void {
        this.initialRender()
        this.onConnect?.()
    }

    disconnectedCallback(): void {
        this.onDisconnect?.()
    }

    attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        const properties = (this.constructor as typeof MiniEl).properties
        if (
            properties && properties[name]
            && oldValue !== newValue
            && this.onPropertyChange
        ) {
            const guard = properties[name]
            this.onPropertyChange({
                name,
                oldValue: guard.converter(oldValue ?? ''),
                newValue: guard.converter(newValue ?? '')
            })
        }
    }

    private initialRender() {
        this.onBeforeRender?.()
        this.renderHTML()
        this.onAfterRender?.()
    }

    protected update(): void {
        this.beforeUpdate?.()
        this.renderHTML()
        this.afterUpdate?.()
    }

    protected abstract render(): Node | Node[]

    protected onPropertyChange?(property: PropertyChange<PropertyDefinition>): void
    protected beforeUpdate?(): void
    protected afterUpdate?(): void
    protected onConnect?(): void
    protected onDisconnect?(): void
    protected onBeforeRender?(): void
    protected onAfterRender?(): void

    private renderHTML() {
        this.renderRoot.innerHTML = ''
        const node = this.render()
        if (Array.isArray(node)) {
            for (const n of node) {
                this.renderRoot.appendChild(n)
            }
        } else {
            this.renderRoot.appendChild(node)
        }
    }
}