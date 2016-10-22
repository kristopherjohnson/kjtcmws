#!/usr/bin/env node

"use strict";

const async = require('async');
const request = require('request');

// See <http://www.tcm.com/tcmws/v1/docs/welcome.html>
const tcmwsBase = 'http://www.tcm.com/tcmws/v1';

// List of available genres: <http://www.tcm.com/tcmws/v1/schedule/genres.json>
const favoriteGenres = [
    'Black Comedy',
    'Crime',
    'Film Noir',
    'Horror',
    'Mystery',
    'Noir',
    'Sci-Fi',
    'Spy',
    'Thriller',
    'War',
    'Western',
];

const favoriteActors = [
    'Basil Rathbone',
    'Bela Lugosi',
    'Bette Davis',
    'Burt Lancaster',
    'Cary Grant',
    'Christopher Lee',
    'David Niven',
    'Gregory Peck',
    'Henry Fonda',
    'Humphrey Bogart',
    'Ingrid Bergman',
    'Katherine Hepburn',
    'Orson Welles',
    'Peter Cushing',
    'Peter Lorre',
    'Rita Hayworth',
    'Sydney Greenstreet',
];

const favoriteDirectors = [
    'Alfred Hitchcock',
    'David Lean',
    'John Sturges',
    'Orson Welles',
];

function names(arr) {
    return arr.map(x => x.name).join(', ');
}

// Retrieve title. Callback takes arguments (error, title).
function getTitle(titleId, callback) {
    const options = {
        url: `${tcmwsBase}/title/${titleId}.json`,
        json: true
    };
    request.get(options, (error, response, body) => {
        if (error) {
            callback(error);
        }
        else if (response.statusCode == 200) {
            callback(null, body.tcm.title);
        }
        else {
            callback(new Error(`Unexpected status code ${response.statusCode}`));
        }
    });
}

// Retrieve credits.  Callback takes arguments (error, credits),
// where credits is an array.
function getCredits(titleId, callback) {
    const options = {
        url: `${tcmwsBase}/title/${titleId}/credits.json`,
        json: true
    };
    request.get(options, (error, response, body) => {
        if (error) {
            callback(error);
        }
        else if (response.statusCode == 200) {
            callback(null, body.tcm.title.credits);
        }
        else {
            callback(new Error(`Unexpected status code ${response.statusCode}`));
        }
    });
}

// Retrieve Maltin review.  Callback takes arguments (error, review).
function getMaltinReview(titleId, callback) {
    const options = {
        url: `${tcmwsBase}/title/${titleId}/maltinReview.json`,
        json: true
    };
    request.get(options, (error, response, body) => {
        if (error) {
            callback(error);
        }
        else if (response.statusCode == 200) {
            callback(null, body.tcm.title.maltinReview);
        }
        else {
            callback(new Error(`Unexpected status code ${response.statusCode}`));
        }
    });
}

function getWhatsOnNow(callback) {
    const options = {
        url: `${tcmwsBase}/schedule/whatsOnNow/us.json`,
        json: true
    };
    request.get(options, (error, response, body) => {
        if (error) {
            callback(error);
        }
        else if (response.statusCode == 200) {
            callback(null, body.tcm.schedule.whatsOnNow);
        }
        else {
            callback(new Error(`Unexpected status code ${response.statusCode}`));
        }
    });
}

// Get all data for a title.  Callback takes arguments (error, title, credits, review).
function getTitleInfo(titleId, callback) {
    async.parallel(
        [
            done => {
                getTitle(titleId, (error, title) => {
                    if (error) {
                        done(error);
                    }
                    else {
                        done(null, title);
                    }
                });
            },
            done => {
                getCredits(titleId, (error, credits) => {
                    if (error) {
                        done(error);
                    }
                    else {
                        done(null, credits);
                    }
                });
            },
            done => {
                getMaltinReview(titleId, (error, review) => {
                    if (error) {
                        done(error);
                    }
                    else {
                        done(null, review);
                    }
                });
            }
        ],
        (error, results) => {
            if (error) {
                callback(error);
            }
            else {
                callback(null, results[0], results[1], results[2]);
            }
        }
    );
}

function logTitle(title) {
    console.log(`Title: ${title.name}`);
    console.log(`Description: ${title.description}`);
    console.log(`Genres: ${title.genres.join(', ')}`);
}

function logCredits(credits) {
    console.log(`Directors: ${names(directors(credits))}`);
    console.log(`Writers: ${names(writers(credits))}`);
    console.log(`Actors: ${names(actors(credits))}`);
}

function actors(credits) {
    return credits.filter(x => x.roleName == 'ACTOR');
}

function directors(credits) {
    return credits.filter(x => x.roleName == 'DIRECTOR');
}

function writers(credits) {
    return credits.filter(x => x.roleName == 'WRITER');
}

function logMaltinReview(review) {
    if (review.rating) {
        console.log(`Maltin Rating: ${review.rating}`);
    }
}

function showWhatsOnNow() {
    getWhatsOnNow((error, whatsOnNow) => {
        if (error) {
            console.log(error);
        }
        else {
            getTitleInfo(whatsOnNow.titleId, (error, title, credits, review) => {
                logTitle(title);
                logCredits(credits);
                logMaltinReview(review);
            });
        }
    });
}

showWhatsOnNow()

