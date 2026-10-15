const store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => store[k] || null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {}
};
(globalThis as any).sessionStorage = {
  getItem: (k: string) => store[k] || null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => {}
};
(globalThis as any).window = {
  addEventListener: () => {},
  removeEventListener: () => {},
  localStorage: (globalThis as any).localStorage,
  sessionStorage: (globalThis as any).sessionStorage,
  location: { href: '' }
};
(globalThis as any).document = {
  documentElement: { classList: { contains: () => false } }
};

import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { App } from '../src/App';

interface ParsedNode {
  tag: string;
  id?: string;
  className?: string;
  raw: string;
  children: ParsedNode[];
}

function parse(html: string): ParsedNode {
  const root: ParsedNode = { tag: 'root', raw: '', children: [] };
  const stack: ParsedNode[] = [root];
  const tagRegex = /<(\/)?([a-zA-Z0-9\-]+)([^>]*)>/g;
  let match;
  const voidTags = new Set(['img', 'input', 'br', 'hr', 'meta', 'link', 'area', 'base', 'col', 'embed', 'param', 'source', 'track', 'wbr']);

  while ((match = tagRegex.exec(html)) !== null) {
    const isClose = !!match[1];
    const tagName = match[2].toLowerCase();
    const attrsStr = match[3];
    const isSelfClosing = attrsStr.endsWith('/') || voidTags.has(tagName);

    if (isClose) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tagName) {
          stack.length = i;
          break;
        }
      }
    } else {
      const idMatch = attrsStr.match(/id=["\']([^"\']+)["\']/);
      const classMatch = attrsStr.match(/class=["\']([^"\']+)["\']/);
      const node: ParsedNode = {
        tag: tagName,
        id: idMatch ? idMatch[1] : undefined,
        className: classMatch ? classMatch[1] : undefined,
        raw: match[0],
        children: []
      };
      stack[stack.length - 1].children.push(node);
      if (!isSelfClosing) {
        stack.push(node);
      }
    }
  }
  return root;
}

function getNthOfType(parent: ParsedNode | null, tag: string, n: number): ParsedNode | null {
  if (!parent) return null;
  const matched = parent.children.filter(c => c.tag === tag);
  return matched[n - 1] || null;
}

const roles = [
  { role: 'ADMIN', name: 'Arnold Viena (OSAS Admin)', email: 'arnoldviena@gmail.com', modules: ['dashboard', 'safety_reports', 'register_student', 'announcements', 'scholarship', 'appointments', 'disciplinary', 'intervention', 'dormitory', 'student_records', 'activity_logs', 'settings'] },
  { role: 'GUIDANCE_ADMIN', name: 'Avliccon Alpuerto (Guidance)', email: 'avliccon04@gmail.com', modules: ['dashboard', 'appointments', 'intervention', 'referred_disciplinary', 'student_records', 'announcements'] },
  { role: 'STUDENT', name: 'John Doe', email: 'john@student.dcc.edu.ph', modules: ['dashboard', 'scholarship', 'safety_reports', 'appointments', 'disciplinary', 'dormitory'] }
];

for (const userObj of roles) {
  store['osas_current_user'] = JSON.stringify({
    id: 'user-1',
    fullName: userObj.name,
    email: userObj.email,
    role: userObj.role,
    department: 'OSAS'
  });

  for (const mod of userObj.modules) {
    store['osas_active_module'] = mod;
    try {
      const html = ReactDOMServer.renderToStaticMarkup(
        React.createElement('div', { id: 'root' }, React.createElement(App))
      );
      const parsedRoot = parse(html);

      const s0 = getNthOfType(parsedRoot, 'div', 1); // div#root
      const s1 = getNthOfType(s0, 'div', 1);
      const s2 = getNthOfType(s1, 'div', 1);
      const s3 = getNthOfType(s2, 'main', 1);
      const s4 = getNthOfType(s3, 'div', 1);
      const s5 = getNthOfType(s4, 'div', 1);
      const s6 = getNthOfType(s5, 'div', 1);
      const s7 = getNthOfType(s6, 'div', 3);
      const s8 = getNthOfType(s7, 'div', 1);
      const s9 = getNthOfType(s8, 'div', 3);

      if (s9) {
        console.log(`\n🎉 MATCH FOUND in ${userObj.role} / ${mod}!`);
        console.log('s9:', s9.raw);
        console.log('s9 className:', s9.className);
        console.log('s8 className:', s8.className);
        console.log('s7 className:', s7.className);
        console.log('s6 className:', s6.className);
        console.log('s5 className:', s5.className);
      } else if (s8) {
        const divChildrenOfS8 = s8.children.filter(c => c.tag === 'div');
        console.log(`[${userObj.role} / ${mod}] s8 has ${divChildrenOfS8.length} div children:`, divChildrenOfS8.map(c => c.className || c.tag));
      }
    } catch (e: any) {
      console.error('Error in', userObj.role, mod, e.message);
    }
  }
}

