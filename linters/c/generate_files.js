var args = require('yargs').argv;
var DB = require('./../../db').DB;
var fs = require('fs');

var lang = "c";
var ext = "c"

async function generate(db){
  db.connection.connect();
  const codes = await db.select_codes(lang);
  codes.forEach(code => {
    fs.writeFile("files/"+code.code_id+"."+ext, code.body, (err) => {
        if (err) throw err;
    });
  });
}

var db = new DB();
if (args.language == "c++") {
  lang = args.language;
  ext = "cpp"
}
generate(db);
