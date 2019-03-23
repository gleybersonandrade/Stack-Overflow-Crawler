var CLIEngine = require('eslint').CLIEngine;
var DB = require('./db').DB;

async function lint(cli, db){
  db.connection.connect();
  const codes = await db.select_codes();
  codes.forEach(code => {
    const report = cli.executeOnText(code.body).results[0];
    if (report.errorCount) {
      report.messages.forEach(async function (lint, lint_index) {
        const lint_resolve = await db.insert_lint(lint, code.code_id);
        console.log("Lint " + lint_index + ": " + lint_resolve);
      });
    }
  });
}

var cli = new CLIEngine({
  parserOptions: {
    ecmaVersion: 6,
  },
  rules: {}
});
var db = new DB();
lint(cli, db);