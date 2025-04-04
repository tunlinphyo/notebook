---
title: 'Reactive Form'
author: 'Tun Lin Phyo'
layout: ../../layouts/Layout.astro
---

# Custom Element: ReactiveFrom

### Usage in HTML
```html
<reactive-form>
    <div>
        <input type="text" name="name" placeholder="Name" />
        <input type="email" name="email" placeholder="Email" />
        <input type="text" name="address" placeholder="Address" />
    </div>
    <select name="select">
        <option value="" selected>Select</option>
        <option value="one">One</option>
        <option value="two">Two</option>
        <option value="three">Three</option>
        <option value="four">Four</option>
    </select>
    <div>
        <label>
            <input type="radio" name="gender" value="male"> Male
        </label>
        <label>
            <input type="radio" name="gender" value="female">Female
        </label>
        <label>
            <input type="radio" name="gender" value="other"> Other
        </label>
    </div>
    <div>
        <label>
            <input type="checkbox" name="job" value="doctor"> Doctor
        </label>
        <label>
            <input type="checkbox" name="job" value="engineer">Engineer
        </label>
        <label>
            <input type="checkbox" name="job" value="teacher"> Teacher
        </label>
    </div>
    <div>
        <textarea name="textarea"></textarea>
    </div>
    <button type="submit">button</button>
    <form-debug>
        <div>Name: <span data-bind-text="name"></span></div>
        <div>Email: <span data-bind-text="email"></span></div>
        <div>Address: <span data-bind-text="address"></span></div>
        <div>Select: <span data-bind-text="select"></span></div>
        <div>Gender: <span data-bind-text="gender"></span></div>
        <div>Job: <span data-bind-text="job"></span></div>
        <div>Textarea: <span data-bind-text="textarea"></span></div>
    </form-debug>
</reactive-form>
```

```ts
imoprt { ReactiveForm } from '@mini-element/elements'
import '@mini-element/elements'

const reactiveForm = document.querySelector<ReactiveForm>('reactive-form')
reactiveForm.setFormData({...})
reactiveForm.addEventListener('submit', () => {
    if (!reactiveForm.getAttribute('dirty')) return

    const data = reactiveForm.getFormData()
    console.log("DATA", data)
})
```

