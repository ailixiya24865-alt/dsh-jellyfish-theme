/**
 * Host half of the Deep-Sea Jellyfish theme bundle.
 *
 * The whole feature lives in the Client module (`client.js`): it layers the
 * bioluminescent alias tokens via `ctx.theme.overrideTokens`, paints the
 * artwork as the shell backdrop and seats its veil in `shell.overlay`. There is
 * nothing for the Host to compute, so this half only exists so the bundle
 * resolves as a plugin row.
 */
export function apply() {}
