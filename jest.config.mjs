import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    testEnvironment: 'jsdom',
    modulePathIgnorePatterns: [
        '<rootDir>/.next/',
        '<rootDir>/.open-next/',
        '<rootDir>/open-next/',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
};

export default createJestConfig(config);
