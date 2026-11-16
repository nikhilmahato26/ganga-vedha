/**
 * Stand-in for iconv-lite, which workerd cannot load (BLUEPRINT §5 #23). Express pulls it in through
 * body-parser; this API never uses body-parser (lib/http.ts parses JSON itself), so nothing calls it.
 */
const unsupported = () => {
  throw new Error('iconv-lite is not available on Workers')
}
export default { encodingExists: () => false, getDecoder: unsupported, getEncoder: unsupported, decode: unsupported, encode: unsupported }
export const encodingExists = () => false
