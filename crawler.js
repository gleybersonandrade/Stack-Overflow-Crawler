var args = require('yargs').argv;
var Crawler = require("crawler");
var fs = require('fs');

const URL = "https://stackoverflow.com";

var options = {
    "lang": args.language || "",
    "sort": args.sort || "newest",
    "timeout": args.timeout || 5000,
    "init_page": args.init || 1,
    "end_page": args.end || 1,
    "per_page": args.size || 50
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
		if (err) throw err;
	})
	fs.writeFile('files/'+options.lang+'/questions.json', JSON.stringify(data.questions, null, 4), (err) => {
		if (err) throw err;
	})
	fs.writeFile('files/'+options.lang+'/answers.json', JSON.stringify(data.answers, null, 4), (err) => {
		if (err) throw err;
    })
    
    console.log('Files have been updated!' +
        ' USERS: '+Object.keys(data.users).length +
        ' QUESTIONS: '+Object.keys(data.questions).length +
        ' ANSWERS: '+Object.keys(data.answers).length
    );
}

function push_question(question) {
	data.questions[question.id] = {
		title: question.title,
        body: question.body,
        views: parseInt(question.views),
        score: parseInt(question.score),
        link: question.link,
        creation_date: question.creation_date,
        tags: question.tags,
        user_id: question.user_id
	};
}

function push_user(user) {
	data.users[user.id] = {
        display_name: user.display_name,
        role: user.role,
        bio: bio,
        profile_image: user.profile_image,
        reputation: parseInt(user.reputation),
        gold_badges: parseInt(user.gold_badges),
        silver_badges: parseInt(user.silver_badges),
        bronze_badges: parseInt(user.bronze_badges),
        link: user.link
	};
}

function push_answer(answer) {
	data.answers[answer.id] = {
        score: parseInt(answer.score),
        creation_date: answer.creation_date,
        codes: answer.codes,
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
            role = $("#user-card .profile-user--role").text();
            bio = $("#user-card .profile-user--bio p").text();
            reputation = $("#avatar-card .grid__center .fs-title").text().replace(',','');
            gold_badges = silver_badges = bronze_badges = 0;
            $("#avatar-card .grid__fl1 .ai-center").map(function() {
                temp = $(this).attr("title").split(" ");
                if (temp[1] == "gold") {
                    gold_badges = temp[0];
                } else if (temp[1] == "silver") {
                    silver_badges = temp[0];
                } else if (temp[1] == "bronze") {
                    bronze_badges = temp[0];
                }
            });

            link = $("#avatar-card a").attr("href");
            profile_image = $("#avatar-card img").attr("src");
            user = {
                id: res.options.user_id,
                display_name: display_name,
                role: role,
                bio: bio,
                profile_image: profile_image,
                reputation: reputation,
                gold_badges: gold_badges,
                silver_badges: silver_badges,
                bronze_badges: bronze_badges,
                link: link
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

            user = $("#question .user-info").map(function() {
                if ($(this).find(".user-details").attr("itemprop") == "author") {
                    return $(this);
                }
            }).toArray()[0];
            if (user !== undefined) {
                user_link = URL+user.find(".user-details a").attr("href");
                user_id = user_link.split("/")[4];
                user_crawler.queue({
                    uri:user_link,
                    user_id:user_id
                });

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
                question = {
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
                push_question(question);
                save_data();

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
                user = $(this).find(".user-info").map(function() {
                    if ($(this).find(".user-details").attr("itemprop") == "author") {
                        return $(this);
                    }
                }).toArray()[0];
                if (user !== undefined) {
                    user_link = URL+user.find(".user-details a").attr("href");
                    user_id = user_link.split("/")[4];
                    user_crawler.queue({
                        uri:user_link,
                        user_id:user_id
                    });

                    answer_id = $(this).attr("data-answerid");
                    answer_score = $(this).find(".js-vote-count").attr("data-value");
                    answer_codes = $(this).find(".post-text code").map(function() {
                        return $(this).text();
                    }).toArray()
                    answer_creation = user.find(".user-action-time span").attr("title");
                    question_id = res.options.question_id;
                    answer = {
                        id: answer_id,
                        score: answer_score,
                        creation_date: answer_creation,
                        codes: answer_codes,
                        question_id: question_id,
                        user_id: user_id
                    }
                    push_answer(answer);
                    save_data();
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
read_json_data();

if (args.url){
    question_crawler.queue(args.url);
} else {
    for (let index = options.init_page; index <= options.end_page; index++) {
        search_crawler.queue(URL+'/questions/tagged/'+options.lang+'?sort='+options.sort+'&page='+index+'&pagesize='+options.per_page);
    }    
}
