var args = require('yargs').argv;
var Crawler = require("crawler");
var fs = require('fs');
var csvWriter = require('csv-write-stream')

const URL = "https://stackoverflow.com";

var options = {
    "lang": args.language || "",
    "sort": args.sort || "newest",
    "timeout": args.timeout || 3000,
    "init_page": args.begin || 1,
    "end_page": args.end || 1,
    "per_page": args.size || 50
}

const writer = {}

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
	make_files();
}

function make_files() {
	if (!fs.existsSync("files/"+options.lang+"/users.csv")) {
        users_writer = csvWriter({ headers: ["id", "display_name", "reputation", "gold_badges", "silver_badges", "bronze_badges", "link"]});
	} else {
		users_writer = csvWriter({sendHeaders: false});
	}

	if (!fs.existsSync("files/"+options.lang+"/questions.csv")) {
        questions_writer = csvWriter({ headers: ["id", "title", "body", "views", "score", "link", "creation_date", "tags", "user_id"]});
	} else {
		questions_writer = csvWriter({sendHeaders: false});
	}

	if (!fs.existsSync("files/"+options.lang+"/answers.csv")) {
        answers_writer = csvWriter({ headers: ["id", "score", "creation_date", "question_id", "user_id"]});
	} else {
		answers_writer = csvWriter({sendHeaders: false});
	}

	if (!fs.existsSync("files/"+options.lang+"/codes.csv")) {
		codes_writer = csvWriter({ headers: ["answer_id", "code"]});
	} else {
		codes_writer = csvWriter({sendHeaders: false});
	}

	writer.users = users_writer;
	writer.questions = questions_writer;
	writer.answers = answers_writer;
	writer.codes = codes_writer;

	writer.users.pipe(fs.createWriteStream("files/"+options.lang+"/users.csv", {flags: 'a'}));
	writer.questions.pipe(fs.createWriteStream("files/"+options.lang+"/questions.csv", {flags: 'a'}));
	writer.answers.pipe(fs.createWriteStream("files/"+options.lang+"/answers.csv", {flags: 'a'}));
	writer.codes.pipe(fs.createWriteStream("files/"+options.lang+"/codes.csv", {flags: 'a'}));
}

function push_user(user) {
	writer.users.write({
		id: user.id,
        display_name: user.display_name,
        reputation: parseInt(user.reputation),
        gold_badges: parseInt(user.gold_badges),
        silver_badges: parseInt(user.silver_badges),
        bronze_badges: parseInt(user.bronze_badges),
        link: user.link
    });
    console.log('Users file has been updated!');
}

function push_question(question) {
	writer.questions.write({
		id: question.id,
        title: question.title,
        body: question.body,
        views: parseInt(question.views),
        score: parseInt(question.score),
        link: question.link,
        creation_date: question.creation_date,
        tags: question.tags,
        user_id: question.user_id
    });
    console.log('Questions file has been updated!');
}

function push_answer(answer) {
	writer.answers.write({
		id: answer.id,
        score: parseInt(answer.score),
        creation_date: answer.creation_date,
        codes: answer.codes,
		question_id: answer.question_id,
		user_id: answer.user_id
    });
    console.log('Answers file has been updated!');
}

function push_code(answer_id, code) {
	writer.codes.write({
		answer_id: answer_id,
		code: code
    });
    console.log('Codes file has been updated!');
}

function get_user($, user_info) {
    user_link = URL+user_info.find(".user-details a").attr("href");
    user_id = user_link.split("/")[4];
    user_display_name = user_info.find(".user-details a").text();
    reputation = gold_badges = silver_badges = bronze_badges = 0;
    user_info.find(".user-details .-flair span").map(function() {
        if ($(this).attr("title")){
            temp = $(this).attr("title").split(" ");
            if (temp[1] =="score"){
                if (temp[2]) {
                    reputation = temp[2];
                } else {
                    reputation = $(this).text();
                }
                reputation = reputation.replace(',','');
            } else if (temp[1] == "gold") {
                gold_badges = temp[0];
            } else if (temp[1] == "silver") {
                silver_badges = temp[0];
            } else if (temp[1] == "bronze") {
                bronze_badges = temp[0];
            }
        }
    });
    return {
        id: user_id,
        display_name: user_display_name,
        reputation: reputation,
        gold_badges: gold_badges,
        silver_badges: silver_badges,
        bronze_badges: bronze_badges,
        link: user_link
    }
}

function get_question($, user, user_id) {
    question_id = $("#question").attr("data-questionid");
    question_title = $("#question-header h1 a").text();
    question_body = $("#question .post-text").text();
    question_score = $("#question .js-vote-count").text();
    question_info = $("#qinfo tr td b").map(function() {
        return $(this);
    }).toArray();
    question_creation = user.find(".user-action-time span").attr("title");
    question_views = question_info[1].text().split(" ")[0].replace(',', '');
    question_link = URL+$("#question-header h1 a").attr("href");
    question_tags = $("#question .post-taglist a").map(function() {
        return $(this).text();
    }).toArray();
    return {
        id: question_id,
        title: question_title,
        body: question_body,
        views: question_views,
        score: question_score,
        link: question_link,
        creation_date: question_creation,
        tags: question_tags,
        user_id: user_id
    }
}

function get_answer($, answer, user, user_id, question_id) {
    answer_id = answer.attr("data-answerid");
    answer_score = answer.find(".js-vote-count").attr("data-value");
    answer_codes = answer.find(".post-text code").map(function() {
        return $(this).text();
    }).toArray();
    answer_creation = user.find(".user-action-time span").attr("title");
    for (let index = 0; index < answer_codes.length; index++) {
        push_code(answer_id, answer_codes[index])
    }
    return {
        id: answer_id,
        score: answer_score,
        creation_date: answer_creation,
        question_id: question_id,
        user_id: user_id
    }
}

var question_crawler = new Crawler({
    maxConnections : 10,
    rateLimit: options.timeout,
    callback : function (error, res, done) {
        if (error){
            console.log(error);
        } else {
            var $ = res.$;

            user_info = $("#question .user-info").map(function() {
                if ($(this).find(".user-details").attr("itemprop") == "author") {
                    return $(this);
                }
            }).toArray()[0];

            if (user_info !== undefined) {
                user = get_user($, user_info);
                question = get_question($, user_info, user.id);
                push_user(user);
                push_question(question);

                pages_count = $("#answers .pager-answers a").map(function() {
                    return $(this);
                }).toArray().length/2 || 1;
                for (let index = 1; index <= pages_count; index++) {
                    answer_crawler.queue({
                        uri: question_link+'?page='+index+'&tab=oldest#tab-top',
                        question_id: question_id
                    });
                }
            }
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
                user_info = $(this).find(".user-info").map(function() {
                    if ($(this).find(".user-details").attr("itemprop") == "author") {
                        return $(this);
                    }
                }).toArray()[0];

                if (user_info !== undefined) {
                    user = get_user($, user_info);
                    answer = get_answer($, $(this), user_info, user.id, res.options.question_id);
                    push_user(user);
                    push_answer(answer);
                }
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
                link = URL+$(this).attr("href");
                question_crawler.queue(link);
            });
        }
        done();
    }
});

make_folders();

if (args.url){
    question_crawler.queue(args.url);
} else {
    for (let index = options.init_page; index <= options.end_page; index++) {
        search_crawler.queue(URL+'/questions/tagged/'+options.lang+'?sort='+options.sort+'&page='+index+'&pagesize='+options.per_page);
    }    
}
