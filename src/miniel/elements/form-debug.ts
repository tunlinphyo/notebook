import { css, html, MiniEl } from ".."
import { formContext, updateBindings } from "."
import { ContextConsumer } from "../context"

const hostStyle = css`
    :host {
        display: grid;
        padding: 1rem;
        background: light-dark(#fff, #333);
        background-blend-mode: luminosity;
        backdrop-filter: blur(50px);
        border-radius: 2px;

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