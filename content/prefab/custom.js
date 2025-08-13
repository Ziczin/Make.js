export default function(createComponent, makeWith, makeInner) {
    return {
        Separator: (...d) => createComponent('div', makeInner.separator, ...d),
        Scrollbox: (...d) => createComponent('div', makeInner.scrollbox, ...d),
        Paragraph: (txt, ...d) => typeof txt === 'string'
            ? createComponent('p', makeWith.text(txt), ...d)
            : createComponent('p', ...d)
    }
}
