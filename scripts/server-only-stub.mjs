/**
 * Stands in for the `server-only` package when a script imports a module that
 * guards itself with it. The real package throws under the resolution
 * conditions Node uses here, and a CLI script is server code by definition.
 */
export default {};
