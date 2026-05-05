import { html, type TemplateResult } from 'lit';
import '../components/app-header';
import '../components/app-footer';

export const mainLayout = (locale: string, body: TemplateResult) => html`
  <app-header .locale=${locale}></app-header>
  <main>${body}</main>
  <app-footer .locale=${locale}></app-footer>
`;
