const { pathsToModuleNameMapper } = require('ts-jest/utils');
const { compilerOptions } = require('./tsconfig');

module.exports = {
    moduleFileExtensions: [
        "js",
        "json",
        "ts"
    ],
    rootDir: "test",
    // this assumes baseUrl: './src' in tsconfig.json, and rootDir: 'test' here
    moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {prefix: '<rootDir>/../src/'}),
    testRegex: ".+\\.(e2e-)?(test|spec).(t|j)s$",
    resetMocks: true,
    transform: {
        "^.+\\.(t|j)s$": "ts-jest"
    },
    coverageDirectory: "../coverage",
    testEnvironment: "node"
};
