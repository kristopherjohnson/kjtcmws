#!/usr/bin/env node

// This script retrieves the next week of scheduled movie airings from Turner
// Classic Movies (TCM) and displays those movies that match a set of favorite
// genres, actors, or directors, or have four-star ratings from Leonard Maltin.

"use strict";

const async = require('async');
const dateformat = require('dateformat');
const request = require('request');

// See <http://www.tcm.com/tcmws/v1/docs/welcome.html>
// for web service interface details.
const tcmwsBase = 'http://www.tcm.com/tcmws/v1';

const numberOfDays = 7;

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
    'Alan Arkin',
    'Alec Guinness',
    'Anthony Hopkins',
    'Anthony Perkins',
    'Anthony Quinn',
    'Ava Gardner',
    'Barbara Stanwyck',
    'Basil Rathbone',
    'Bela Lugosi',
    'Bette Davis',
    'Boris Karloff',
    'Burt Lancaster',
    'Cary Grant',
    'Cesar Romero',
    'Charles Laughton',
    'Christopher Lee',
    'Claire Trevor',
    'Claude Rains',
    'Clint Eastwood',
    'David Niven',
    'Dean Martin',
    'Deborah Kerr',
    'Edward G. Robinson',
    'Fred MacMurray',
    'Fredric March',
    'Gary Cooper',
    'Gene Hackman',
    'Gene Tierney',
    'Gene Wilder',
    'George Sanders',
    'Glenn Ford',
    'Greer Garson',
    'Gregory Peck',
    'Groucho Marx',
    'Harry Belafonte',
    'Hedy Lamarr',
    'Henry Fonda',
    'Humphrey Bogart',
    'Ingrid Bergman',
    'Jack Lemmon',
    'James Coburn',
    'James Garner',
    'James Stewart',
    'Jean Arthur',
    'Joan Fontaine',
    'John Carradine',
    'Kirk Douglas',
    'Lana Turner',
    'Lauren Bacall',
    'Lawrence Tierney',
    'Lee Van Cleef',
    'Marlene Dietrich',
    "Maureen O'Hara",
    'Max Von Sydow',
    'Orson Welles',
    'Paul Newman',
    'Peter Cushing',
    'Peter Lorre',
    "Peter O'Toole",
    'Peter Sellers',
    'Richard Crenna',
    'Richard Harris',
    'Richard Pryor',
    'Rita Hayworth',
    'Robert Montgomery',
    'Ronald Colman',
    'Robert Redford',
    'Sammy Davis Jr.',
    'Sean Connery',
    'Sidnwy Poitier',
    'Sophia Loren',
    'Steve McQueen',
    'Sydney Greenstreet',
    'Tony Curtis',
    'Toshiro Mifune',
    'Vera Miles',
    'Vincent Price',
    'William Holden',
    'William Powell',
];

const favoriteDirectors = [
    'Akria Kurosawa',
    'Alfred Hitchcock',
    'Billy Wilder',
    'David Lean',
    'Francis Ford Coppola',
    'James Whale',
    'John Ford',
    'John Frankenheimer',
    'John Huston',
    'John Sturges',
    'Mel Brooks',
    'Oliver Stone',
    'Orson Welles',
    'Otto Preminger',
    'Robert Altman',
    'Sam Peckinpah',
    'Sergio Leone',
    'Sidney Lumet',
    'Stanley Kubrick',
    'Terence Fisher',
    'Woody Allen',
];

const isFavoriteGenre = {};
favoriteGenres.forEach(x => isFavoriteGenre[x] = true);

const isFavoriteActor = {};
favoriteActors.forEach(x => isFavoriteActor[x] = true);

const isFavoriteDirector = {};
favoriteDirectors.forEach(x => isFavoriteDirector[x] = true);

// Return true if the program matches any of our favorite genres, actors, or directors.
function matchesFavorites(program, title, credits) {
    return title.genres.some(genre => isFavoriteGenre[genre]) ||
        names(actors(credits)).some(actor => isFavoriteActor[actor]) ||
        names(directors(credits)).some(director => isFavoriteDirector[director]);
}

// Return current date, e.g., '2016-10-25'
function currentDateString() {
    const now = new Date();
    return dateformat(now, 'yyyy-mm-dd');
}

// Return 'name' property of array elements.
function names(arr) {
    return arr.map(x => x.name);
}

// Return names as a comma-separated string.
function namesString(arr) {
    return names(arr).join(', ');
}

// Retrieve title information from web service.
// Callback takes arguments (error, title).
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

// Retrieve credits information from web service.
// Callback takes arguments (error, credits).
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

// Get additional data for a title.  Callback takes arguments (error, title, credits).
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
            }
        ],
        (error, results) => {
            if (error) {
                callback(error);
            }
            else {
                callback(null, results[0], results[1]);
            }
        }
    );
}

// Get daily schedules.
// Callback takes arguments (error, schedulesArray).
function getSchedules(callback) {
    const options = {
        url: `${tcmwsBase}/schedule/us/est/${currentDateString()}.json?days=${numberOfDays}&includes=maltin`,
        json: true
    }
    request.get(options, (error, response, body) => {
        if (error) {
            callback(error);
        }
        else if (response.statusCode == 200) {
            callback(null, body.tcm.schedules);
        }
        else {
            callback(new Error(`Unexpected status code ${response.statusCode}`));
        }
    });
}

function logTitle(title) {
    console.log(`Description: ${title.description}`);
    console.log(`Genres: ${title.genres.join(', ')}`);
}

function logCredits(credits) {
    console.log(`Directed by: ${namesString(directors(credits)) || 'N/A'}`);
    console.log(`Written by: ${namesString(writers(credits)) || 'N/A'}`);
    console.log(`Cast: ${namesString(actors(credits)) || 'N/A'}`);
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

function isFourStarMaltinRating(maltin) {
    return (maltin && maltin.rating == '****');
}

function logMaltinRating(maltin) {
    if (maltin && maltin.rating) {
        console.log(`Maltin Rating: ${maltin.rating}`);
    }
}

function showProgramIfInteresting(program, callback) {
    const titleId = program.titleId;
    getTitleInfo(program.titleId, (error, title, credits, review) => {
        if (error) {
            console.log(error);
            callback(error);
        }
        else {
            if (isFourStarMaltinRating(program.maltin) || matchesFavorites(program, title, credits)) {
                console.log('');
                console.log(`${program.time} - ${program.name} (${program.releaseYear})`);
                logTitle(title);
                logCredits(credits);
                logMaltinRating(program.maltin);
            }
            callback();
        }
    });
}

function showSchedule(schedule, callback) {
    console.log('');
    console.log('----------');
    console.log(schedule.startDate);
    console.log('----------');
    async.eachSeries(schedule.programs, showProgramIfInteresting, callback);
}

function showSchedules() {
    getSchedules((error, schedules) => {
        if (error) {
            console.log(error);
        }
        else {
            async.eachSeries(schedules, showSchedule);
        }
    });
}

showSchedules();

// vim: set ts=8 sw=4 tw=0 et :
