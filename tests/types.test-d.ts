import { describe, it, expectTypeOf } from 'vitest';
import { Router, type ParamsOf, type RoutePath, type MatchedRoute } from '../src/texivia';

describe('ParamsOf', () => {
  it('extracts a single param', () => {
    expectTypeOf<ParamsOf<'/users/{id}/profile'>>().toEqualTypeOf<{ readonly id: string }>();
  });

  it('extracts a regex-constrained param', () => {
    expectTypeOf<ParamsOf<'/users/{id:\\d+}/profile'>>().toEqualTypeOf<{ readonly id: string }>();
  });

  it('extracts multiple params', () => {
    expectTypeOf<ParamsOf<'/{locale}/users/{id:\\d+}/profile'>>().toEqualTypeOf<{
      readonly locale: string;
      readonly id: string;
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
