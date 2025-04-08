import { ContextProvider, createContext } from "../context"
import { extractDataFromBindings, setValueByPath } from "../utils/data-extract"
import { updateBindings, getValueByPath } from "../utils/data-bind"
import { deepMerge } from "../utils"

type DataType = Record<string, unknown>

export const reactiveContext = createContext<DataType>('reactive-context')

export class ReactiveDirective {
    private data: DataType = {}
    private provider!: ContextProvider<DataType>
    private scoped: boolean = true

    constructor(private host: HTMLElement, callback?: (data: DataType) => void) {
        this.scoped = host.hasAttribute('scoped')
        this.data = extractDataFromBindings(host)

        this.provider = new ContextProvider(host, reactiveContext, {
            initial: this.data
        })

        this.provider.subscribe(host, value => {
            if (callback) callback(value)
        })

        this.onClick = this.onClick.bind(this)

        this.listeners()
    }

    listeners() {
        this.host.addEventListener('click', this.onClick)
    }

    private onClick(e: Event) {
        if (this.scoped) e.stopPropagation()
        const target = e.target as HTMLElement
        if (target.hasAttribute('data-button')) {
            if (target.dataset.button === 'toggle') {
                target.dataset.toggle = target.dataset.toggle === 'on' ? 'off' : 'on'
                this.toggle(target.dataset, target.dataset.toggle === 'on')
            }
            if (target.dataset.button === 'context') {
                this.setContaxt(target)
            }
        }
    }

    private setContaxt(target: HTMLElement) {
        if (target.dataset.context) {
            const context = target.dataset.context
            const [property, values] = context.split(':')
            const list = values.split('|')
            const value = getValueByPath(this.provider.value, property)
            let index = list.indexOf(value)
            index += 1
            if (index >= list.length) index = 0

            const data: Record<string, any> = {}
            setValueByPath(data, property, list[index] || '')

            const oldData = { ...this.provider.value }
            const newData = deepMerge(this.provider.value, data)
            updateBindings(this.host, newData, oldData)
            this.provider.setValue(newData)
        }
    }

    private toggle(dataset: DOMStringMap, isOn: boolean) {
        if (!dataset.target) return
        const elems = this.host.querySelectorAll<HTMLElement>(`[data-toggle-target=${dataset.target}]`)

        for(const elem of elems) {
            if (elem.dataset.style) {
                const style = elem.dataset.style
                const [property, values] = style.split(':')
                const [on, off] = values?.split('|') || []

                if (!property || on === undefined || off === undefined) continue

                if (property in elem.style) {
                    elem.style[property as any] = isOn ? on : off
                }
            }
            if (elem.dataset.attr) {
                elem.dataset.attr = dataset.toggle
            }
        }
    }

    destroy() {
        this.host.removeEventListener('click', this.onClick)
        this.provider.unsubscribe(this.host)
    }
}