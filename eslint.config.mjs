import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
    ...nextVitals,
    ...nextTypescript,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unused-vars': 'warn',
            'react/no-unescaped-entities': 'off',
            // Next 16 enables the React Compiler advisory rules. The existing
            // application predates those rules, so keep them visible without
            // turning advisory refactors into release-blocking errors.
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/immutability': 'warn',
            'react-hooks/static-components': 'warn',
            'react-hooks/purity': 'warn',
            'react-hooks/refs': 'warn',
        },
    },
    globalIgnores([
        '.next/**',
        '.open-next/**',
        'open-next/**',
        'out/**',
        'build/**',
        'scripts/**',
        'tools/**',
        'next-env.d.ts',
    ]),
]);
