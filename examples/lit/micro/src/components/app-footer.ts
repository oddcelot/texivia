import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'

@customElement('app-footer')
export class AppFooter extends LitElement {
  createRenderRoot() { return this }

  @property() locale = 'en'

  render() {
    return html`
      <footer>
        <p>&copy; 2026 Texivia</p>
        <nav>
          <a href="/${this.locale}/about">About</a>
          <a href="/${this.locale}/imprint">Imprint</a>
          <a href="/${this.locale}/contact">Contact</a>
        </nav>
      </footer>
    `
  }
}
