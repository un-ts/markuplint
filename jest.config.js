const pkgs = require('./scripts/pkgs')

const moduleNameMapper = pkgs.reduce(
  (acc, pkg) =>
    Object.assign(
      acc,
      pkg === '@markuplint/html-spec'
        ? {
            [`^${pkg}$`]: `<rootDir>/markuplint/packages/${pkg}`,
          }
        : {
            [`^${pkg}$`]: `<rootDir>/markuplint/packages/${pkg}/src`,
            [`^${pkg}/lib/(.*)`]: `<rootDir>/markuplint/packages/${pkg}/src/$1`,
          },
    ),
  {
    '^markuplint-sync$': '<rootDir>/src',
  },
)

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverage: true,
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  coveragePathIgnorePatterns: ['<rootDir>/markuplint'],
  moduleNameMapper,
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
}
