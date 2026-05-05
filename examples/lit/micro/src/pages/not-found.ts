import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('page-not-found')
export class PageNotFound extends LitElement {
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div>
        <h1>404 Not Found</h1>
        <p>The page you are looking for does not exist.</p>
        <p>Return to the <a href="/">home page</a>.</p>
      </div>
    `;
  }
}

export const renderNotFound = () => html`<page-not-found></page-not-found>`;
