/** True in the browser, false during server rendering and in Node scripts. */
export const isBrowser = 'window' in globalThis;
