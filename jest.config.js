const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // اعط مسار إلى مجلد Next.js لتحميل config و .env
  dir: './',
})

// إضافة أي إعدادات مخصصة لـ Jest هنا
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
  ],
}

// createJestConfig ينسخ إعدادات Next.js ويترك لك إضافة customJestConfig
module.exports = createJestConfig(customJestConfig)
