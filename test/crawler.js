var Crawler = require("crawler");
var fs = require('fs');

var options = {
    "url": "https://stackoverflow.com",
    "lang": "javascript",
    "timeout": 500,
    "page_lenth": 5,
    "per_page": 50
}

var data = {
	users: {},
	questions: {},
	answers: {}
};

function make_folders() {
	if (!fs.existsSync("files/")) {
		fs.mkdirSync("files/", { recursive: true }, function(err){
			if (err) {
				return console.error(err);
			}
		});
	}
	if (!fs.existsSync("files/"+options.lang)) {
		fs.mkdirSync("files/"+options.lang, { recursive: true }, function(err){
			if (err) {
				return console.error(err);
			}
		});
	}
}

function read_json_data() {
	try {
		data.users = JSON.parse(fs.readFileSync("files/"+options.lang+"/users.json"));
	} catch (err) {}
	try {
		data.questions = JSON.parse(fs.readFileSync("files/"+options.lang+"/questions.json"));
	} catch (err) {}
	try {
		data.answers = JSON.parse(fs.readFileSync("files/"+options.lang+"/answers.json"));
	} catch (err) {}
}

function save_data() {
	fs.writeFile('files/'+options.lang+'/users.json', JSON.stringify(data.users, null, 4), (err) => {
		if (err) throw err
		console.log('The users file has been saved!')
	})
	fs.writeFile('files/'+options.lang+'/questions.json', JSON.stringify(data.questions, null, 4), (err) => {
		if (err) throw err
		console.log('The questions file has been saved!')
	})
	fs.writeFile('files/'+options.lang+'/answers.json', JSON.stringify(data.answers, null, 4), (err) => {
		if (err) throw err
		console.log('The answers file has been saved!')
	})
}

function push_question(question) {
	data.questions[question.id] = {
		title: question.title,
        body: question.body,
		link: question.link,
	};
}

function push_user(user) {
	data.users[user.id] = {
		display_name: user.display_name,
		reputation: user.reputation,
		link: user.link,
		profile_image: user.profile_image
	};
}

function push_answer(answer) {
	data.answers[answer.id] = {
		score: answer.score,
		questions_question_id: answer.question_id,
		user_id: answer.user_id
	};
}

var user_crawler = new Crawler({
    maxConnections : 10,
    rateLimit: options.timeout,
    callback : function (error, res, done) {
        if (error){
            console.log(error);
        } else {
            var $ = res.$;

            display_name = $("#user-card .profile-user--name div").text();
            reputation = $("#avatar-card .grid__center .fs-title").text().replace(',','');
            link = $("#avatar-card a").attr("href");
            profile_image = $("#avatar-card img").attr("src");
            user = {
                id: res.options.user_id,
                display_name: display_name,
                reputation: reputation,
                link: link,
                profile_image: profile_image
            }
            push_user(user);
            save_data();
        }
        done();
    }
});

var question_crawler = new Crawler({
    maxConnections : 10,
    rateLimit: options.timeout,
    callback : function (error, res, done) {
        if (error){
            console.log(error);
        } else {
            var $ = res.$;
            
            user_link = $("#question .user-details a").attr("href");
            user_id = user_link.split("/")[2];
            user_link = options.url+user_link;
            user_crawler.queue({
                uri:user_link,
                user_id:user_id
            });

            question_id = $("#question").attr("data-questionid");
            question_title = $("#question-header h1 a").text();
            question_body = $("#question .post-text").text();
            question_link = options.url+$("#question-header h1 a").attr("href");
            question = {
                id: question_id,
                title: question_title,
                body: question_body,
                link: question_link,
                user_id: user_id
            }
            push_question(question);
            save_data();

            answer_crawler.queue({
                uri: question_link,
                question_id: question_id
            });
        }
        done();
    }
});

var answer_crawler = new Crawler({
    maxConnections : 10,
    rateLimit: options.timeout,
    callback : function (error, res, done) {
        if (error){
            console.log(error);
        } else {
            var $ = res.$;

            $("#answers .answer").each(function() {
                answer_base = $(this);
                $(this).find(".user-details").each(function() {
                    if ($(this).attr("itemprop") == "author") {
                        user_link = $(this).find("a").attr("href");
                        user_id = user_link.split("/")[2];
                        user_link = options.url+user_link;
                        user_crawler.queue({
                            uri:user_link,
                            user_id:user_id
                        });

                        answer_id = answer_base.attr("data-answerid");
                        answer_score = answer_base.find(".js-vote-count").attr("data-value");
                        question_id = res.options.question_id;
                        answer = {
                            id: answer_id,
                            score: answer_score,
                            question_id: question_id,
                            user_id: user_id
                        }
                        push_answer(answer);
                        save_data();
                    }
                });
            });

        }
        done();
    }
});

var search_crawler = new Crawler({
    maxConnections : 10,
    rateLimit: options.timeout,
    callback : function (error, res, done) {
        if (error){
            console.log(error);
        } else {
            var $ = res.$;
            $("#questions .question-hyperlink").each(function() {
                link = options.url+$(this).attr("href");
                question_crawler.queue(link);
            });
        }
        done();
    }
});

make_folders();
read_json_data();

for (let index = 1; index <= options.page_lenth; index++) {
    search_crawler.queue(options.url+'/questions/tagged/'+options.lang+'?sort=newest&page='+index+'&pagesize='+options.per_page);
}

// question_crawler.queue("https://stackoverflow.com/questions/56101594/how-to-remove-all-url-hashes-except-first");