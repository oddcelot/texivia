/**
 * Extracts the bare param name from a brace segment, dropping any `:regex`
 * constraint after the colon.
 */
type ParamName<Seg extends string> = Seg extends `${infer Name}:${string}` ? Name : Seg;

/**
 * Extracts the union of param names declared in a path literal.
 * Recognizes both `{name}` and `{name:regex}` forms uniformly — the
 * single-arm template lets the recursion visit every brace segment instead
 * of greedy-matching past unconstrained params on the way to a constrained
 * one.
 */
type ParamNames<P extends string> = P extends `${string}{${infer Seg}}${infer Rest}`
  ? ParamName<Seg> | ParamNames<Rest>
  : never;

/**
 * Object type whose keys are the params declared in a path literal.
 * - For the unrefined `string` default, falls back to `Record<string, string>`
 *   so legacy callers see no narrowing.
 * - For a literal pattern with no params, resolves to `Record<string, never>`.
 * - Otherwise yields a typed object keyed by the declared param names.
 */
type ParamsOf<P extends string> = string extends P
  ? Record<string, string>
  : [ParamNames<P>] extends [never]
    ? Record<string, never>
    : { readonly [K in ParamNames<P>]: string };

/**
 * Resolves a path pattern to the union of concrete URL strings that match it,
 * e.g. `/users/{id:\\d+}/profile` becomes `` `/users/${string}/profile` ``.
 * The wildcard `*` resolves to `string`.
 */
type ResolvePath<P extends string> = P extends `${infer Pre}{${string}}${infer Rest}`
  ? `${Pre}${string}${ResolvePath<Rest>}`
  : P extends '*'
    ? string
    : P;

/**
 * Union of literal route paths in a config tuple, excluding the wildcard.
 */
type RoutePath<R extends readonly ConfigRoute<any, string>[]> = Exclude<R[number]['path'], '*'>;

/**
 * Union of concrete URL strings accepted by `navigate()` for the given config.
 */
type NavigablePath<R extends readonly ConfigRoute<any, string>[]> = ResolvePath<RoutePath<R>>;

/**
 * A hook function type that runs before navigation.
 *
 * @template T - The type of view associated with the route.
 * @template P - The literal path pattern, used to type `match.params`.
 * @param match - The matched route object.
 * @returns A boolean, string, or a Promise resolving to one of these types.
 *   - If `false`, navigation is cancelled.
 *   - If a `string`, navigation is redirected to the given path.
 *   - If `true`, navigation proceeds as normal.
 */
type HookType<T, P extends string = string> = (match: MatchedRoute<T, P>) => boolean | string | Promise<boolean | string>

/**
 * Configuration for a route in the router.
 * @template T The type of view associated with routes.
 * @template P The literal path pattern. Inferred from the `path` field; carries
 *   param names through to `handler`'s `match.params`.
 */
type ConfigRoute<T, P extends string = string> = {
  path: P;
  view?: T;
  redirect?: string;
  handler?: HookType<T, P>;
}

/**
 * Internal representation of a compiled route with regex for parameter matching.
 */
type CompiledRoute<T, P extends string = string> = ConfigRoute<T, P> & {
  paramRegex: RegExp | null;
}

/**
 * Representation of a matched route with extracted parameters.
 * @template T The type of view associated with routes.
 * @template P The literal path pattern, used to type `params`.
 */
type MatchedRoute<T, P extends string = string> = {
  readonly path: string;
  view?: T;
  readonly params: ParamsOf<P>;
  readonly search: Record<string, string>;
  readonly hash: string;
}

/**
 * Maximum number of redirects before aborting navigation.
 */
const MAX_REDIRECTS = 10;

/**
 * Substitutes named params into a path pattern and appends search/hash. Used
 * by the structured form of `Router.navigate({ to, params, ... })`.
 */
function buildPath(
  pattern: string,
  params: Record<string, string>,
  search?: Record<string, string>,
  hash?: string,
): string {
  let path = pattern.replace(/\{([a-zA-Z_$][a-zA-Z0-9_$]*)(?::[^}]+)?\}/g, (_, name) => {
    const value = params[name];
    if (value === undefined) throw new Error(`Texivia: missing param '${name}' for path '${pattern}'`);
    return encodeURIComponent(value);
  });
  const qs = search ? new URLSearchParams(search).toString() : '';
  if (qs) path += '?' + qs;
  if (hash) path += hash.startsWith('#') ? hash : '#' + hash;
  return path;
}

