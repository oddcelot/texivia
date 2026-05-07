import { LitElement } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { router, type View } from './router';
import { renderLanding } from './pages/landing';

@customElement('app-shell')
export class AppShell extends LitElement {
  // Light DOM keeps the clicked <a> as event.target so the router's
  // document-level closest('a') resolves it; Shadow DOM would retarget
  // target to <app-shell>. Also lets global app.css apply.
  createRenderRoot() {
    return this;
  }

  @state() private view: View = renderLanding;
  @state() private params: Record<string, string> = { locale: 'en' };

  private onNavigate = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (detail?.view) this.view = detail.view;
    this.params = detail?.params ?? {};
  };

  connectedCallback() {
    super.connectedCallback();
    // Listener must precede start(): for routes with no handler, _navigate
    // dispatches the texivia event synchronously inside start(), so attaching
    // afterwards loses the initial event on deep-link loads.
    document.addEventListener('texivia', this.onNavigate);
    router.start();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('texivia', this.onNavigate);
    router.stop();
  }

  render() {
    return this.view(this.params);
  }
}
