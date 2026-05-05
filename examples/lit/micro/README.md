# Micro — Lit + Texivia Router

Minimal Lit 3 example using `texivia-router` for client-side routing. Demonstrates locale-prefixed routes, parameterized paths, redirects, and a catch-all 404 page.

## Routes

| Path | View |
|------|------|
| `/` | Redirects to `/{locale}/` based on `navigator.language` |
| `/{locale}/` | Landing |
| `/{locale}/login` | Login |
| `/{locale}/users/{id}/profile` | UserProfile |
| `/{locale}/about` | About |
| `/{locale}/imprint` | Imprint |
| `/{locale}/contact` | Contact |
| `*` | NotFound |

## How It Works

`Router<View>` is parameterized over a render function — `View = (params) => TemplateResult`. Each page exports a LitElement plus a `renderXxx` function that the route map references:

```ts
// src/router.ts
export type View = (params: Record<string, string>) => TemplateResult

export const router = new Router<View>([
  { path: '/', handler: () => `/${navigator.language}/` },
  { path: '/{locale}/', view: renderLanding },
  { path: '/{locale}/users/{id:\\d+}/profile', view: renderUserProfile },
  // ...
  { path: '*', view: renderNotFound },
])
```

`<app-shell>` is the root LitElement. It listens for the `texivia` event, swaps the current view, and re-renders:

```ts
// src/app-shell.ts
@customElement('app-shell')
export class AppShell extends LitElement {
  createRenderRoot() { return this } // light DOM

  @state() private view: View = renderLanding
  @state() private params: Record<string, string> = { locale: 'en' }

  private onNavigate = (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail?.view) this.view = detail.view
    this.params = detail?.params ?? {}
  }

  connectedCallback() {
    super.connectedCallback()
    document.addEventListener('texivia', this.onNavigate)
    router.start()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    document.removeEventListener('texivia', this.onNavigate)
    router.stop()
  }

  render() {
    return this.view(this.params)
  }
}
```

## Lit-specific notes

**Light DOM (`createRenderRoot() { return this }`).** The example renders in light DOM so global `app.css` applies and `<a>` clicks bubble to `document` where Texivia intercepts them. If you prefer shadow DOM, you'll need to ship styles per-component via `static styles` and rely on `composedPath` for click interception (Texivia already handles standard click bubbling, so anchor clicks must reach `document`).

**Listener before `start()`.** Routes without a handler complete `_navigate` synchronously inside `router.start()` and dispatch the `texivia` event before control returns. Attach the listener first, then call `router.start()`, otherwise the initial event is missed on direct deep-link loads.

**Layout body as a template prop.** Light DOM ignores `<slot>` (slots only project in shadow DOM). Layout components take their body as a TemplateResult prop instead — `<main-layout .locale=${locale} .body=${html\`...\`}>`. This mirrors Svelte's named-snippet pattern.

## Setup

```sh
npm install
npm run dev
```
