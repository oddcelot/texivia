import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '../layouts/main-layout'

@customElement('page-user-profile')
export class PageUserProfile extends LitElement {
  createRenderRoot() { return this }

  @property() locale = 'en'
  @property() id = ''

  render() {
    const body = html`
      <h1>User Profile</h1>
      <p>Locale: ${this.locale}</p>
      <p>User ID: ${this.id}</p>
    `
    return html`<main-layout .locale=${this.locale} .body=${body}></main-layout>`
  }
}

export const renderUserProfile = (p: Record<string, string>) =>
  html`<page-user-profile .locale=${p.locale} .id=${p.id}></page-user-profile>`
