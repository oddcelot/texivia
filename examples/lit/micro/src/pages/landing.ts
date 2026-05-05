import { LitElement, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { mainLayout } from '../layouts/main-layout';
import { router } from '../router';

@customElement('page-landing')
export class PageLanding extends LitElement {
  createRenderRoot() {
    return this;
  }

  @property() locale = 'en';

  private goToProfile = () => {
    // Structured navigate(): `to` autocompletes from the configured patterns,
    // `params` is typed by the pattern's named segments. Wrong keys here are
    // a compile error.
    router.navigate({
      to: '/{locale}/users/{id:\\d+}/profile',
      params: { locale: this.locale, id: '42' },
    });
  };

  render() {
    return mainLayout(
      this.locale,
      html`
        <h1>Welcome to Texivia</h1>
        <p>Your one-stop solution for all your text processing needs.</p>
        <p>Locale: ${this.locale}</p>
        <p>Explore our features and services tailored just for you.</p>
        <p>Get started by signing up or logging in!</p>
        <p>Already have an account? <a href="/${this.locale}/login">Login here</a></p>
        <p><button @click=${this.goToProfile}>Open user 42's profile (typed navigate)</button></p>
      `
    );
  }
}

export const renderLanding = (p: Record<string, string>) => html`<page-landing .locale=${p.locale}></page-landing>`;
