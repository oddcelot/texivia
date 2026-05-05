import { LitElement } from 'lit'
import { customElement, state } from 'lit/decorators.js'
import { router, type View } from './router'
import { renderLanding } from './pages/landing'

@customElement('app-shell')
export class AppShell extends LitElement {
  // Light DOM: lets global app.css apply and lets <a> clicks bubble to
  // document so Texivia's click interception sees them.
  createRenderRoot() { return this }

  @state() private view: View = renderLanding
  @state() private params: Record<string, string> = { locale: 'en' }

  private onNavigate = (event: Event) => {
    const detail = (event as CustomEvent).detail
    if (detail?.view) this.view = detail.view
    this.params = detail?.params ?? {}
  }

  connectedCallback() {
    super.connectedCallback()
    router.start()
    document.addEventListener('texivia', this.onNavigate)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    router.stop()
    document.removeEventListener('texivia', this.onNavigate)
  }

  render() {
    return this.view(this.params)
  }
}
