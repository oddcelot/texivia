import { LitElement, html } from 'lit'
import { customElement, property } from 'lit/decorators.js'
import '../layouts/main-layout'

@customElement('page-landing')
export class PageLanding extends LitElement {
  createRenderRoot() { return this }

  @property() locale = 'en'

  render() {
    const body = html`
      <h1>Welcome to Texivia</h1>
      <p>Your one-stop solution for all your text processing needs.</p>
      <p>Locale: ${this.locale}</p>
      <p>Explore our features and services tailored just for you.</p>
      <p>Get started by signing up or logging in!</p>
      <p>Already have an account? <a href="/${this.locale}/login">Login here</a></p>
    `
    return html`<main-layout .locale=${this.locale} .body=${body}></main-layout>`
  }
}

export const renderLanding = (p: Record<string, string>) =>
  html`<page-landing .locale=${p.locale}></page-landing>`
