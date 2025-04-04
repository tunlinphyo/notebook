---
title: 'Form Debug'
author: 'Tun Lin Phyo'
layout: ../../layouts/Layout.astro
---

# Custom Element: From Debug

### Usage in HTML
```html
<reactive-form>
    <div>
        <input type="text" name="name" placeholder="Name" />
        <input type="email" name="email" placeholder="Email" />
        <input type="text" name="address" placeholder="Address" />
    </div>
    <form-debug>
        <div>Name: <span data-bind-text="name"></span></div>
        <div>Email: <span data-bind-text="email"></span></div>
        <div>Address: <span data-bind-text="address"></span></div>
    </form-debug>
</reactive-form>
```

### Code
```ts
import { css, html, MiniEl } from "@mini-element"
import { formContext, updateBindings } from "@mini-element/elements"
import { ContextConsumer } from "@mini-element/context"

const hostStyle = css`
    :host {
        display: grid;
        padding: 1rem;
        background: rgba(128, 128, 128, 0.3);
        background-blend-mode: luminosity;
        backdrop-filter: blur(50px);
        border-radius: 24px;

        h4 {
            margin: 0;
        }
    }
`

export class FormDebug extends MiniEl {
    private consumer!: ContextConsumer<Record<string, any>>

    static styles = [ hostStyle ]

    constructor() {
        super()
        this.consumer = new ContextConsumer(this, formContext)
        this.consumer.subscribe((form, oldForm) => {
            updateBindings(this, form, oldForm)
        })
    }

    protected onDisconnect() {
        this.consumer.unsubscribe()
    }

    protected render() {
        return html`
            <h4>Form Data</h4>
            <slot></slot>
        `
    }
}

customElements.define('form-debug', FormDebug)
```