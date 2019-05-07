var fs = require('fs');
var DB = require('./db').DB;

async function populate_users(db){
    return new Promise(resolve => {
        fs.readFile('files/users.json', (err, data) => {
            if (err) throw err;
            let users = JSON.parse(data);
            let keys = Object.keys(users);
            let count = 0;
            keys.forEach(async function (key) {
                if (!await db.insert_user(key, users[key])) {
                    console.log("User " + key + " inserted!");
                    count++;
                }
            });
            resolve(count);
        });        
    });
};

async function populate_questions(db){
    return new Promise(resolve => {
        fs.readFile('files/questions.json', (err, data) => {
            if (err) throw err;
            let questions = JSON.parse(data);
            let keys = Object.keys(questions);
            let count = 0;
            keys.forEach(async function (key) {
                if (!await db.insert_question(key, questions[key])) {
                    console.log("Question " + key + " inserted!");
                    count++;
                }
                questions[key]["tags"].forEach(async function(tag, index) {
                    if (!await db.insert_tag(tag, key)) {
                        console.log("Tag " + index + " inserted!");
                    }
                });
            });
            resolve(count);
        });        
    });
};

async function populate_answers(db){
    return new Promise(resolve => {
        fs.readFile('files/answers.json', (err, data) => {
            if (err) throw err;
            let answers = JSON.parse(data);
            let keys = Object.keys(answers);
            let count = 0;
            keys.forEach(async function (key) {
                if (!await db.insert_answer(key, answers[key])) {
                    console.log("Answer " + key + " inserted!");
                    count++;
                }
                answers[key]["codes"].forEach(async function(code, index) {
                    if (!await db.insert_code(code, key)) {
                        console.log("Code " + index + " inserted!");
                    }
                });
            });
            resolve(count);
        });
    });
};

async function populate() {
    var db = new DB();
    db.connection.connect();
    const count_user = await populate_users(db);
    const count_questions = await populate_questions(db);
    const count_answers = await populate_answers(db);
    console.log(count_user + " users inserted!");
    console.log(count_questions + " questions inserted!");
    console.log(count_answers + " answers inserted!");
    // db.connection.end();
}

populate();