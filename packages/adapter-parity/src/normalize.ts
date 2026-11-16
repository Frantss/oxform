/**
 * The server HTML of one view without what differs between adapters: the form id becomes `FORM`, and comments
 * (the markers of a framework) and the attributes of hydration are removed.
 */
export const normalizeHtml = (html: string, formId: string) =>
  html
    .replaceAll(formId, 'FORM')
    .replaceAll(/<!--.*?-->/g, '')
    .replaceAll(/\s(?:data-hk|data-reactroot)(?:="[^"]*")?/g, '');
