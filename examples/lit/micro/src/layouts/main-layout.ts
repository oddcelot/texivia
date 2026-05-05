import { LitElement, html, nothing, type TemplateResult } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '../components/app-header'
import '../components/app-footer'

@customElement('main-layout')
export class MainLayout extends LitElement {
  createRenderRoot() { return this }

  @property() locale = 'en'
  @property({ attribute: false }) body: TemplateResult | typeof nothing = nothing

  render() {
    return html`
      <app-header .locale=${this.locale}></app-header>
      <main>${this.body}</main>
      <app-footer .locale=${this.locale}></app-footer>
    `
  }
}
