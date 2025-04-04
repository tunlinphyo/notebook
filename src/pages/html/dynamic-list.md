---
title: 'Reactive List'
author: 'Tun Lin Phyo'
layout: ../../layouts/Layout.astro
---

# Custom Element: DynamicList, DynamicListItem

### Usage

Simply updating the DynamicList.list = listData element is sufficient,
as it has the intelligence to determine which elements to update, remove, or reorder.

```html
<dynamic-list>
    <template>
        <dynamic-list-item data-bind-attr="title:name">
            <h4 data-bind-text="name"></h4>
            <div data-bind-attr="data-id:id">
                Email: <span data-bind-text="email"></span> |
                Age: <span data-bind-text="age"></span>
            </div>
            <div data-bind-attr="data-id:color.id" data-bind-text="color.name"></div>
            <div class="actions">
                <button data-button="delete">Delete</button>
                <button data-button="edit">Edit</button>
            </div>
        </dynamic-list-item>
    </template>
</dynamic-list>
```

Toggling the ‘sortable’ attribute to dynamic-element enables or disables sorting. The dynamic-list-item[sortable]
CSS selector can be used to update the item UI based on whether sorting is enabled.

```ts
import { DynamicList } from '@mini-element/elements/packages/elements'
import '@mini-element/elements'

type Item = {
    id: string
    name: string
    age: number
    email: string
    color?: {
        id: string
        name: string
    }
}

const list = document.querySelector<DynamicList<Item>>('dynamic-list')
let dataList: Item[] = [
    {
        id: '1',
        name: 'John Doe',
        age: 30,
        email: 'john@gmail.com',
        color: {
            id: 'one',
            name: 'Red'
        }
    },
    {
        id: '2',
        name: 'Jane Smith',
        age: 25,
        email: 'jane@gmail.com',
        color: {
            id: 'one',
            name: 'Red'
        }
    },
    {
        id: '3',
        name: 'Alice Johnson',
        age: 28,
        email: 'alice@gmail.com',
        color: {
            id: 'two',
            name: 'Blue'
        }
    },
    {
        id: '4',
        name: 'Bob Brown',
        age: 35,
        email: 'bob@gmail.com',
        color: {
            id: 'three',
            name: 'Green'
        }
    }
]
list.list = dataList
```

