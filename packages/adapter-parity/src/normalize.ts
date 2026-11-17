const escapeRegExp = (text: string) => text.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The server HTML of one view without what differs between adapters: comments (the markers of a framework) and
 * the attributes of hydration are removed, and the form id becomes `FORM` where it starts a word of an attribute
 * value, so a short id does not match other text. The attributes of each tag are sorted, an attribute with no value
 * gets `=""`, and no space comes before the end of the tag.
 */
export const normalizeHtml = (html: string, formId: string) =>
  html
    .replaceAll(/<!--.*?-->/g, '')
    .replaceAll(/\s(?:data-hk|data-reactroot|_hk)(?:="[^"]*"|=[^\s>]+)?/g, '')
    .replaceAll(new RegExp(`(?<=["\\s])${escapeRegExp(formId)}(?=[-"\\s])`, 'g'), 'FORM')
    .replaceAll(
      /<([a-z]+)((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*(\/?)>/g,
      (_tag, name: string, attributes: string, end: string) =>
        `<${[
          name,
          ...(attributes.match(/[^\s=]+(?:="[^"]*")?/g) ?? [])
            .map(attribute => (attribute.includes('=') ? attribute : `${attribute}=""`))
            .sort(),
        ].join(' ')}${end}>`,
    );
