
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

export function serialize(value: any): string {
    if (value == null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(target: T, source: U): T & U {
    const result: Record<string, any> = { ...target };

    for (const key in source) {
        if (
            Object.prototype.hasOwnProperty.call(source, key) &&
            typeof source[key] === 'object' &&
            source[key] !== null &&
            !Array.isArray(source[key])
        ) {
            result[key] = deepMerge(result[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }

    return result as T & U;
}

export function queryBindElements<T extends HTMLElement>(root: Element, attrName: string, attrValue?: string): T[] {
    const results: T[] = [];
    // const selfTagName = root.tagName

    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode(node) {
                const el = node as Element;

                // Skip nested custom elements of the same tag
                if (el.hasAttribute('scoped')) {
                    return NodeFilter.FILTER_REJECT;
                }

                // Accept elements with [data-bind-text]
                const isAttrValue = attrValue ? el.getAttribute(attrName) === attrValue : true
                if (el.hasAttribute(attrName) && isAttrValue) {
                    return NodeFilter.FILTER_ACCEPT;
                }

                return NodeFilter.FILTER_SKIP;
            },
        }
    );

    let current = walker.nextNode();
    while (current) {
        results.push(current as T);
        current = walker.nextNode();
    }

    return results;
}

export function queryOutsideScoped<T extends Element>(
    root: Element,
    selector: string
): T[] {
    const matches = Array.from(root.querySelectorAll<T>(selector));

    return matches.filter(el => {
        let current: Element | null = el;
        while (current && current !== root) {
            if (current.hasAttribute('scoped')) {
                return false;
            }
            current = current.parentElement;
        }
        return true;
    });
}
