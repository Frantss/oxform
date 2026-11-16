/**
 * The server HTML of one view without what differs between adapters: the form id becomes `FORM`, and comments
 * (the markers of a framework) and the attributes of hydration are removed. The attributes of each tag are sorted,
 * an attribute with no value gets `=""`, and no space comes before the end of the tag.
 */
export const normalizeHtml = (html: string, formId: string) =>
  html
    .replaceAll(formId, 'FORM')
    .replaceAll(/<!--.*?-->/g, '')
    .replaceAll(/\s(?:data-hk|data-reactroot)(?:="[^"]*")?/g, '')
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
