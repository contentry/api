// extend the base jest.config.js with specific options
module.exports = Object.assign({}, require('../jest.config.js'), {
    // we're already in /test, using this file as a --config switches the working directory from <root> to /test
    // using rootDir: "/test" here would result in "<root>/test/test"
    rootDir: ".",
    testRegex: ".+\\.e2e-(test|spec).(t|j)s$",
});
