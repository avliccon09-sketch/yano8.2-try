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
import * as cheerio from 'cheerio';
import { App } from '../src/App';
import { getAppointments, getSafetyReports } from '../src/services/storage';

const SELECTOR = 'div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(3)';

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
      const $ = cheerio.load(html);
      const match = $(SELECTOR);
      if (match.length > 0) {
        console.log(`\n🔥🔥🔥 EXACT MATCH IN ${userObj.role} / ${mod}!`);
        console.log('HTML snippet:\n', $.html(match));
      } else {
        // Also check if any selector prefix matches
        const prefixes = [
          'div#root > div > div > main > div > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(3)',
          'div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3)',
          'div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1)'
        ];
        for (const p of prefixes) {
          const m = $(p);
          if (m.length > 0) {
            // console.log(`Matched prefix [${p}] in ${userObj.role}/${mod} (count: ${m.length})`);
          }
        }
      }
    } catch (e: any) {
      console.error(e.message);
    }
  }
}
