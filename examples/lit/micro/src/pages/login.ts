import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mainLayout } from '../layouts/main-layout';

@customElement('page-login')
export class PageLogin extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property() locale = 'en';

  render() {
    return mainLayout(
      this.locale,
      html`
        <h1>Login</h1>
        <form class="login-form" method="POST" action="/${this.locale}/login">
          <label for="username">Username</label>
          <input type="text" id="username" name="username" required />
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required />
          <button type="submit">Login</button>
          <p>Don't have an account? <a href="/${this.locale}/register">Register here</a></p>
        </form>
      `
    );
  }
}

export const renderLogin = (p: Record<string, string>) => html`<page-login .locale=${p.locale}></page-login>`;
