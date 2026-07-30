const BREAKABLE_SPACE = /[\t\n\f\r ]+(?=\S+[\t\n\f\r ]*$)/u;

/**
 * Find the final breakable space in a text block when joining the last two
 * words will produce a useful, reasonably short final line.
 */
export function findWidowBreak(
    text,
    { minimumWords = 4, maximumJoinedLength = 32 } = {},
) {
    const words = text.trim().split(/\s+/u).filter(Boolean);

    if (words.length < minimumWords) return -1;

    const joinedLength = Array.from(words.slice(-2).join(' ')).length;

    if (joinedLength > maximumJoinedLength) return -1;

    const match = BREAKABLE_SPACE.exec(text);

    if (!match) return -1;

    return match.index + match[0].length - 1;
}

/**
 * Apply the established “widon’t” technique without replacing innerHTML, so
 * links, emphasis, and other inline markup retain their nodes and listeners.
 */
export function preventWidow(element) {
    if (element.matches('[data-widow-ignore]') || element.querySelector('br')) {
        return false;
    }

    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let text = '';
    let node = walker.nextNode();

    while (node) {
        textNodes.push({ node, start: text.length });
        text += node.nodeValue;
        node = walker.nextNode();
    }

    const breakIndex = findWidowBreak(text);

    if (breakIndex === -1) return false;

    const target = textNodes.find(({ node: textNode, start }) => (
        breakIndex >= start && breakIndex < start + textNode.nodeValue.length
    ));

    if (!target) return false;

    const localIndex = breakIndex - target.start;
    const value = target.node.nodeValue;

    target.node.nodeValue = `${value.slice(0, localIndex)}\u00a0${value.slice(localIndex + 1)}`;

    return true;
}

export function initWidowControl(root = document) {
    if (CSS.supports('text-wrap', 'pretty')) return;

    root.querySelectorAll('p:not([data-widow-ignore])').forEach(preventWidow);
}
