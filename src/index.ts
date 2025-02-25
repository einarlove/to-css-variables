/**
 * @author Einar Løve <git@einarlove.com>
 * Converts a nested object into CSS variable declarations and a corresponding object structure
 * with variable references. This function allows customization of CSS variable names with a prefix,
 * can optionally include fallback values for each variable, and supports defining root keys
 * for special handling in the CSS variable naming.
 *
 * @param obj The input object, which can be nested. Each property value is treated as a string.
 * @param options An object containing optional settings:
 *                - `prefix`: A string to prefix CSS variable names, helping to namespace and avoid conflicts.
 *                - `includeFallback`: A boolean indicating whether to include the original value as a fallback.
 *                - `rootKeys`: An optional array of strings representing keys to be treated as root-level variables.
 *                  When a key is listed in `rootKeys`, its variable name will be directly prefixed without additional
 *                  nesting. For instance, `{ ink: { DEFAULT: 'black' } }` with `rootKeys` as `['DEFAULT']` will produce
 *                  `--ink: black` instead of `--ink-default: black`.
 * @returns An object containing three properties:
 *          - `declaration`: An object where each key is a CSS variable name and its value is the corresponding CSS value.
 *          - `variables`: An object mirroring the structure of the input object, where each value is replaced with
 *            a CSS variable reference. If `includeFallback` is true, each reference includes the original value as a fallback.
 *          - `raw`: The original input object.
 *
 * @example
 * ```typescript
 * const input = {
 *   text: { DEFAULT: '#111', muted: '#333' },
 *   border: '#999',
 *   spacing: { sm: '0.25rem', md: '0.5rem', lg: '1rem' }
 * };
 * const options = { prefix: 'my-prefix', includeFallback: true, rootKeys: ['DEFAULT'] };
 * const result = toCSSVariables(input, options);
 *
 * The result will be:
 * {
 *   declaration: {
 *     '--my-prefix-text': '#111',
 *     '--my-prefix-text-muted': '#333',
 *     '--my-prefix-border': '#999',
 *     '--my-prefix-spacing-sm': '0.25rem',
 *     '--my-prefix-spacing-md': '0.5rem',
 *     '--my-prefix-spacing-lg': '1rem'
 *   },
 *   variables: {
 *     text: {
 *       DEFAULT: 'var(--my-prefix-text, #111)',
 *       muted: 'var(--my-prefix-text-muted, #333)'
 *     },
 *     border: 'var(--my-prefix-border, #999)',
 *     spacing: {
 *       sm: 'var(--my-prefix-spacing-sm, 0.25rem)',
 *       md: 'var(--my-prefix-spacing-md, 0.5rem)',
 *       lg: 'var(--my-prefix-spacing-lg, 1rem)'
 *     }
 *   },
 *   raw: input
 * }
 * ```
 */

export function toCSSVariables<T extends NestedCSSObject, P extends string = ''>(
  obj: T,
  options?: Options<P>,
): Output<T, P> {
  const prefix = options?.prefix || ''
  const includeFallback = options?.includeFallback || false
  const rootKeys = options?.rootKeys || []
  let declaration: Record<string, string> = {}
  let variables = {} as VariableObject<T, P>

  function processObject(
    subObj: NestedCSSObject,
    currentPrefix: string,
    parentObj: NestedCSSObject,
  ) {
    for (const key in subObj) {
      const kebabKey = camelToKebabCase(key)
      const isRootKey = rootKeys.includes(key)
      const fullKey = isRootKey
        ? currentPrefix
        : `${currentPrefix}${currentPrefix ? '-' : ''}${kebabKey}`
      if (typeof subObj[key] === 'string') {
        declaration[`--${fullKey}`] = subObj[key] as string
        parentObj[key] = `var(--${fullKey}${includeFallback ? `, ${subObj[key]}` : ''})`
      } else {
        parentObj[key] = {}
        processObject(
          subObj[key] as NestedCSSObject,
          currentPrefix ? fullKey : kebabKey,
          parentObj[key] as NestedCSSObject,
        )
      }
    }
  }

  processObject(obj, prefix, variables)
  return { declaration, variables, raw: obj }
}

export type CSSValue = string
export type CSSObject = Record<string, CSSValue | NestedCSSObject>
export type NestedCSSObject = { [key: string]: CSSValue | NestedCSSObject }

type Options<P extends string = string, R extends string[] = string[]> = {
  prefix?: P
  includeFallback?: boolean
  rootKeys?: R
}

type VariableObject<T, P extends string = '', R extends string[] = string[]> = {
  [K in keyof T]: T[K] extends CSSValue
    ? `var(--${P}-${KebabCase<K & string>})`
    : VariableObject<T[K], `${P}-${KebabCase<K & string>}`, R>
}

type Output<T extends CSSObject, P extends string = '', R extends string[] = string[]> = {
  declaration: Record<string, string>
  variables: VariableObject<T, P, R>
  raw: T
}

function camelToKebabCase(str: string): string {
  return (
    str
      // Replace whitespace with hyphen
      .replace(/\s+/g, '-')
      // Inserting a hyphen before numeric parts, but not if the number is at the start of the string
      .replace(/(\d+)(?=[a-zA-Z])/g, '-$1')
      // Insert hyphen between lowercase letters and uppercase letters
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .toLowerCase()
  )
}

type KebabCase<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Capitalize<First>
    ? `${Lowercase<First>}${KebabCase<Rest>}`
    : `${First}${KebabCaseLetterGroup<Rest>}`
  : S

type KebabCaseLetterGroup<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends Uppercase<First>
    ? `-${Lowercase<First>}${KebabCase<Rest>}`
    : First extends `${number}`
      ? `-${First}${KebabCaseDigitGroup<Rest>}`
      : `${First}${KebabCaseLetterGroup<Rest>}`
  : S

type KebabCaseDigitGroup<S extends string> = S extends `${infer First}${infer Rest}`
  ? First extends `${number}`
    ? `${First}${KebabCaseDigitGroup<Rest>}`
    : `${First}${KebabCase<Rest>}`
  : S

/**
 * Flattens a nested object into a single-level object, where nested keys are joined with a separator or camelCased.
 * @param obj The input object, which can be nested. Each property value is treated as a string.
 * @param options An object containing optional settings:
 *               - `separator`: A string to join nested keys with. Defaults to `'-'`.
 *               - `prefix`: A string to prefix each key with. Defaults to `''`.
 *               - `rootKeys`: An optional array of strings representing keys to be treated as root-level variables.
 * @returns An object where each key is a flattened key and its value is the corresponding value.
 */

type NestedObject = {
  [key: string]: string | NestedObject
}

export function flattenVariables(
  obj: NestedObject,
  options?: { separator?: string; prefix?: string; rootKeys?: string[] },
): Record<string, string> {
  const separator = options?.separator || '-'
  const prefix = options?.prefix || ''
  const rootKeys = options?.rootKeys || []
  let flattened: Record<string, string> = {}

  function processObject(subObj: NestedObject, currentPrefix: string) {
    for (const key in subObj) {
      const value = subObj[key]
      const isRootKey = rootKeys.includes(key)
      const fullKey = currentPrefix
        ? isRootKey
          ? currentPrefix
          : `${currentPrefix}${separator}${key}`
        : key
      if (typeof value === 'string') {
        flattened[`${prefix}${fullKey}`] = value
      } else if (typeof value === 'object' && value !== null && !(value instanceof Array)) {
        // Ensure the value is not an array and is an object
        processObject(value, fullKey)
      }
    }
  }

  processObject(obj, '')
  return flattened
}
