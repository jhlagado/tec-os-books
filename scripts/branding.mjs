import { parse } from 'parse5';

export function checkBranding(html, { requireMark = true } = {}) {
  const text = [], titles = [], sites = [], logos = [];
  function walk(node, hidden = false) {
    const attrs = Object.fromEntries((node.attrs ?? []).map(a => [a.name, a.value]));
    const excluded = hidden || ['script', 'style', 'code', 'pre'].includes(node.tagName);
    if (node.tagName === 'meta' && attrs.property === 'og:site_name') sites.push(attrs.content);
    if (node.tagName === 'svg' && (attrs.class ?? '').split(/\s+/).includes('mark')) logos.push(attrs['aria-label']);
    if (node.tagName === 'title') titles.push((node.childNodes ?? []).map(c => c.value ?? '').join(''));
    if (node.nodeName === '#text' && !excluded) text.push(node.value);
    for (const child of node.childNodes ?? []) walk(child, excluded);
  }
  walk(parse(html));
  const errors = [];
  if (titles.length !== 1 || !/(?:^|\| )Tecos$/.test(titles[0])) errors.push('Page title must end with Tecos');
  if (sites.length !== 1 || sites[0] !== 'Tecos') errors.push('Open Graph site name must be Tecos');
  if ((requireMark && !logos.length) || logos.some(label => label !== 'Tecos')) errors.push('Site marks must be labelled Tecos');
  if (/\btech-?os\b/i.test([...text, ...titles, ...sites, ...logos].join(' '))) errors.push('Incorrect site spelling in visible content or metadata');
  // Screens keep the name a program prints, but they sit in code and pre, which are not read here.
  if (/(?<![\w./-])(?:tec-os|TEC-OS)(?![\w./-])/.test(text.join(' '))) errors.push('Visible prose must name Tecos');
  return errors;
}
