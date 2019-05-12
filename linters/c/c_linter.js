// ./oclint/bin/oclint -report-type text -o out.txt *.c -- -c
var args = require('yargs').argv;
var DB = require('./../../db').DB;

const { exec } = require('child_process');

var ext = "c"

function lint(db){
  exec('./oclint/bin/oclint files/*.'+ext+' -- -c', (err, stdout, stderr) => {
    db.connection.connect();
    var lines = stdout.split("\n");
    lines.forEach(async function (line) {
      if (line[0] == '/') {
        parts = line.split(".");
        path = parts[0].split("/");
        code_id = path[path.length-1];
        lint = line.substr(line.indexOf(' ')+1);
        const lint_resolve = await db.insert_lint("", lint, code_id);
        console.log("Lint: " + lint_resolve);
      }
    })
  });
}

var db = new DB();
if (args.language == "c++") {
  ext = "cpp"
}
lint(db);