/**
 * headroom.js ships no type declarations and has no `@types` package, so under
 * `astro/tsconfigs/strict` the bare import is an implicit `any` error.
 *
 * Only the surface `src/scripts/app.ts` actually uses is declared — widen it
 * when more of the library gets used, rather than pre-declaring the whole API.
 */
declare module 'headroom.js' {
  interface HeadroomTolerance {
    up: number;
    down: number;
  }

  interface HeadroomOptions {
    /** Vertical offset in px before the header starts reacting to scroll. */
    offset?: number;
    /** Scroll distance that must accumulate before a direction change counts. */
    tolerance?: number | HeadroomTolerance;
    classes?: Record<string, string>;
    onPin?: () => void;
    onUnpin?: () => void;
    onTop?: () => void;
    onNotTop?: () => void;
    onBottom?: () => void;
    onNotBottom?: () => void;
  }

  export default class Headroom {
    constructor(element: Element, options?: HeadroomOptions);
    init(): this;
    destroy(): void;
  }
}
