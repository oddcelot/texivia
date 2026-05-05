import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '../layouts/main-layout'

@customElement('page-imprint')
export class PageImprint extends LitElement {
  createRenderRoot() { return this }

  @property() locale = 'en'

  render() {
    const body = html`
      <h1>Imprint</h1>
      <h2>Responsible</h2>
      <p>Texivia Example App<br />123 Example Street<br />12345 Example City</p>
      <h2>Contact</h2>
      <p>Email: example@texivia.dev</p>
    `
    return html`<main-layout .locale=${this.locale} .body=${body}></main-layout>`
  }
}

export const renderImprint = (p: Record<string, string>) =>
  html`<page-imprint .locale=${p.locale}></page-imprint>`
