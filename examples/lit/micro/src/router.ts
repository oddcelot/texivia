import { createRouter } from 'texivia-router';
import type { TemplateResult } from 'lit';
import { renderLanding } from './pages/landing';
import { renderLogin } from './pages/login';
import { renderUserProfile } from './pages/user-profile';
import { renderAbout } from './pages/about';
import { renderImprint } from './pages/imprint';
import { renderContact } from './pages/contact';
import { renderNotFound } from './pages/not-found';

export type View = (params: Record<string, string>) => TemplateResult;

// createRouter<View>()([...]) keeps the literal route patterns inferred —
// so router.navigate(...) below autocompletes the configured paths and
// type-checks both the URL string and the structured { to, params } form.
export const router = createRouter<View>()([
  { path: '/', handler: () => `/${navigator.language.split('-')[0]}/` },
  { path: '/example/', view: renderLanding },
  { path: '/{locale}/', view: renderLanding },
  { path: '/{locale}/login', view: renderLogin },
  { path: '/{locale}/users/{id:\\d+}/profile', view: renderUserProfile },
  { path: '/{locale}/about', view: renderAbout },
  { path: '/{locale}/imprint', view: renderImprint },
  { path: '/{locale}/contact', view: renderContact },
  { path: '*', view: renderNotFound },
]);
