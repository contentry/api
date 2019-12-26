module.exports = {
    moduleFileExtensions: [
        "js",
        "json",
        "ts"
    ],
    rootDir: "test",
    moduleNameMapper: {
        "^@modules/(.*)$": "<rootDir>/../src/modules/$1",
        "^@utils/(.*)$": "<rootDir>/../src/utils/$1",
        "^@helpers/(.*)$": "<rootDir>/../src/helpers/$1",
        "^@app/(.*)$": "<rootDir>/../src/$1"
    },
    testRegex: ".+\\.(e2e-)?(test|spec).(t|j)s$",
    transform: {
        "^.+\\.(t|j)s$": "ts-jest"
    },
    coverageDirectory: "../coverage",
    testEnvironment: "node"
};
