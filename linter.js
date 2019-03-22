var CLIEngine = require('eslint').CLIEngine;
var DB = require('./db').DB;

var cli = new CLIEngine({
  parserOptions: {
    ecmaVersion: 6,
  },
  rules: {}
});

var db = new DB();
db.select_codes();

code = "class Foo {bar() { return 1; } bar() { return 2; } }";

const report = cli.executeOnText(code).results[0];

if (report.errorCount) {
  console.log(report.messages);
} else {
  console.log('No errors');
}