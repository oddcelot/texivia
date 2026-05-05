import { describe, it, expectTypeOf } from 'vitest';
import { Router, createRouter, type ParamsOf, type RoutePath, type MatchedRoute } from '../src/texivia';

describe('ParamsOf', () => {
  it('extracts a single param', () => {
    expectTypeOf<ParamsOf<'/users/{id}/profile'>>().toEqualTypeOf<{ readonly id: string }>();
  });

  it('narrows \\d+-constrained params to template-number strings', () => {
    expectTypeOf<ParamsOf<'/users/{id:\\d+}/profile'>>().toEqualTypeOf<{ readonly id: `${number}` }>();
  });

  it('treats [0-9]+ the same as \\d+', () => {
    expectTypeOf<ParamsOf<'/users/{id:[0-9]+}'>>().toEqualTypeOf<{ readonly id: `${number}` }>();
  });

  it('falls back to string for unrecognized regex constraints', () => {
    expectTypeOf<ParamsOf<'/posts/{slug:[a-z-]+}'>>().toEqualTypeOf<{ readonly slug: string }>();
  });

  it('extracts multiple params with mixed constraints', () => {
    expectTypeOf<ParamsOf<'/{locale}/users/{id:\\d+}/profile'>>().toEqualTypeOf<{
      readonly locale: string;
      readonly id: `${number}`;
    }>();
  });

  it('returns Record<string, never> for paths without params', () => {
    expectTypeOf<ParamsOf<'/about'>>().toEqualTypeOf<Record<string, never>>();
  });

  it('falls back to Record<string, string> for the unrefined string default', () => {
    expectTypeOf<ParamsOf<string>>().toEqualTypeOf<Record<string, string>>();
  });
});

describe('Router.navigate', () => {
  const router = new Router<string>([
    { path: '/', view: 'Home' },
    { path: '/about', view: 'About' },
    { path: '/users/{id:\\d+}/profile', view: 'Profile' },
    { path: '/{locale}/posts/{slug}', view: 'Post' },
    { path: '*', view: 'NotFound' },
  ]);

  it('accepts a concrete URL string for a configured route', () => {
    router.navigate('/about');
    router.navigate('/users/42/profile');
    router.navigate('/en/posts/hello-world');
  });

  it('rejects a path that does not match any route shape', () => {
    // @ts-expect-error '/nope' isn't a configured pattern
    router.navigate('/nope');
    // @ts-expect-error '/users/x' is missing the trailing /profile
    router.navigate('/users/x');
  });

  it('accepts the structured form with typed params', () => {
    router.navigate({ to: '/users/{id:\\d+}/profile', params: { id: '42' } });
    router.navigate({ to: '/{locale}/posts/{slug}', params: { locale: 'en', slug: 'hi' } });
  });

  it('rejects structured navigation with wrong param keys', () => {
    router.navigate({
      to: '/users/{id:\\d+}/profile',
      // @ts-expect-error 'wrong' is not a declared param of this route
      params: { wrong: '42' },
    });
  });

  it('rejects structured navigation to an unconfigured pattern', () => {
    router.navigate({
      // @ts-expect-error '/typo/{id}' was never declared in the config
      to: '/typo/{id}',
      params: { id: '42' },
    });
  });

  it('excludes the wildcard from the structured "to" union', () => {
    router.navigate({
      // @ts-expect-error wildcards are matched, not navigated to
      to: '*',
      params: {},
    });
  });

  it('accepts optional search and hash on the structured form', () => {
    router.navigate({
      to: '/users/{id:\\d+}/profile',
      params: { id: '42' },
      search: { tab: 'overview' },
      hash: '#bio',
    });
  });

  it('narrows params per-route via the discriminated to field', () => {
    // {locale}/about needs only locale, not id+locale (which would be the
    // case if TS picked the strictest params shape across all routes).
    const r = new Router<string>([
      { path: '/{locale}/about', view: 'A' },
      { path: '/{locale}/users/{id:\\d+}/profile', view: 'U' },
    ]);
    r.navigate({ to: '/{locale}/about', params: { locale: 'en' } });
    r.navigate({
      to: '/{locale}/about',
      // @ts-expect-error 'id' is not a param of /{locale}/about
      params: { locale: 'en', id: '1' },
    });
  });

  it('accepts both the constrained and stripped pattern in the to field', () => {
    const r = new Router<string>([
      { path: '/{locale}/users/{id:\\d+}/profile', view: 'U' },
    ]);
    // Original configured pattern works.
    r.navigate({
      to: '/{locale}/users/{id:\\d+}/profile',
      params: { locale: 'en', id: '13' },
    });
    // Stripped form also works (cleaner to write at the call site).
    r.navigate({
      to: '/{locale}/users/{id}/profile',
      params: { locale: 'en', id: '13' },
    });
    // Wrong param shape still errors.
    r.navigate({
      to: '/{locale}/users/{id}/profile',
      // @ts-expect-error 'foo' is not a declared param of this route
      params: { locale: 'en', foo: 'x' },
    });
  });

  it('rejects literal param values that violate the route regex', () => {
    const r = new Router<string>([{ path: '/users/{id:\\d+}/profile', view: 'U' }]);
    r.navigate({ to: '/users/{id}/profile', params: { id: '13' } });
    r.navigate({
      to: '/users/{id}/profile',
      // @ts-expect-error 'a123b' is not a numeric string
      params: { id: 'a123b' },
    });
  });

  it('omits params for routes that have no placeholders', () => {
    const r = new Router<string>([
      { path: '/about', view: 'A' },
      { path: '/users/{id}', view: 'U' },
    ]);
    // No params field needed for a paramless route.
    r.navigate({ to: '/about' });
    // Also fine to pass it as an empty object — but not required.
    r.navigate({ to: '/about', search: { ref: 'home' } });
    // Required for routes that do have placeholders.
    // @ts-expect-error params is required when the route has placeholders
    r.navigate({ to: '/users/{id}' });
  });
});

