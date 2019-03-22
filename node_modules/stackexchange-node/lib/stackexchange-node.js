'use strict';

var util = require('utile');
var config = require('./config');
var search = require('./methods/search');
var questions = require('./methods/questions');
var answers = require('./methods/answers');
var users = require('./methods/users');
var tags = require('./methods/tags');

/**
 * Initialize StackExchange API.
 *
 * @Constructor
 * @param {Object} options
 * @api public
 */
module.exports = function StackExchange(options) {
    // Mitigate options to config.
    this.config = config;
    Object.keys(options || {}).forEach(function setConfig(key) {
        config.set(key, options[key]);
    });

    // Expose methods.
    this.search = search;
    this.questions = questions;
    this.answers = answers;
    this.users = users;
    this.tags = tags;
};

// END OF LINE
