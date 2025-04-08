export function setValueByPath(obj: any, path: string, value: any) {
    const parts = path.split('.');
    let current = obj;
    parts.forEach((part, index) => {
        if (index === parts.length - 1) {
            current[part] = value;
        } else {
            current[part] = current[part] || {};
            current = current[part];
        }
    });
}

export function extractDataFromBindings(root: HTMLElement): Record<string, any> {
    const data: Record<string, any> = {};

    // From root itself if it has data-bind-attr
    if (root instanceof HTMLElement && root.hasAttribute('data-bind-attr')) {
        attributeBinding(root, data);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, {
        acceptNode(node) {
            const el = node as Element;
            if (el.hasAttribute('scoped')) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
        }
    });

    let current: Element | null = walker.nextNode() as Element;
    while (current) {
        if (current.hasAttribute('data-bind-text')) {
            const key = current.getAttribute('data-bind-text');
            if (key) {
                const val = current.textContent ?? '';
                setValueByPath(data, key, val.trim());
            }
        }

        if (current instanceof HTMLInputElement ||
            current instanceof HTMLSelectElement ||
            current instanceof HTMLTextAreaElement) {
            const key = current.getAttribute('data-bind');
            if (key) {
                setValueByPath(data, key, current.value);
            }
        }

        if (current.hasAttribute('data-bind-attr')) {
            attributeBinding(root, data);
        }

        current = walker.nextNode() as Element;
    }

    return data;
}

function attributeBinding(node: Element, data: Record<string, any>) {
    const bindings = node.getAttribute('data-bind-attr')?.split(';') || [];
    bindings.forEach(binding => {
        const [attr, path] = binding.split(':');
        if (!attr || !path) return;
        const attrName = attr.trim();
        const keyPath = path.trim();
        const attrVal = node.getAttribute(attrName);
        if (attrVal !== null) {
            setValueByPath(data, keyPath, attrVal);
        }
    });
}