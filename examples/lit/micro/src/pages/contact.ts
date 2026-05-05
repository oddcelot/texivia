import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '../layouts/main-layout'

@customElement('page-contact')
export class PageContact extends LitElement {
  createRenderRoot() { return this }

  @property() locale = 'en'

  render() {
    const body = html`
      <h1>Contact</h1>
      <p>Have questions or feedback? Reach out to us.</p>
      <p>Email: <a href="mailto:example@texivia.dev">example@texivia.dev</a></p>
    `
    return html`<main-layout .locale=${this.locale} .body=${body}></main-layout>`
  }
}

export const renderContact = (p: Record<string, string>) =>
  html`<page-contact .locale=${p.locale}></page-contact>`
