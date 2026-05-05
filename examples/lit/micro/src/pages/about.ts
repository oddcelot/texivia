import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mainLayout } from '../layouts/main-layout';

@customElement('page-about')
export class PageAbout extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property() locale = 'en';

  render() {
    return mainLayout(
      this.locale,
      html`
        <h1>About</h1>
        <p>Texivia is a lightweight, framework-agnostic router for single-page applications.</p>
        <p>Built with TypeScript, it compiles all routes into a single regex for fast O(1) matching.</p>
      `
    );
  }
}

export const renderAbout = (p: Record<string, string>) => html`<page-about .locale=${p.locale}></page-about>`;
