// rehypeCopyButton.js
import { visit } from "unist-util-visit";

export default function rehypeCopyButton() {
    return (tree) => {
        visit(tree, "element", (node) => {
            if (node.tagName === "pre") {
                const codeNode = node.children?.find(
                    (child) => child.tagName === "code"
                );

                if (codeNode) {
                    node.properties = node.properties || {};
                    node.properties.className = ["code-block"];

                    // Inject a button
                    node.children.push({
                        type: "element",
                        tagName: "button",
                        properties: {
                        className: ["copy-button"],
                        onclick:
                            "navigator.clipboard.writeText(this.previousElementSibling.innerText)",
                        type: "button",
                        },
                        children: [{ type: "text", value: "Copy" }],
                    });
                }
            }
        });
    };
}
