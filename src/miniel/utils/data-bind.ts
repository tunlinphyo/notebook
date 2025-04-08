import { deepEqual } from ".";

export function getValueByPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function updateBindings(
    root: HTMLElement,
    newData: Record<string, any>,
    oldData?: Record<string, any>
) {
    // console.log(root, newData, oldData)
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