---
title: 'ReactiveDirective'
author: 'Tun Lin Phyo'
layout: ../../layouts/Layout.astro
---

# ReactiveDirective

### Usage in HTML
```html
<reactive-test>
    <button data-button="toggle" data-toggle="on" data-target="outie">TOGGLE</button>
    <div data-toggle-target="outie" data-style="height:auto|0">Hello Wolrd!</div>
    <div data-toggle-target="outie" data-attr="on">Hello Wolrd! Again!</div>
    <div class="actions">
        <button data-button="context" data-context="outie.page:one|two|three">CONTEXT</button>
        <button data-button="context" data-context="outie.page:one">ONE</button>
        <button data-button="context" data-context="outie.page:two">TWO</button>
        <button data-button="context" data-context="outie.page:three">THREE</button>
    </div>
    <div class="actions">
        <button data-button="context" data-context="outie.test:one|two|three">CONTEXT</button>
        <button data-button="context" data-context="outie.test:one">ONE</button>
        <button data-button="context" data-context="outie.test:two">TWO</button>
        <button data-button="context" data-context="outie.test:three">THREE</button>
    </div>
    <div>
        <div>
            Page: <span data-bind-text="outie.page"></span>
        </div>
        <div>
            Test: <span data-bind-text="outie.test"></span>
        </div>
    </div>
    <reactive-test scoped>
        <button data-button="toggle" data-toggle="on" data-target="innie">TOGGLE</button>
        <div data-toggle-target="innie" data-style="display:block|none">Hello Wolrd!</div>
        <div data-toggle-target="innie" data-attr="on">Hello Wolrd! Again!</div>
        <div class="actions">
            <button data-button="context" data-context="innie.page:one|two|three">CONTEXT</button>
            <button data-button="context" data-context="innie.page:one">ONE</button>
            <button data-button="context" data-context="innie.page:two">TWO</button>
            <button data-button="context" data-context="innie.page:three">THREE</button>
        </div>
        <div class="actions">
            <button data-button="context" data-context="innie.test:one|two|three">CONTEXT</button>
            <button data-button="context" data-context="innie.test:one">ONE</button>
            <button data-button="context" data-context="innie.test:two">TWO</button>
            <button data-button="context" data-context="innie.test:three">THREE</button>
        </div>
        <div>
            <div>
                Page: <span data-bind-text="innie.page"></span>
            </div>
            <div>
                Test: <span data-bind-text="innie.test"></span>
            </div>
        </div>
    </reactive-test>
</reactive-test>
```

### Custom Element: ReactiveTest
```ts
import { html, MiniEl } from "@mini-element"
import { ReactiveDirective } from "@mini-element/elements/directives"

export class ReactiveTest extends MiniEl {
    private reactive?: ReactiveDirective

    constructor() {
        super()
        this.reactive = new ReactiveDirective(this, (value) => {
            console.log(value)
        })
    }

    protected onDisconnect() {
        this.reactive.distory()
    }

    protected render() {
        return html`<slot></slot>`
    }
}

customElements.define('reactive-test', ReactiveTest)
```

### Code

```ts
import { ContextProvider, createContext } from "@mini-element/context";
import { updateBindings } from "@mini-element/elements";
import { deepMerge } from "@mini-element/utils";
import { extractDataFromBindings, setValueByPath } from "./data-extract";
import { getValueByPath } from './data-bind';

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
            callback?.(value)
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

            const data: Record<string, any> = {};
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
        this.provider = null
        this.host.removeEventListener('click', this.onClick)
    }
}
```