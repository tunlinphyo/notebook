import { css, html, MiniEl } from ".."
import { ContextConsumer } from "../context"
import { reactiveContext } from "../directives"

const hostStyle = css`
    :host {
        display: block;
        background-color: Canvas;
        border-radius: .5rem;
        padding: 1rem;
        margin-block: .5rem;
    }
`

export class JdonDebug extends MiniEl {
    private consumer!: ContextConsumer<Record<string, any>>
    private data:Record<string, any> = {}

    static styles = [ hostStyle ]

    constructor() {
        super()
        this.consumer = new ContextConsumer(this, reactiveContext)
    }

    protected onConnect() {
        this.consumer.subscribe((data) => {
            this.data = data
            this.update()
        })
    }

    protected onDisconnect() {
        this.consumer.unsubscribe()
    }

    protected render() {
        return html`<pre>${JSON.stringify(this.data, null, 2)}</pre>`
    }
}

customElements.define('json-debug', JdonDebug)