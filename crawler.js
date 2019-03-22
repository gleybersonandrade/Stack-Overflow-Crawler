var DomParser = require('dom-parser');
var fs = require('fs');
var stackexchange = require('stackexchange-node');

var api_name = 'javascript';
var link_site = false;
var tags = ['javascript'];
var options_stackoverflow = { version: 2.2 };
var questions_filter = {
	key: 'F62k*pfvO0OEnM6rpB37Fg((',
	page: 1,
	pagesize: 100,
	sort: 'activity',
	order: 'desc',
	filter: 'withbody'
};
var parser = new DomParser();
var data = {
	users: [],
	questions: [],
	answers: []
};

function push_user(user) {
	data.users.push({
		user_id: user.user_id,
		display_name: user.display_name,
		user_type: user.user_type,
		reputation: user.reputation,
		accept_rate: user.accept_rate,
		link: user.link,
		profile_image: user.profile_image
	});
}

function push_question(question, user_id) {
	data.questions.push({
		question_id: question.question_id,
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
	});
}

function push_answer(answer, codes, user_id) {
	data.answers.push({
		answer_id: answer.answer_id,
		score: answer.score,
		is_accepted: answer.is_accepted,
		creation_date: answer.creation_date,
		last_activity_date: answer.last_activity_date,
		last_edit_date: answer.last_edit_date,
		codes: codes,
		questions_question_id: answer.question_id,
		user_id: user_id
	});
}

function save_data() {
	fs.writeFile('files/users.json', JSON.stringify(data.users), (err) => {
		if (err) throw err
		console.log('The users file has been saved!')
	})
	fs.writeFile('files/questions.json', JSON.stringify(data.questions), (err) => {
		if (err) throw err
		console.log('The questions file has been saved!')
	})
	fs.writeFile('files/answers.json', JSON.stringify(data.answers), (err) => {
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
			console.log('[' + (++num_questions) + '] TÍTULO: ' + question.title);
			push_user(question.owner);
			push_question(question, question.owner.user_id);
			context.questions.answers(answers_control.filter, function(err, results){
				process_answers(answers_control, err, results);
			}, [answers_control.question_id]);
		});
		save_data();
		if (results.has_more) {
			++questions_filter.page;
			context.search.advanced(questions_filter, process_questions)
		} else {
			console.log('--------------------------------------');
			console.log('API: ' + api_name + ' - TOTAL: ' + num_questions);
			console.log('--------------------------------------');
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

if (tags.length) questions_filter.tagged = tags.join(';');

console.log("Coletando perguntas = API: " + api_name);
console.log("--------------------------------------");

var num_questions = 0;

if (link_site) options_stackoverflow.site = api_name;
var context = new stackexchange(options_stackoverflow);

context.search.advanced(questions_filter, process_questions);