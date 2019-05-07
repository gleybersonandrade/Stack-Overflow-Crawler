var args = require('yargs').argv;
var DomParser = require('dom-parser');
var fs = require('fs');
var Stackexchange = require('stackexchange-node');

var tags = ['javascript', 'php', 'python', 'ruby'];
var options_stackoverflow = {
	version: 2.2 
};
var questions_filter = {
	key: 'F62k*pfvO0OEnM6rpB37Fg((',
	page: 1,
	pagesize: 100,
	sort: 'activity',
	order: 'asc',
	fromdate: 0,
	filter: 'withbody'
};
var data = {
	users: {},
	questions: {},
	answers: {}
};

function push_user(user) {
	data.users[user.user_id] = {
		display_name: user.display_name,
		user_type: user.user_type,
		reputation: user.reputation,
		accept_rate: user.accept_rate,
		link: user.link,
		profile_image: user.profile_image
	};
}

function push_question(question, user_id) {
	data.questions[question.question_id] = {
		title: question.title,
		body: question.body,
		view_count: question.view_count,
		answers_count: question.answer_count,
		score: question.score,
		link: question.link,
		creation_date: question.creation_date,
		last_activity_date: question.last_activity_date,
		last_edit_date: question.last_edit_date,
		tags: question.tags,
		user_id: user_id
	};
}

function push_answer(answer, codes, user_id) {
	data.answers[answer.answer_id] = {
		score: answer.score,
		is_accepted: answer.is_accepted,
		creation_date: answer.creation_date,
		last_activity_date: answer.last_activity_date,
		last_edit_date: answer.last_edit_date,
		codes: codes,
		questions_question_id: answer.question_id,
		user_id: user_id
	};
}

function save_data() {
	fs.writeFile('files/users.json', JSON.stringify(data.users, null, 4), (err) => {
		if (err) throw err
		console.log('The users file has been saved!')
	})
	fs.writeFile('files/questions.json', JSON.stringify(data.questions, null, 4), (err) => {
		if (err) throw err
		console.log('The questions file has been saved!')
	})
	fs.writeFile('files/answers.json', JSON.stringify(data.answers, null, 4), (err) => {
		if (err) throw err
		console.log('The answers file has been saved!')
	})
}

function process_questions(err, results) {
	if (err) throw err;
	if (results.items instanceof Array) {
		results.items.forEach(function(question){
			var	answers_control = {
				filter: {
					key: questions_filter.key,
					page: 1,
					pagesize: 100,
					filter: 'withbody'
				},
				question_id: question.question_id
			};
			push_user(question.owner);
			push_question(question, question.owner.user_id);
			console.log('[' + data.questions.length + '] TÍTULO: ' + question.title);
			context.questions.answers(answers_control.filter, function(err, results){
				process_answers(answers_control, err, results);
			}, [answers_control.question_id]);
		});
		save_data();
		if (results.has_more) {
			++questions_filter.page;
			context.search.advanced(questions_filter, process_questions)
		} else {
			console.log('-------------------------------');
			console.log('TOTAL: ' + data.questions.length);
			console.log('-------------------------------');
		}
	}
}

function process_answers(answers_control, err, results) {
	if (err) throw err;
	if (results.items instanceof Array) {
		results.items.forEach(function(answer){
			var htmlDoc = parser.parseFromString(answer.body, 'text/html');
			var codes = [];
			htmlDoc.getElementsByTagName('code').forEach(function(code) {
				codes.push(code.innerHTML);
			})
			push_user(answer.owner);
			push_answer(answer, codes, answer.owner.user_id);
		});
		if (results.has_more) {
			++answers_control.filter.page;
			context.questions.answers(answers_control.filter, function(err, results){
				process_answers(answers_control, err, results);
			}, [answers_control.question_id]);
		}
	}
}

console.log("Coletando perguntas");
console.log("-------------------");

if (args.time) {
	questions_filter.fromdate = args.time;
} else if (args.day && args.month && args.year) {
	questions_filter.fromdate = new Date(args.year + "/" + args.month + "/" + args.day).getTime() / 1000;
}
if (tags.length) questions_filter.tagged = tags.join(';');
var parser = new DomParser();
var context = new Stackexchange(options_stackoverflow);
context.search.advanced(questions_filter, process_questions);