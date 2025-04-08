import { serialize } from "../utils"

export class RawHTML {
    constructor(public readonly value: string) {}
}

export function raw(value: string): RawHTML {
    return new RawHTML(value)
}

export function html(strings: TemplateStringsArray, ...values: any[]): Node {
    const template = document.createElement('template')
    const htmlString = strings.reduce((acc, str, i) => {
        const val = values[i];
        if (val instanceof RawHTML) {
            return acc + str + val.value
        } else {
            return acc + str + serialize(val)
        }
    }, '')

    template.innerHTML = htmlString
    return template.content.cloneNode(true)
}