### Code
form-utils.ts
```ts
export type TypedValue = string | number | boolean | null | string[]
export type FormDataType = Record<string, TypedValue>

export function collectInitialFormData(form: HTMLElement): FormDataType {
    const data: FormDataType = {}

    const elements = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        'input[name], select[name], textarea[name]'
    )

    // Track radio groups
    const radioGroups = new Set<string>()

    elements.forEach((el) => {
        const name = el.name
        if (!name) return

        const value = parseFormValue(el)

        if (el instanceof HTMLInputElement && el.type === 'radio') {
            radioGroups.add(name)
            if (!el.checked) return // only take checked radio
        }

        if (value !== null) {
            const existing = data[name]
            if (Array.isArray(existing) && Array.isArray(value)) {
                const list = new Set([...existing, ...value])
                data[name] = Array.from(list)
            } else {
                data[name] = value
            }
        }
    })

    // Add empty string for unchecked radio groups
    radioGroups.forEach((name) => {
        if (!(name in data)) {
            data[name] = ''
        }
    })

    return data
}

export function setFormValues(form: HTMLElement, initData: FormDataType) {
    const elements = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[name]')
    elements.forEach((el) => {
        const val = initData[el.name]
        if (val !== undefined) {
            serializeFormValue(el, val)
        }
    })
}

export function resetFormValues(form: HTMLElement) {
    const elements = form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[name]')
    elements.forEach((el) => {
        serializeFormValue(el, "")
    })
}

export function parseFormValue(
    el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
    root?: HTMLElement
): TypedValue {
    if (el instanceof HTMLSelectElement && el.multiple) {
        return Array.from(el.selectedOptions).map(o => o.value)
    }

    if (el instanceof HTMLInputElement) {
        if (el.type === 'checkbox') {
            if (!el.name) return null

            // Check for multiple checkboxes with the same name
            const group = (root || el.ownerDocument).querySelectorAll<HTMLInputElement>(
                `input[type="checkbox"][name="${el.name}"]`
            )

            if (group.length > 1) {
                return Array.from(group)
                    .filter(input => input.checked)
                    .map(input => input.value)
            } else {
                return el.checked
            }
        }

        if (el.type === 'radio') {
            return el.checked ? el.value : null
        }

        if (el.type === 'number') {
            return isNaN(Number(el.value)) ? null : Number(el.value)
        }

        return el.value
    }

    return el.value
}

export function serializeFormValue(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: TypedValue): void {
    if (el instanceof HTMLSelectElement && el.multiple && Array.isArray(value)) {
        if (value.every(v => typeof v === 'string')) {
            const options = Array.from(el.options)
            for (const option of options) {
                option.selected = value.includes(option.value)
            }
        }
        return
    }
    if (el instanceof HTMLInputElement) {
        switch (el.type) {
            case 'checkbox':
                el.checked = Array.isArray(value) ? value.includes(el.value) : Boolean(value)
                return
            case 'radio':
                el.checked = el.value === value
                return
            case 'number':
                el.value = value != null ? String(value) : ''
                return
            default:
                el.value = value != null ? String(value) : ''
                return
        }
    }
    el.value = value != null ? String(value) : ''
}
```
reactive-form.ts
```ts
import { ContextProvider, createContext } from "@context"
import {
    collectInitialFormData,
    FormDataType,
    parseFormValue,
    resetFormValues,
    setFormValues
} from "./form-utils"

export const formContext = createContext<FormDataType>('form-context')

export class ReactiveForm extends HTMLElement {
    private provider!: ContextProvider<FormDataType>
    private formData: FormDataType = {}
    private initData: FormDataType = {}

    private boundOnInput = this._onInput.bind(this)
    private boundOnClick = this._onClick.bind(this)
    private boundOnKeydown = this._onKeydown.bind(this)

    get dirty(): boolean {
        return !this._isEqual(this.formData, this.initData)
    }

    get data() {
        return this.formData
    }
    set data(formData: FormDataType) {
        // updateBindings(this, formData, this.formData)
        this.initData = { ...formData }
        this.formData = { ...formData }
        this.provider.setValue(formData)
        setFormValues(this, this.initData)
        this._updateDirtyAttribute()
    }

    setFormData(formData: FormDataType) {
        this.data = formData
    }

    getFormData(): FormDataType {
        return this.formData
    }

    submit(): void {
        const event = new Event('submit', { bubbles: true, cancelable: true })
        this.dispatchEvent(event)
    }

    reset() {
        const event = new Event('reset', { bubbles: true, cancelable: true })
        if (this.dispatchEvent(event)) {
            this.data = this.initData
        }
    }

    clear() {
        this.initData = {}
        this.formData = {}
        this.provider.setValue(this.formData)
        resetFormValues(this)
        this._updateDirtyAttribute()
    }

    connectedCallback(): void {
        this.setAttribute('role', 'form') // for accessibility
        this.setAttribute('aria-labelledby', this.getAttribute('aria-labelledby') || '')
        // this.tabIndex = 0

        this.formData = collectInitialFormData(this)
        this.initData = { ...this.formData }

        this.provider = new ContextProvider(this, formContext, {
            initial: this.formData
        })

        this.addEventListener('input', this.boundOnInput, true)
        // this.addEventListener('change', this.boundOnInput, true)
        this.addEventListener('click', this.boundOnClick, true)
        this.addEventListener('keydown', this.boundOnKeydown, true)
    }

    disconnectedCallback() {
        this.removeEventListener('input', this.boundOnInput, true)
        // this.removeEventListener('change', this.boundOnInput, true)
        this.removeEventListener('click', this.boundOnClick, true)
        this.removeEventListener('keydown', this.boundOnKeydown, true)
    }

    private _onInput(e: Event): void {
        const el = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        const name = el.name
        if (!name) return

        const value = parseFormValue(el)
        if (value === null) return

        this.formData = { ...this.formData, [name]: value }
        this.provider.setValue(this.formData)
        this._updateDirtyAttribute()
    }

    private _onClick(e: MouseEvent): void {
        const target = e.target as HTMLElement
        if (target instanceof HTMLButtonElement) {
            if (target.type === 'submit') {
                this.submit()
            } else if (target.type === 'reset') {
                this.reset()
            }
        }
    }

    private _onKeydown(e: KeyboardEvent): void {
        if (e.key === 'Enter') {
            const active = document.activeElement as HTMLElement
            if (active?.tagName === 'TEXTAREA') return // ignore multiline
            if (this.contains(active)) {
                this.submit()
            }
        }
    }

    private _updateDirtyAttribute(): void {
        const isDirty = this.dirty
        if (isDirty) {
          this.setAttribute('dirty', 'true')
        } else {
          this.removeAttribute('dirty')
        }
    }

    private _isEqual(a: FormDataType, b: FormDataType): boolean {
        const aKeys = Object.keys(a)
        const bKeys = Object.keys(b)
        if (aKeys.length !== bKeys.length) return false

        return aKeys.every(key => {
            const aVal = a[key]
            const bVal = b[key]
            if (Array.isArray(aVal) && Array.isArray(bVal)) {
                return aVal.length === bVal.length && aVal.every((v, i) => v === bVal[i])
            }
            return aVal === bVal
        })
    }
}

customElements.define('reactive-form', ReactiveForm)
```