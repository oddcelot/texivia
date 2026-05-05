import { Router } from 'texivia-router';
import type { TemplateResult } from 'lit';
import { renderLanding } from './pages/landing';
import { renderLogin } from './pages/login';
import { renderUserProfile } from './pages/user-profile';
import { renderAbout } from './pages/about';
import { renderImprint } from './pages/imprint';
import { renderContact } from './pages/contact';
import { renderNotFound } from './pages/not-found';

export type View = (params: Record<string, string>) => TemplateResult;

export const router = new Router<View>([
  { path: '/', handler: () => `/${navigator.language}/` },
  { path: '/{locale}/', view: renderLanding },
  { path: '/{locale}/login', view: renderLogin },
  { path: '/{locale}/users/{id:\\d+}/profile', view: renderUserProfile },
  { path: '/{locale}/about', view: renderAbout },
  { path: '/{locale}/imprint', view: renderImprint },
  { path: '/{locale}/contact', view: renderContact },
  { path: '*', view: renderNotFound },
]);
