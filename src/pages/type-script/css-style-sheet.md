---
title: 'CSSStyleSheet'
author: 'Tun Lin Phyo'
layout: ../../layouts/Layout.astro
---

# CSSStyleSheet

```js
let stylesheet = new CSSStyleSheet({ media: "print" });
console.log(stylesheet.media);
```

### Sharing stylesheets with a shadow DOM
```js
// Create an element in the document and then create a shadow root:
const node = document.createElement("div");
const shadow = node.attachShadow({ mode: "open" });

//Adopt the sheet into the shadow DOM
shadow.adoptedStyleSheets = [sheet];
```

### With Custom Element
```ts
export function css(strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet {
    const cssString = strings.reduce((acc, str, i) => {
        const val = values[i];
        const serialized = val == null ? '' : String(val);
        return acc + str + serialized;
    }, '');

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssString);

    return sheet;
}
```

Custom Element
```ts
export abstract class MiniEl extends HTMLElement {
    static states?: State<any>;

    constructor() {
        super();
        this.renderRoot = this.attachShadow({ mode: 'open' });

        const ctor = this.constructor as typeof MiniEl;
        if (ctor.styles?.length) {
            this.renderRoot.adoptedStyleSheets = ctor.styles;
        }
    }
}
```

Usage
```ts
import { css, MiniEl } from './mini-element'

const hostStyle = css`
    :host {
        display: block;
    }
    ::slotted(.flex) {
        justify-content: flex-start;
        align-items: center;
        gap: 1rem;
    }
`

export class CustomElement extends MiniEl {
    static styles = [ hostStyle ];

    constructor() {
        super();
    }
}

customElements.define('custom-element', CustomElement);
```