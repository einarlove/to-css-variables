# To CSS Variables

## Overview

`toCSSVariables` is a utility function that converts a nested object into CSS variable declarations and a corresponding object structure with variable references. This allows for dynamic theming, namespacing, and fallback values in a structured manner.

## Installation

```sh
npm install to-css-variables
```

## Usage

### Importing the Function

```typescript
import { toCSSVariables } from 'to-css-variables';
```

### Example Usage

```typescript
const input = {
  text: { DEFAULT: '#111', muted: '#333' },
  border: '#999',
  spacing: { sm: '0.25rem', md: '0.5rem', lg: '1rem' }
};

const options = { prefix: 'my-prefix', includeFallback: true, rootKeys: ['DEFAULT'] };
const result = toCSSVariables(input, options);
```

### Expected Output

```json
{
  "declaration": {
    "--my-prefix-text": "#111",
    "--my-prefix-text-muted": "#333",
    "--my-prefix-border": "#999",
    "--my-prefix-spacing-sm": "0.25rem",
    "--my-prefix-spacing-md": "0.5rem",
    "--my-prefix-spacing-lg": "1rem"
  },
  "variables": {
    "text": {
      "DEFAULT": "var(--my-prefix-text, #111)",
      "muted": "var(--my-prefix-text-muted, #333)"
    },
    "border": "var(--my-prefix-border, #999)",
    "spacing": {
      "sm": "var(--my-prefix-spacing-sm, 0.25rem)",
      "md": "var(--my-prefix-spacing-md, 0.5rem)",
      "lg": "var(--my-prefix-spacing-lg, 1rem)"
    }
  },
  "raw": {
    "text": { "DEFAULT": "#111", "muted": "#333" },
    "border": "#999",
    "spacing": { "sm": "0.25rem", "md": "0.5rem", "lg": "1rem" }
  }
}
```

## API

### `toCSSVariables(obj: Record<string, any>, options?: ToCSSVariablesOptions): Result`

#### Parameters

- `obj`: The input object, which can be nested. Each property value is treated as a string.
- `options` (optional):
  - `prefix` (string): A prefix to namespace CSS variables and avoid conflicts.
  - `includeFallback` (boolean): Whether to include the original value as a fallback in the CSS variable reference.
  - `rootKeys` (string[]): An optional array of strings representing keys treated as root-level variables.

#### Returns

An object with the following structure:

- `declaration`: An object where each key is a CSS variable name and its value is the corresponding CSS value.
- `variables`: An object mirroring the structure of the input object, where each value is replaced with a CSS variable reference. If `includeFallback` is `true`, each reference includes the original value as a fallback.
- `raw`: The original input object.

## Why Use `toCSSVariables`?

- **Scoped CSS variables**: Avoids name collisions by allowing a customizable prefix.
- **Dynamic theming**: Makes it easy to switch themes by updating CSS variables.
- **Fallbacks**: Ensures that variables have default values in case they are missing.
- **Root key handling**: Provides more flexibility in variable structuring.

## License

MIT License.

## Author

Created by **Einar Løve** (<git@einarlove.com>).