/**
 * Lightweight, framework-agnostic router for single-page applications.
 * Compiles all routes into a single regex for O(1) matching.
 *
 * @template T The type of view to be used with the router.
 * @template R The literal type of the route config tuple. Inferred from the
 *   constructor argument via the `const` modifier, so `router.navigate(...)`
 *   autocompletes from the actual route paths without callers needing
 *   `as const`.
 */
class Router<
  T = unknown,
  const R extends readonly ConfigRoute<T, string>[] = readonly ConfigRoute<T, string>[],
> {
  private segmentRegex = /(?:\/([^\/{}]+)|\/\{([a-zA-Z_$][a-zA-Z0-9_$]*)(?::([^/]+))?\}|(\/))/g;
  private static readonly EVENT_NAME = 'texivia';
  private readonly _mapping: RegExp | null;
  private readonly _routes: Array<CompiledRoute<T>> = [];
  private _boundPopState: ((event: PopStateEvent) => void) | null = null;
  private _boundClick: ((event: MouseEvent) => void) | null = null;
  private _currentUrl = window.location.href;

  /**
   * Creates a new router instance with the provided route configuration.
   * @param config Array of route configurations.
   * @throws {Error} If a route path is malformed.
   */
  constructor(config: R = [] as unknown as R) {
    const mappings: string[] = [];

    let wildcard;
    for (const c of config) {
      if (c.path === '*') {
        wildcard = c;
      }
      else {
        const matches = c.path.match(this.segmentRegex);
        if (!matches || matches.join('') !== c.path)
          throw new Error(`Malformed path: ${c.path}`);

        let paramRegexString = '^';
        let mappingRegex = '(^';
        const paramNames: string[] = [];

        c.path.replace(this.segmentRegex, (_: string, literal: string, param: string, rx: string, slash: string) => {
          if (literal) {
            const escaped = '\\/' + literal.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
            paramRegexString += escaped;
            mappingRegex += escaped;
          }
          else if (param) {
            paramRegexString += `\\/(?<${param}>${rx || '[^\\/]+'})`;
            mappingRegex += `\\/(?:${rx || '[^\\/]+'})`;
            paramNames.push(param);
          }
          else if (slash) {
            paramRegexString += '\\/';
            mappingRegex += '\\/';
          }
          return '';
        });

        paramRegexString += '$';
        mappingRegex += '$)';
        mappings.push(mappingRegex);
        const paramRegex = paramNames.length ? new RegExp(paramRegexString) : null;
        this._routes.push({ ...c, paramRegex });
      }
    }
    if (wildcard) {
      this._routes.push({ ...wildcard, paramRegex: null });
      mappings.push('(.*)');
    }

    this._mapping = mappings.length ? new RegExp(mappings.join('|'), 'i') : null;
  }

  /**
   * Starts the router by attaching event listeners and handling the current URL.
   */
  async start(): Promise<void> {
    this._boundPopState = this._handlePopState.bind(this);
    window.addEventListener('popstate', this._boundPopState);

    this._boundClick = this._onclick.bind(this);
    document.addEventListener('click', this._boundClick);

    const url = new URL(window.location.href);
    window.history.replaceState({ path: url.pathname }, '', url);
    await this._navigate(url, false);
  }

  /**
   * Stops the router by removing all event listeners.
   */
  stop(): void {
    if (this._boundPopState) window.removeEventListener('popstate', this._boundPopState);
    if (this._boundClick) document.removeEventListener('click', this._boundClick);
    this._boundPopState = null;
    this._boundClick = null;
  }

  /**
   * Navigates programmatically to the given path. Accepts either a concrete
   * URL string typed against the configured routes, or a structured `{ to,
   * params }` form where `to` is a route pattern and `params` is typed by the
   * pattern's named segments.
   *
   * ```ts
   * router.navigate('/users/42/profile');
   * router.navigate({ to: '/users/{id:\\d+}/profile', params: { id: '42' } });
   * ```
   */
  async navigate<P extends RoutePath<R>>(
    path: NavigablePath<R> | { to: P; params: ParamsOf<P>; search?: Record<string, string>; hash?: string },
  ): Promise<MatchedRoute<T, P> | null> {
    const url = typeof path === 'string'
      ? new URL(path, window.location.origin)
      : new URL(buildPath(path.to, path.params, path.search, path.hash), window.location.origin);
    return this._navigate(url, true) as Promise<MatchedRoute<T, P> | null>;
  }

  /**
   * Click event handler that intercepts link clicks for routing.
   * @param event - The click event object.
   */
  private async _onclick(event: MouseEvent): Promise<void> {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;

    const anchor = (event.target as HTMLElement).closest('a');
    if (!anchor || !anchor.href) return;

    let url: URL;
    try {
      url = new URL(anchor.href);
    } catch {
      return;
    }

    if (url.origin !== window.location.origin) return;
    if (anchor.target && anchor.target !== '_self') return;
    if (anchor.hasAttribute('download')
      || anchor.getAttribute('rel') === 'external'
      || anchor.hasAttribute('no-router')) return;
    if (anchor.getAttribute('href')?.startsWith('#')) return;

    event.preventDefault();
    await this._navigate(url, true);
  }

  /**
   * Navigates to the specified URL.
   * @param url - The URL to navigate to.
   * @param pushState - Whether to add the URL to browser history.
   * @param redirectCount - Current redirect depth (prevents infinite loops).
   * @returns The matched route or null if no match found.
   * @throws {Error} If redirect limit is exceeded.
   */
  private async _navigate(url: URL, pushState: boolean, redirectCount = 0): Promise<MatchedRoute<T> | null> {
    if (redirectCount > MAX_REDIRECTS)
      throw new Error('Texivia: redirect limit exceeded');

    const result = this._match(url.pathname, Object.fromEntries(new URLSearchParams(url.search)), url.hash);
    if (result === null) return null;

    if (result.redirect)
      return this._navigate(new URL(result.redirect, window.location.origin), pushState, redirectCount + 1);

    if (result.handler) {
      const hookResult = await Promise.resolve(result.handler(result.event));
      if (hookResult === false) {
        if (!pushState) {
            window.history.pushState({ path: this._currentUrl }, '', this._currentUrl);
        }
        return null;
      }
      this._currentUrl = url.href;
      if (typeof hookResult === 'string')
        return this._navigate(new URL(hookResult, window.location.origin), pushState, redirectCount + 1);
    }

    if (pushState)
      window.history.pushState({ path: url.pathname }, '', url);

    document.dispatchEvent(new CustomEvent(Router.EVENT_NAME, { detail: result.event, bubbles: true }));
    return result.event;
  }

  /**
   * Matches a path against the defined routes.
   * @param path - The path to match.
   * @param search - The query parameters.
   * @param hash - The URL hash fragment.
   * @returns Internal match result separating public event data from internal routing data, or null.
   */
  private _match(path: string, search: Record<string, string>, hash: string):
    { event: MatchedRoute<T>; redirect?: string; handler?: HookType<T> } | null {

    if (!this._mapping)
      return null;

    const matches = this._mapping.exec(path);
    if (!matches || matches[0] !== path)
      return null;

    const index = matches.findIndex((item, i) => i > 0 && item !== undefined);
    if (index === -1)
      return null;

    const route = this._routes[index - 1];
    let params: Record<string, string> = {};

    if (route.paramRegex) {
      const paramsMatch = route.paramRegex.exec(path);
      if (!paramsMatch)
        throw new Error(`Texivia: param regex mismatch on path '${path}' for route '${route.path}'`);
      params = paramsMatch.groups || {};
    }

    return {
      event: { path, view: route.view, params, search, hash },
      redirect: route.redirect,
      handler: route.handler,
    };
  }

  /**
   * Handles the popstate event when the user navigates browser history.
   */
  private async _handlePopState(_: PopStateEvent): Promise<void> {
    await this._navigate(new URL(window.location.href), false);
  }
}

/**
 * Factory that lets callers specify the view type `T` while still letting
 * TypeScript infer the literal route tuple `R`. The two-step call is needed
 * because TS doesn't currently allow partial explicit type-argument lists —
 * passing `T` to `new Router<T>(...)` defeats inference of the second
 * generic and falls back to a loose `readonly ConfigRoute<T, string>[]`.
 *
 * ```ts
 * const router = createRouter<View>()([
 *   { path: '/about', view: AboutView },
 *   { path: '/users/{id:\\d+}', view: UserView },
 * ]);
 * router.navigate({ to: '/users/{id:\\d+}', params: { id: '42' } });
 * ```
 */
function createRouter<T>() {
  return <const R extends readonly ConfigRoute<T, string>[]>(routes: R) => new Router<T, R>(routes);
}

export {
  Router,
  createRouter,
  type ConfigRoute,
  type MatchedRoute,
  type HookType,
  type ParamsOf,
  type RoutePath,
  type NavigablePath,
};
