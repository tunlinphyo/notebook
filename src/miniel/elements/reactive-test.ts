import { css, html, MiniEl } from "..";
import { ReactiveDirective } from "../directives";

const hostStyle = css`
    :host {
        display: block;
    }
`

export class ReactiveTest extends MiniEl {
    private reactive?: ReactiveDirective

    static styles = [ hostStyle ]

    constructor() {
        super()
        this.reactive = new ReactiveDirective(this, (value) => {
            console.log(value)
        })
    }

    protected onConnect(): void {

    }

    protected onDisconnect(): void {
        this.reactive = undefined
    }

    protected render() {
        return html`<slot></slot>`
    }
}

customElements.define('reactive-test', ReactiveTest)