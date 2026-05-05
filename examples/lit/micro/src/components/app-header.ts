import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('app-header')
export class AppHeader extends LitElement {
  createRenderRoot() { return this }

  @property() locale = 'en'

  render() {
    return html`
      <header>
        <a class="brand" href="/${this.locale}/">Texivia</a>
        <nav>
          <a href="/${this.locale}/">Home</a>
          <a href="/${this.locale}/login">Login</a>
          <a href="/${this.locale}/users/1/profile">Profile</a>
        </nav>
      </header>
    `
  }
}