describe('Handler match.params', () => {
  it('is typed by the route pattern', () => {
    new Router<string>([
      {
        path: '/users/{id:\\d+}/profile',
        handler: (match) => {
          expectTypeOf(match.params).toEqualTypeOf<{ readonly id: string }>();
          return true;
        },
      },
      {
        path: '/{locale}/posts/{slug}',
        handler: (match) => {
          expectTypeOf(match.params).toEqualTypeOf<{
            readonly locale: string;
            readonly slug: string;
          }>();
          return true;
        },
      },
      {
        path: '/about',
        handler: (match) => {
          expectTypeOf(match.params).toEqualTypeOf<Record<string, never>>();
          return true;
        },
      },
    ]);
  });
});

describe('RoutePath', () => {
  const routes = [
    { path: '/' as const, view: 'A' },
    { path: '/about' as const, view: 'B' },
    { path: '/users/{id}' as const, view: 'C' },
    { path: '*' as const, view: 'D' },
  ] as const;

  it('unions the literal paths and excludes the wildcard', () => {
    expectTypeOf<RoutePath<typeof routes>>().toEqualTypeOf<'/' | '/about' | '/users/{id}'>();
  });
});

describe('MatchedRoute default', () => {
  it('keeps the loose Record<string, string> shape for the bare type', () => {
    expectTypeOf<MatchedRoute<string>['params']>().toEqualTypeOf<Record<string, string>>();
  });
});

describe('createRouter factory', () => {
  it('preserves literal path inference when T is specified', () => {
    type View = string;
    const router = createRouter<View>()([
      { path: '/about', view: 'A' },
      { path: '/users/{id:\\d+}/profile', view: 'B' },
    ]);

    // Concrete URL form is type-checked against the configured patterns.
    router.navigate('/about');
    router.navigate('/users/42/profile');
    // @ts-expect-error '/typo' is not a configured route shape
    router.navigate('/typo');

    // Structured form keeps the typed-params benefit.
    router.navigate({ to: '/users/{id:\\d+}/profile', params: { id: '42' } });
    router.navigate({
      to: '/users/{id:\\d+}/profile',
      // @ts-expect-error 'wrong' is not a declared param of this route
      params: { wrong: '42' },
    });
  });
});
