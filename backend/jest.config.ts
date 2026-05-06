import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/modules/**/*.use-case.ts',
    'src/shared/domain/**/*.ts',
    'src/shared/http/interceptors/idempotency.interceptor.ts',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
