/**
 * Client half of the Deep-Sea Jellyfish theme (authoring source).
 *
 * `tools/build-client.mjs` turns this file into the shipped `client.js`: it
 * substitutes `__DSH_BACKDROP_DATA_URI__` with the artwork and
 * `__DSH_BUILD_STAMP__` with the bundle version. Edit this file, never the
 * generated one.
 *
 * What `apply` does:
 *  1. `ctx.theme.overrideTokens` re-skins the alias layer (deep abyss fills,
 *     bioluminescent cyan/mauve accents) for both light and dark palettes.
 *  2. An injected stylesheet paints the illustration as a fixed body backdrop,
 *     clears the opaque shell paints so it reads through the columns, and lays
 *     the readability gradient over it as `body::before` (click-through).
 *
 * Everything is an effect: the token layer is disposed with the plugin and the
 * stylesheet tags are owned and removed by the package on unload.
 */

window.__ModuleLoader__.load({
  id: '@local/jellyfish-theme',
  factory(require) {
    /** Bundle generation, stamped by tools/build-client.mjs (cache-busting marker). */
    const BUILD = '__DSH_BUILD_STAMP__'
    /**
     * Live shell structure this stylesheet targets (verified against the running
     * page; the root slot wrapper is `display: contents`, which is why the frame
     * is the WRAPPER's child and not `#root`'s first child):
     *
     *   #root > div[data-slot="root"]
     *     └ div.<frame>
     *         ├ div.<sidebarCol>  > div[data-slot="sidebar"]
     *         ├ div.<centerCol>   > div[data-slot="main"]
     *         │                     > div[data-slot="main.conversation"] > div.<conversationRoot>
     *         ├ div.<rightbarCol>
     *         ├ div[data-shell-bottom]
     *         └ div[data-shell-overlay]
     *
     * Slot wrappers carry `data-slot="<key>"` and are anchored on instead of the
     * hashed CSS-module class names. Without the frame rule the whole window
     * stays covered by the alias base colour and no backdrop can show through.
     * The backdrop itself lives on BOTH the root element and the body: the root
     * element's background paints on the canvas beneath the document, and the
     * body copy covers a shell stylesheet that paints the root element over it.
     * The data URI is inlined by tools/build-client.mjs — no custom-property
     * indirection, no separately cached asset URL.
     */
    const ELEMENT_STYLES = `
html {
  background-image:
    linear-gradient(180deg,
      var(--jellyfish-veil-strong) 0%,
      var(--jellyfish-veil-soft) 42%,
      var(--jellyfish-veil) 74%,
      var(--jellyfish-veil-strong) 100%),
    url('__DSH_BACKDROP_DATA_URI__');
  background-repeat: no-repeat;
  background-position: center 32%;
  background-size: cover, cover;
}
html body {
  background-color: transparent !important;
  background-image:
    linear-gradient(180deg,
      var(--jellyfish-veil-strong) 0%,
      var(--jellyfish-veil-soft) 42%,
      var(--jellyfish-veil) 74%,
      var(--jellyfish-veil-strong) 100%),
    url('__DSH_BACKDROP_DATA_URI__');
  background-repeat: no-repeat;
  background-position: center 32%;
  background-size: cover, cover;
}
html body {
  --jellyfish-veil: rgba(4, 8, 20, 0.16);
  --jellyfish-veil-soft: rgba(4, 8, 20, 0.05);
  --jellyfish-veil-strong: rgba(4, 8, 20, 0.28);
  --jellyfish-surface-strong: rgba(250, 247, 255, 0.62);
  --jellyfish-surface-soft: rgba(250, 247, 255, 0.5);
}
html body[data-ds-dark-theme] {
  --jellyfish-veil: rgba(2, 4, 12, 0.2);
  --jellyfish-veil-soft: rgba(2, 4, 12, 0.06);
  --jellyfish-veil-strong: rgba(2, 4, 12, 0.34);
  --jellyfish-surface-strong: rgba(9, 8, 25, 0.55);
  --jellyfish-surface-soft: rgba(9, 8, 25, 0.42);
}

/* 1. The frame paints the alias base colour over the whole window (and the
      sidebar fill on Windows). Clear it so the artwork reaches the columns. */
#root [data-slot="root"] > div:first-child,
#root > div:first-child > div:first-child {
  background-color: transparent !important;
}

/* 2. The centre column owns the reading surface: a frost of the alias base
      instead of the opaque fill that used to sit on the conversation root, so
      text keeps its contrast while the artwork reads through. The :where()
      wrapper keeps the selector forgiving: if :has() were unavailable the
      positional branch still matches (the frame's children are sidebar,
      centre, rightbar, …). */
#root [data-slot="root"] > div:first-child > div:where(:nth-child(2), :has(> [data-slot="main"])) {
  background-color: transparent !important;
  background-image: linear-gradient(
    180deg,
    var(--jellyfish-surface-strong) 0%,
    var(--jellyfish-surface-soft) 62%,
    var(--jellyfish-surface-strong) 100%);
}

/* 3. The conversation pane and the chat region must not re-paint that fill: the
      frost above is the reading surface. Cards, menus and popovers keep their
      own near-opaque layers, so they stay legible. */
#root [data-slot="main"] [data-slot="main.conversation"] > div,
#root [data-slot="main"] [data-conversation-region],
#root [data-slot="main"] [data-conversation-content] {
  background-color: transparent !important;
}
`

    /** Canonical alias tokens, each mode named. */
    const TOKENS = {
      '--dsw-alias-bg-base': { light: 'rgba(244, 239, 254, 0.78)', dark: 'rgba(11, 9, 30, 0.76)' },
      '--dsw-alias-bg-layer-1': { light: 'rgba(255, 252, 255, 0.93)', dark: 'rgba(23, 20, 48, 0.92)' },
      '--dsw-alias-bg-layer-2': { light: 'rgba(243, 237, 251, 0.96)', dark: 'rgba(31, 27, 61, 0.95)' },
      '--dsw-alias-bg-layer-3': { light: 'rgba(237, 230, 249, 0.97)', dark: 'rgba(39, 34, 75, 0.96)' },
      '--dsw-alias-bg-overlay': { light: 'rgba(250, 247, 255, 0.97)', dark: 'rgba(27, 23, 54, 0.97)' },
      '--dsw-specific-sidebar-fill': { light: 'rgba(228, 220, 248, 0.62)', dark: 'rgba(9, 8, 25, 0.58)' },
      '--dsw-specific-bubble': { light: 'rgba(214, 238, 251, 0.95)', dark: 'rgba(24, 53, 80, 0.92)' },
      '--dsw-specific-bubble-highlight': { light: 'rgba(199, 231, 248, 0.95)', dark: 'rgba(31, 68, 101, 0.92)' },
      '--dsw-specific-input-major': { light: 'rgba(252, 250, 255, 0.9)', dark: 'rgba(21, 19, 44, 0.9)' },
      '--dsw-specific-menu': { light: 'rgba(248, 244, 255, 0.86)', dark: 'rgba(28, 26, 54, 0.88)' },
      '--dsw-alias-menu-group-header-fill': { light: 'rgba(248, 244, 255, 0.94)', dark: 'rgba(28, 26, 54, 0.94)' },
      '--dsw-specific-selector': { light: 'rgba(225, 218, 245, 0.92)', dark: 'rgba(35, 31, 68, 0.92)' },
      '--dsw-specific-tip': { light: 'rgba(224, 217, 245, 0.9)', dark: 'rgba(31, 28, 61, 0.9)' },
      '--dsw-specific-sidebar-nav-item-hover': { light: 'rgba(213, 205, 240, 0.6)', dark: 'rgba(48, 42, 88, 0.55)' },
      '--dsw-specific-sidebar-nav-item-active': { light: 'rgba(196, 231, 245, 0.9)', dark: 'rgba(30, 58, 88, 0.9)' },
      '--dsw-specific-sidebar-nav-item-active-accent': { light: 'rgba(70, 205, 230, 0.4)', dark: 'rgba(83, 216, 238, 0.3)' },
      '--dsw-alias-button-floating-fill': { light: 'rgba(252, 250, 255, 0.92)', dark: 'rgba(31, 28, 61, 0.9)' },
      '--dsw-alias-button-floating-hover': { light: 'rgba(235, 228, 250, 0.95)', dark: 'rgba(44, 38, 80, 0.92)' },
      '--dsw-alias-button-elevated-fill': { light: 'rgba(252, 250, 255, 0.92)', dark: 'rgba(31, 28, 61, 0.9)' },
      '--dsw-alias-button-primary-fill': { light: '#0e7f9c', dark: '#53d8ee' },
      '--dsw-alias-button-primary-hover': { light: '#0b6b85', dark: '#7fe6f6' },
      '--dsw-alias-brand-primary': { light: '#0e7f9c', dark: '#53d8ee' },
      '--dsw-alias-brand-text': { light: '#0e7f9c', dark: '#a9f0fb' },
      '--dsw-alias-link': { light: '#0b7292', dark: '#7fe0f2' },
      '--dsw-alias-label-primary': { light: '#161233', dark: '#eef2ff' },
      '--dsw-alias-label-secondary': { light: '#453f68', dark: '#bcb6dc' },
      '--dsw-alias-label-tertiary': { light: '#5d5680', dark: '#a49dc8' },
      '--dsw-alias-label-caption': { light: '#6d668f', dark: '#8f88b5' },
      '--dsw-alias-label-primary-inverted': { light: '#fbf9ff', dark: '#100e26' },
      '--dsw-alias-border-l1': { light: 'rgba(60, 45, 130, 0.08)', dark: 'rgba(190, 214, 255, 0.08)' },
      '--dsw-alias-border-l2': { light: 'rgba(60, 45, 130, 0.14)', dark: 'rgba(190, 214, 255, 0.14)' },
      '--dsw-alias-border-l3': { light: 'rgba(60, 45, 130, 0.18)', dark: 'rgba(190, 214, 255, 0.18)' },
      '--dsw-alias-border-l4': { light: 'rgba(60, 45, 130, 0.22)', dark: 'rgba(190, 214, 255, 0.22)' },
      '--dsw-alias-interactive-bg-hover': { light: 'rgba(78, 60, 160, 0.07)', dark: 'rgba(196, 214, 255, 0.09)' },
      '--dsw-alias-interactive-bg-active': { light: 'rgba(78, 60, 160, 0.12)', dark: 'rgba(196, 214, 255, 0.15)' },
      '--dsw-alias-interactive-bg-hover-solid': { light: 'rgba(226, 219, 246, 0.9)', dark: 'rgba(44, 38, 80, 0.9)' },
      '--dsw-alias-markdown-code-block': { light: 'rgba(238, 233, 249, 0.95)', dark: 'rgba(17, 15, 37, 0.95)' },
      '--dsw-alias-markdown-code-block-banner': { light: 'rgba(230, 224, 244, 0.95)', dark: 'rgba(25, 22, 50, 0.95)' },
      '--dsw-alias-markdown-inline-code': { light: 'rgba(226, 220, 242, 0.95)', dark: 'rgba(30, 27, 56, 0.95)' },
      '--dsw-alias-markdown-tag': { light: 'rgba(222, 216, 240, 0.95)', dark: 'rgba(34, 30, 64, 0.95)' },
      '--dsw-alias-markdown-citation': { light: 'rgba(230, 224, 244, 0.95)', dark: 'rgba(30, 27, 56, 0.95)' },
      '--dsw-alias-toast-bg': { light: 'rgba(22, 18, 51, 0.95)', dark: 'rgba(52, 46, 92, 0.96)' },
      '--dsw-alias-tooltip-bg': { light: 'rgba(22, 18, 51, 0.95)', dark: 'rgba(52, 46, 92, 0.96)' },
      '--dsw-alias-state-idle-primary': { light: '#8f88b5', dark: '#6f6899' },
    }

    /**
     * Insert the backdrop stylesheet as an owned effect.
     *
     * The package style seat is preferred; the plain-tag branch keeps the
     * backdrop working if that service does not resolve in a given composition.
     * Either way the tag is removed when this plugin unloads.
     * @param ctx - the package's dynamic context.
     */
    function installStyles(ctx) {
      const styles = ctx.get('styles')
      if (styles !== undefined) {
        ctx.effect(() => styles.insert(ELEMENT_STYLES), 'jellyfish-theme: backdrop stylesheet')
        return
      }
      ctx.effect(() => {
        const tag = document.createElement('style')
        tag.dataset.jellyfishTheme = 'backdrop'
        tag.textContent = ELEMENT_STYLES
        document.head.append(tag)
        return () => { tag.remove() }
      }, 'jellyfish-theme: backdrop stylesheet (fallback seat)')
    }

    /** Register the token layer and the backdrop stylesheet. */
    function apply(ctx) {
      const theme = ctx.get('theme')
      if (theme !== undefined) theme.overrideTokens('jellyfish', TOKENS)
      installStyles(ctx)
    }

    return {
      inject: ['theme'],
      apply,
    }
  },
})