### Code
types.ts
```ts
export type WithId = { id: string } & Record<string, any>
```
utils.ts
```ts
export function deepEqual(a: any, b: any): boolean {
    if (a === b) return true;

    if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null)
        return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
        if (!keysB.includes(key) || !deepEqual(a[key], b[key])) return false;
    }

    return true;
}
```
data-bind.ts
```ts
import { deepEqual } from "@mini-element/utils";

export function getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function updateBindings(
    root: HTMLElement,
    newData: Record<string, any>,
    oldData?: Record<string, any>
) {
    // Update root itself if it has data-bind-attr
    if (root.hasAttribute('data-bind-attr')) {
        attributeBinding(root, newData, oldData);
    }

    // TreeWalker for children
    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode(node) {
                const el = node as Element;
                if (el.hasAttribute('scoped')) {
                    return NodeFilter.FILTER_REJECT; // skip subtrees
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let node: Element | null = walker.nextNode() as Element;
    while (node) {
        if (node.hasAttribute('data-bind-text')) {
            const key = node.getAttribute('data-bind-text');
            if (key) {
                const newVal = getValueByPath(newData, key);
                const oldVal = getValueByPath(oldData, key);
                if (!deepEqual(newVal, oldVal)) {
                    node.textContent = getValue(newVal);
                }
            }
        }

        if (
            node instanceof HTMLInputElement ||
            node instanceof HTMLSelectElement ||
            node instanceof HTMLTextAreaElement
        ) {
            const key = node.getAttribute('data-bind');
            if (key) {
                const newVal = getValueByPath(newData, key);
                const oldVal = getValueByPath(oldData, key);
                if (!deepEqual(newVal, oldVal)) {
                    node.value = getValue(newVal);
                }
            }
        }

        if (node.hasAttribute('data-bind-attr')) {
            attributeBinding(node, newData, oldData);
        }

        node = walker.nextNode() as Element;
    }
}

function attributeBinding(
    node: Element,
    newData: Record<string, any>,
    oldData?: Record<string, any>
) {
    const bindings = node.getAttribute('data-bind-attr')?.split(';') || [];
    bindings.forEach(binding => {
        const [attr, key] = binding.split(':');
        if (!attr || !key) return;

        const attrName = attr.trim();
        const path = key.trim();
        const newVal = getValueByPath(newData, path);
        const oldVal = getValueByPath(oldData, path);
        if (!deepEqual(newVal, oldVal)) {
            node?.setAttribute(attrName, getValue(newVal));
        }
    });
}

function getValue(value: any) {
    if (value instanceof Boolean) {
        return String(value);
    } else if (Array.isArray(value)) {
        return value.join(', ');
    } else {
        return String(value) ?? '';
    }
};
```
dynamic-list.ts
```ts
import { deepEqual } from "@mini-element/utils"
import { SortableDirective } from "@mini-element/directives/sortable"
import { DynamicListItem } from "./dynamic-list-item"
import { WithId } from "./types"

export class DynamicList<T extends WithId> extends HTMLElement {
    private _list: T[] = []
    private template?: HTMLTemplateElement
    private sortable?: SortableDirective

    constructor() {
        super()
    }

    get list() {
        return this._list
    }

    set list(newList: T[]) {
        const oldMap = new Map(this._list.map(item => [item.id, item]))
        const newMap = new Map(newList.map(item => [item.id, item]))

        for (const item of newList) {
            if (oldMap.has(item.id)) {
                this._updateItem(item)
            } else {
                this._createItem(item)
            }
        }

        for (const item of this._list) {
            if (!newMap.has(item.id)) {
                this._removeItem(item.id)
            }
        }

        // Reorder <li> wrappers
        for (let i = 0; i < newList.length; i++) {
            const expectedId = newList[i].id
            const currentLi = this.children[i] as HTMLLIElement
            if (!currentLi || currentLi.dataset.id !== expectedId) {
                const correctLi = this.querySelector(`li[data-id="${expectedId}"]`)
                if (correctLi) {
                    this.insertBefore(correctLi, currentLi || null)
                }
            }
        }

        this._list = [...newList]
    }

    connectedCallback(): void {
        this.setAttribute('role', 'list')
        this.setAttribute('aria-label', 'Dynamic List')
        this.setAttribute('aria-live', 'polite')
        this.setAttribute('aria-relevant', 'additions removals')
        this.setAttribute('aria-atomic', 'true')

        const tmpl = this.querySelector('template')
        if (tmpl && tmpl instanceof HTMLTemplateElement) {
            this.template = tmpl
        }

        for (const item of this._list) {
            this._createItem(item)
        }

        if (!this.sortable) {
            this.sortable = new SortableDirective(this)
        }
    }

    private _createItem(data: T) {
        if (!this.template) return

        const clone = this.template.content.firstElementChild?.cloneNode(true) as DynamicListItem<T>
        if (!clone) return

        const li = document.createElement('li')
        li.setAttribute('role', 'listitem')
        li.setAttribute('data-id', data.id)
        li.appendChild(clone)
        this.appendChild(li)

        this._setItemData(clone, data)
    }

    private _updateItem(data: T) {
        const li = this.querySelector(`li[data-id="${data.id}"]`)
        const elem = li?.firstElementChild as DynamicListItem<T> | null
        if (!elem) return
        this._setItemData(elem, data)
    }

    private _removeItem(id: string) {
        const li = this.querySelector(`li[data-id="${id}"]`)
        li?.remove()
    }

    private _setItemData(elem: DynamicListItem<T>, data: T) {
        if (deepEqual(elem.data, data)) return
        elem.data = data
    }
}

customElements.define('dynamic-list', DynamicList)
```
dynamic-list-item.ts
```ts
import { deepEqual } from "@mini-element/utils"
import { updateBindings } from "./data-bind"
import { WithId } from "./types"

export class DynamicListItem<T extends WithId> extends HTMLElement {
    protected renderRoot: ShadowRoot
    private _data: T = {} as T

    get data(): T {
        return { ...this._data }
    }

    set data(value: T) {
        if (deepEqual(this._data, value)) return
        updateBindings(this, value, this.data) // apply data bindings directly to this element
        this._data = value
    }

    constructor() {
        super()
        this.renderRoot = this.attachShadow({ mode: 'open' })
        this._onClick = this._onClick.bind(this)

        const style = document.createElement('style')
        style.innerHTML = `
            :host {
                display: block;
            }
        `
        const slot = document.createElement('slot')
        this.renderRoot.appendChild(style)
        this.renderRoot.appendChild(slot)
    }

    connectedCallback(): void {
        this.addEventListener('click', this._onClick)
    }

    disconnectedCallback() {
        this.removeEventListener('click', this._onClick)
    }

    private _onClick(e: Event): void {
        const target = e.target as HTMLElement
        if (target.hasAttribute('data-button')) {
            this.dispatchEvent(new CustomEvent('item-click', {
                detail: {
                    id: this._data.id,
                    data: this._data,
                    dataset: target.dataset
                },
                bubbles: true,
                composed: true
            }))
        }
    }
}

customElements.define('dynamic-list-item', DynamicListItem)
```
