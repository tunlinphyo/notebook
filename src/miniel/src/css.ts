import { serialize } from "../utils"

export function css(strings: TemplateStringsArray, ...values: any[]): CSSStyleSheet {
    const cssString = strings.reduce((acc, str, i) => {
        const val = values[i];
        return acc + str + serialize(val);
    }, '');

    const sheet = new CSSStyleSheet();
    sheet.replaceSync(cssString);

    return sheet;
}