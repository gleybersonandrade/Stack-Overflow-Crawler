var async = require('async');
var fs = require('fs');

var DB = require('./db').DB;

async function populate_users(db){
    return new Promise(resolve => {
        fs.readFile('files/users.json', (err, data) => {
            if (err) throw err;
            let users = JSON.parse(data);
            users.forEach(async function (user, user_index) {
                const user_resolve = await db.insert_user(user);
                console.log("User " + user_index + " inserted! " + user_resolve);
            });
            resolve(users.length);
        });        
    });
};

async function populate_questions(db){
    return new Promise(resolve => {
        fs.readFile('files/questions.json', (err, data) => {
            if (err) throw err;
            let questions = JSON.parse(data);
            questions.forEach(async function (question, question_index) {
                const question_resolve = await db.insert_question(question);
                console.log("Question " + question_index + " inserted! " + question_resolve);
                question.tags.forEach(async function(tag, tag_index) {
                    const tag_resolve = await db.insert_tag(tag, question.question_id);
                    console.log("Tag " + tag_index + " inserted! " + tag_resolve);
                });
            });
            resolve(questions.length);
        });        
    });
};

async function populate_answers(db){
    return new Promise(resolve => {
        fs.readFile('files/answers.json', (err, data) => {
            if (err) throw err;
            let answers = JSON.parse(data);
            answers.forEach(async function (answer, answer_index) {
                const answer_resolve = await db.insert_answer(answer);
                console.log("Answer " + answer_index + " inserted! " + answer_resolve);
                answer.codes.forEach(async function(code, code_index) {
                    const code_resolve = await db.insert_code(code, answer.answer_id);
                    console.log("Code " + code_index + " inserted! " + code_resolve);
                });
            });
            resolve(answers.length);
        });        
    });
};

async function populate() {
    var db = new DB();
    db.connection.connect();
    const count_user = await populate_users(db);
    console.log(count_user + " users inserted!");
    const count_questions = await populate_questions(db);
    console.log(count_questions + " questions inserted!");
    const count_answers = await populate_answers(db);
    console.log(count_answers + " answers inserted!");
    // db.connection.end();
}

populate();