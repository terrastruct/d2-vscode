import typescriptEslint from "@typescript-eslint/eslint-plugin";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"),
    {
        plugins: {
            "@typescript-eslint": typescriptEslint,
        },

        languageOptions: {
            globals: {
                ...Object.fromEntries(Object.entries(globals.browser).map(([key]) => [key, "off"])),
            },

            parser: tsParser,
            ecmaVersion: 12,
            sourceType: "module",

            parserOptions: {
                project: ["src/tsconfig.json"],
            },
        },

        rules: {
            "@typescript-eslint/ban-ts-comment": "off",
            "allowShortCircuit": true,
            "accessor-pairs": "error",
            "array-bracket-newline": "off",
            "array-bracket-spacing": ["error", "never"],
            "array-callback-return": "error",
            "array-element-newline": "off",
            "arrow-body-style": "off",
            "arrow-parens": "off",

            "arrow-spacing": ["error", {
                after: true,
                before: true,
            }],

            "block-scoped-var": "error",
            "block-spacing": "error",
            "brace-style": ["error", "1tbs"],
            "callback-return": "error",
            camelcase: "off",
            "capitalized-comments": "off",
            "class-methods-use-this": "off",
            "comma-dangle": 0,
            "comma-spacing": "off",
            "comma-style": ["error", "last"],
            complexity: "off",
            "computed-property-spacing": ["error", "never"],
            "consistent-return": "error",
            "consistent-this": "error",
            curly: "error",
            "default-case": "off",
            "dot-location": ["error", "property"],

            "dot-notation": ["off", {
                allowKeywords: true,
            }],

            "eol-last": "error",
            eqeqeq: "error",
            "for-direction": "error",
            "func-call-spacing": "error",
            "func-name-matching": "error",
            "func-names": "error",
            "func-style": "off",
            "function-paren-newline": "off",
            "generator-star-spacing": "off",
            "getter-return": "error",
            "global-require": "off",
            "guard-for-in": "error",
            "handle-callback-err": "error",
            "id-blacklist": "error",
            "id-length": "off",
            "id-match": "error",
            "indent-legacy": "off",
            "init-declarations": "off",
            "jsx-quotes": "error",
            "key-spacing": "error",

            "keyword-spacing": ["error", {
                after: true,
                before: true,
            }],

            "line-comment-position": "error",
            "lines-around-comment": "off",
            "lines-around-directive": "error",

            "lines-between-class-members": ["error", "always", {
                exceptAfterSingleLine: true,
            }],

            "max-depth": "off",
            "max-len": "off",
            "max-lines": "off",
            "max-nested-callbacks": "error",
            "max-params": "off",
            "max-statements": "off",
            "max-statements-per-line": "error",
            "multiline-comment-style": "off",
            "new-parens": "error",
            "newline-after-var": "off",
            "newline-before-return": "off",
            "newline-per-chained-call": "off",
            "no-alert": "off",
            "no-array-constructor": "error",
            "no-await-in-loop": "error",
            "no-bitwise": "error",
            "no-buffer-constructor": "error",
            "no-caller": "error",
            "no-catch-shadow": "error",
            "no-confusing-arrow": "error",
            "no-console": "off",
            "no-continue": "off",
            "no-div-regex": "error",
            "no-duplicate-imports": "error",
            "no-else-return": "off",
            "no-empty-function": "off",
            "no-eq-null": "error",
            "no-eval": "error",
            "no-extend-native": "error",
            "no-extra-bind": "error",
            "no-extra-label": "error",
            "no-extra-parens": "off",
            "no-floating-decimal": "error",
            "no-implicit-coercion": "error",
            "no-implicit-globals": "error",
            "no-implied-eval": "error",
            "no-inline-comments": "error",
            "no-invalid-this": "off",
            "no-debugger": "off",
            "no-iterator": "error",
            "no-label-var": "error",
            "no-labels": "error",
            "no-lone-blocks": "error",
            "no-lonely-if": "off",
            "no-loop-func": "error",
            "no-magic-numbers": "off",
            "no-mixed-operators": "off",
            "no-mixed-requires": "error",
            "no-multi-assign": "error",
            "no-multi-spaces": "error",
            "no-multi-str": "error",
            "no-multiple-empty-lines": "error",
            "no-native-reassign": "error",
            "no-negated-condition": "off",
            "no-negated-in-lhs": "error",
            "no-nested-ternary": "error",
            "no-new": "error",
            "no-new-func": "error",
            "no-new-object": "error",
            "no-new-require": "error",
            "no-new-wrappers": "error",
            "no-octal-escape": "error",
            "no-param-reassign": "off",
            "no-path-concat": "error",
            "no-plusplus": "off",
            "no-process-env": "off",
            "no-process-exit": "error",
            "no-proto": "error",
            "no-prototype-builtins": "off",
            "no-restricted-globals": "error",
            "no-restricted-imports": "error",
            "no-restricted-modules": "error",
            "no-restricted-properties": "error",
            "no-restricted-syntax": "error",
            "no-return-assign": "error",
            "no-return-await": "error",
            "no-script-url": "error",
            "no-self-compare": "error",
            "no-sequences": "error",
            "no-shadow": "error",
            "no-shadow-restricted-names": "error",
            "no-spaced-func": "error",
            "no-sync": "error",
            "no-tabs": "off",
            "no-template-curly-in-string": "error",
            "no-ternary": "off",
            "no-throw-literal": "error",
            "no-trailing-spaces": "off",
            "no-undef-init": "error",
            "no-undefined": "off",
            "no-underscore-dangle": "off",
            "no-unmodified-loop-condition": "error",
            "no-unneeded-ternary": "error",
            "no-unused-expressions": "error",
            "no-unused-vars": "error",
            "no-use-before-define": "off",
            "no-useless-call": "error",
            "no-useless-computed-key": "error",
            "no-useless-concat": "error",
            "no-useless-constructor": "off",
            "no-useless-rename": "error",
            "no-useless-return": "error",
            "no-var": "off",
            "no-void": "error",
            "no-warning-comments": "off",
            "no-whitespace-before-property": "error",
            "no-with": "error",
            "nonblock-statement-body-position": "error",
            "object-curly-newline": "off",
            "object-curly-spacing": "off",
            "object-property-newline": "off",
            "object-shorthand": "off",
            "one-var": "off",
            "one-var-declaration-per-line": "error",
            "operator-assignment": ["error", "always"],
            "operator-linebreak": "error",
            "padded-blocks": "off",
            "padding-line-between-statements": "error",
            "prefer-arrow-callback": "error",
            "prefer-const": "error",
            "prefer-destructuring": "off",
            "prefer-numeric-literals": "error",
            "prefer-promise-reject-errors": "error",
            "prefer-reflect": "off",
            "prefer-rest-params": "error",
            "prefer-spread": "error",
            "prefer-template": "off",
            "quote-props": "off",
            quotes: "off",
            radix: "error",
            "require-await": "error",
            "require-jsdoc": "off",
            "rest-spread-spacing": "error",
            semi: "off",
            "semi-spacing": "off",
            "semi-style": ["error", "last"],
            "sort-imports": "off",
            "sort-keys": "off",
            "sort-vars": "off",
            "space-before-blocks": "off",
            "space-before-function-paren": "off",
            "space-in-parens": ["error", "never"],
            "space-infix-ops": "off",
            "space-unary-ops": "error",
            "spaced-comment": ["error", "always"],
            strict: "error",
            "switch-colon-spacing": "error",
            "symbol-description": "error",
            "template-curly-spacing": ["error", "never"],
            "template-tag-spacing": "error",
            "unicode-bom": ["error", "never"],
            "valid-jsdoc": "off",
            "vars-on-top": "error",
            "wrap-iife": "error",
            "yield-star-spacing": "error",
            yoda: ["error", "never"],
        },
    },
];