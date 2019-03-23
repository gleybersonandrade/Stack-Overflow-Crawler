var mysql = require('mysql');

class DB {
	constructor() {
		this.connection = mysql.createConnection({
			host		: 'localhost',
			user		: 'root',
			password	: 'sqlpass123',
			database	: 'soverflowdb'
		});
	}
	
	insert_user(user) {
		return new Promise(resolve => {
			this.connection.query('INSERT INTO users SET ?', {
				user_id: user.user_id,
				display_name: user.display_name,
				user_type: user.user_type,
				reputation: user.reputation || null,
				accept_rate: user.accept_rate || null,
				link: user.link,
				profile_image: user.profile_image || null,
			}, function(err) {
				resolve(err);
			});
		});
	}

	insert_question(question) {
		return new Promise(resolve => {
			this.connection.query('INSERT INTO questions SET ?', {
				question_id: question.question_id,
				title: question.title,
				body: question.body,
				view_count: question.view_count,
				answers_count: question.answers_count,
				score: question.score,
				link: question.link,
				creation_date: question.creation_date || null,
				last_activity_date: question.last_activity_date || null,
				last_edit_date: question.last_edit_date || null,
				users_user_id: question.user_id
			}, function(err) {
				resolve(err);
			});
		});
	}

	insert_answer(answer) {
		return new Promise(resolve => {
			this.connection.query('INSERT INTO answers SET ?', {
				answer_id: answer.answer_id,
				score: answer.score,
				is_accepted: answer.is_accepted,
				creation_date: answer.creation_date,
				last_activity_date: answer.last_activity_date,
				last_edit_date: answer.last_edit_date,
				questions_question_id: answer.questions_question_id,
				users_user_id: answer.user_id
			}, function(err) {
				resolve(err);
			});
		});
	}

	insert_code(code, answer_id) {
		return new Promise(resolve => {
			this.connection.query('INSERT INTO codes SET ?', {
				code_id: 0,
				body: code,
				answers_answer_id: answer_id
			}, function(err) {
				resolve(err);
			});
		});
	}

	insert_tag(tag, question_id) {
		return new Promise(resolve => {
			this.connection.query('INSERT INTO tags SET ?', {
				name: tag,
				questions_question_id: question_id
			}, function(err) {
				resolve(err);
			});
		});
	}

	insert_lint(lint, code_id) {
		return new Promise(resolve => {
			this.connection.query('INSERT INTO lints SET ?', {
				rule: lint.rule,
				codes_code_id: code_id,
				type: lint.type
			}, function(err) {
				resolve(err);
			});
		});
	}

	select_codes() {
		this.connection.query('SELECT * FROM codes', function(err, result, fields){
			if (err) throw err;
			console.log(result);
		});
	}
}

module.exports = {
	DB: DB
}