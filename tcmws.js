#!/usr/bin/env node

// This script retrieves the next week of scheduled movie airings from Turner
// Classic Movies (TCM) and displays those movies that match a set of favorite
// genres, actors, directors, or screenwriters, or have four-star ratings from
// Leonard Maltin.

"use strict";

const async = require('async');
const dateformat = require('dateformat');
const fs = require('fs');
const handlebars = require('handlebars');
const request = require('request');

// By default, print schedules for a week.
var numberOfDays = 7;

// By default, write to stdout
var outs = process.stdout;

// Unique identifier for each program processed by fillProgramData()
var nextProgramId = 1;

// See <http://www.tcm.com/tcmws/v1/docs/welcome.html>
// for web service interface details.
const tcmwsBase = 'http://www.tcm.com/tcmws/v1';

// Search for text on www.tcm.com
const tcmSearchPrefix = 'http://www.tcm.com/search/?text='

// List of available genres: <http://www.tcm.com/tcmws/v1/schedule/genres.json>
const favoriteGenres = [
    'Black Comedy',
    'Crime',
    'Film Noir',
    'Horror',
    'Minority',
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
    'Angie Dickinson',
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
    'Dick Powell',
    'Edward G. Robinson',
    'Eli Wallach',
    'Fred MacMurray',
    'Fredric March',
    'Gabriel Byrne',
    'Gary Cooper',
    'Gene Hackman',
    'Gene Tierney',
    'Gene Wilder',
    'George Hamilton',
    'George Sanders',
    'Glenn Ford',
    'Gloria Grahame',
    'Greer Garson',
    'Gregory Peck',
    'Groucho Marx',
    'Harry Belafonte',
    'Hedy Lamarr',
    'Henry Fonda',
    'Honor Blackman',
    'Humphrey Bogart',
    'Ingrid Bergman',
    'Jack Lemmon',
    'James Coburn',
    'James Garner',
    'James Stewart',
    'Jean Arthur',
    'Joan Fontaine',
    'John Carradine',
    'John Cusack',
    'Kirk Douglas',
    'Lana Turner',
    'Lauren Bacall',
    'Lawrence Tierney',
    'Lee Van Cleef',
    'Marlene Dietrich',
    "Maureen O'Hara",
    'Max Von Sydow',
    'Melvyn Douglas',
    'Michael Caine',
    'Orson Welles',
    'Paul Newman',
    'Peter Cushing',
    'Peter Lorre',
    "Peter O'Toole",
    'Peter Sellers',
    'Richard Crenna',
    'Richard Harris',
    'Richard Pryor',
    'Richard Widmark',
    'Rita Hayworth',
    'Robert Montgomery',
    'Ronald Colman',
    'Robert Redford',
    'Robert Vaughn',
    'Sammy Davis Jr.',
    'Sean Connery',
    'Sidney Poitier',
    'Sophia Loren',
    'Steve McQueen',
    'Sydney Greenstreet',
    'Tony Curtis',
    'Toshiro Mifune',
    'Vera Miles',
    'Vincent Price',
    'William Holden',
    'William Powell',
    'Yvonne De Carlo',
];

const favoriteDirectors = [
    'Akria Kurosawa',
    'Alfred Hitchcock',
    'Billy Wilder',
    'David Lean',
    'Ethan Coen',
    'Francis Coppola',
    'Howard Hawks',
    'James Whale',
    'Joel Coen',
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
    'Walter Hill',
    'Woody Allen',
];

const favoriteWriters = [
    'Ben Hecht',
    'Dashiell Hammett',
    'David Mamet',
    'Dorothy B. Hughes',
    'Ethan Coen',
    'Jay Dratler',
    'Jo Eisinger',
    'Joel Coen',
    'Jules Furthman',
    'Lawrence Kasdan',
    'Leigh Brackett',
    'Orson Welles',
    'Preston Sturges',
    'Raymond Chandler',
    'Rod Serling',
    'W. R. Burnett',
    'Walter Hill',
];

const isFavoriteGenre = {};
favoriteGenres.forEach(x => isFavoriteGenre[x] = true);

const isFavoriteActor = {};
favoriteActors.forEach(x => isFavoriteActor[x] = true);

const isFavoriteDirector = {};
favoriteDirectors.forEach(x => isFavoriteDirector[x] = true);

const isFavoriteWriter = {};
favoriteWriters.forEach(x => isFavoriteWriter[x] = true);

// Return true if the program matches any of our favorite genres, actors, directors, or writers.
function matchesFavorites(program, title, credits) {
    return title.genres.some(genre => isFavoriteGenre[genre]) ||
        names(actors(credits)).some(actor => isFavoriteActor[actor]) ||
        names(directors(credits)).some(director => isFavoriteDirector[director]) ||
        names(writers(credits)).some(writer => isFavoriteWriter[writer]);
}

// Return current date, e.g., '2016-10-25'
function currentDateString() {
    const now = new Date();
    return dateformat(now, 'yyyy-mm-dd');
}

// Return 'name' property values of array elements.
function names(arr) {
    return arr.map(x => x.name);
}

// Return names from an array of objects, as a comma-separated string.
function namesString(arr) {
    return names(arr).join(', ');
}

// Extract the actor objects from credits.
function actors(credits) {
    return credits.filter(x => x.roleName == 'ACTOR');
}

// Extract the director objects from credits.
function directors(credits) {
    return credits.filter(x => x.roleName == 'DIRECTOR');
}

// Extract the writer objects from credits.
function writers(credits) {
    return credits.filter(x => x.roleName == 'WRITER');
}

// Extract the cinematographers from credits.
function cinematographers(credits) {
    return credits.filter(x => x.roleCategory == 'Cinematography');
}

function isFourStarMaltinRating(maltin) {
    return maltin && (maltin.rating == '****');
}

// Make a request for JSON data.
// Callback takes arguments (error, body), where body is a JSON object.
function getJSON(url, callback) {
    const options = {
        url: url,
        json: true
    };
    request.get(options, (error, response, body) => {
        if (!error && response.statusCode != 200) {
            error = new Error(`Unexpected response status code ${response.statusCode}`);
            body = null;
        }
        callback(error, body);
    });
}

// Retrieve title information from web service.
// Callback takes arguments (error, title).
function getTitle(titleId, callback) {
    const url = `${tcmwsBase}/title/${titleId}.json`;
    getJSON(url, (error, body) => {
        const title = error ? null : body.tcm.title;
        callback(error, title);
    });
}

// Retrieve credits information from web service.
// Callback takes arguments (error, credits).
function getCredits(titleId, callback) {
    const url = `${tcmwsBase}/title/${titleId}/credits.json`;
    getJSON(url, (error, body) => {
        const credits = error ? null : body.tcm.title.credits;
        callback(error, credits);
    });
}

// Get additional data for a title.  Callback takes arguments (error, title, credits).
function getDataForTitleId(titleId, callback) {
    async.parallel(
        [
            done => getTitle(titleId, done),
            done => getCredits(titleId, done)
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
    const url = `${tcmwsBase}/schedule/us/est/${currentDateString()}.json?days=${numberOfDays}&includes=maltin`;
    getJSON(url, (error, body) => {
        var schedules = error ? null : body.tcm.schedules;
        callback(error, schedules);
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

function logMaltinRating(maltin) {
    if (maltin && maltin.rating) {
        console.log(`Maltin Rating: ${maltin.rating}`);
    }
}

function logProgramIfInteresting(program, callback) {
    const titleId = program.titleId;
    getDataForTitleId(program.titleId, (error, title, credits, review) => {
        if (error) {
            console.log(error);
        }
        else {
            if (isFourStarMaltinRating(program.maltin) || matchesFavorites(program, title, credits)) {
                console.log('');
                console.log(`${program.time} - ${program.name} (${program.releaseYear})`);
                logTitle(title);
                logCredits(credits);
                logMaltinRating(program.maltin);
            }
        }
        callback(error);
    });
}

function logSchedule(schedule, callback) {
    console.log('');
    console.log('----------');
    console.log(schedule.startDate);
    console.log('----------');
    async.eachSeries(schedule.programs, logProgramIfInteresting, callback);
}

function logSchedules() {
    getSchedules((error, schedules) => {
        if (error) {
            console.log(error);
        }
        else {
            async.eachSeries(schedules, logSchedule);
        }
    });
}

// HTML output

// For each 'programs' element in 'schedules', request title and credits data
// and then add 'genres', 'actors', 'directors', and 'writers' lists to
// the program, and set 'isAMatch' if the program meets our criteria, and
// add a unique 'programId'.
//
// If there are more than 20 actors, the 'actors' array will contain
// the first 20, and the remainder will be in an 'actorsOverflow' array.
function fillProgramData(programs, callback) {
    async.eachSeries(
        programs,
        (program, done) => {
            getDataForTitleId(program.titleId, (error, title, credits) => {
                if (error) {
                    console.log(error);
                }
                else {
                    // Change a title like "Lone Ranger, The" to "The Lone Ranger"
                    // or "Cry in the Night, A" to "A Cry in the Night"
                    if (program.name.endsWith(', The')) {
                        program.name = 'The ' + program.name.substr(0, program.name.length - 5);
                    }
                    if (program.name.endsWith(', A')) {
                        program.name = 'A ' + program.name.substr(0, program.name.length - 3);
                    }
                    if (program.name.endsWith(', An')) {
                        program.name = 'An ' + program.name.substr(0, program.name.length - 4);
                    }
                    program.programId = nextProgramId++;
                    program.genres = title.genres;
                    program.directors = directors(credits);
                    program.writers = writers(credits);
                    program.cinematographers = cinematographers(credits);
                    program.isAMatch = isFourStarMaltinRating(program.maltin) || matchesFavorites(program, title, credits);

                    const allActors = actors(credits);
                    const maxActors = 20;
                    if (allActors.length > maxActors) {
                        program.actors = allActors.slice(0, maxActors);
                        program.actorsOverflow = allActors.slice(maxActors);
                    }
                    else {
                        program.actors = allActors;
                    }
                }
                done(error);
            });
        },
        (error) => {
            callback(error);
        }
    );
}

// Handlebars expression {{timestamp}} for current date/time.
handlebars.registerHelper('timestamp', function() {
    return new Date().toString();
})

// Handlebars expression {{tcmSearchPerson name}} for URL for searching for a person in TCM database.
handlebars.registerHelper('tcmSearchPerson', function(name) {
    return new handlebars.SafeString(tcmSearchPrefix + encodeURIComponent(name) + '&type=participant');
});

// Handlebars expression {{tcmSearchtitle title}} for URL for searching for a title in the TCM database.
handlebars.registerHelper('tcmSearchTitle', function(title) {
    return new handlebars.SafeString(tcmSearchPrefix + encodeURIComponent(title) + '&type=title');
});

// Use {{ratingStars rating}} to convert the Maltin rating asterisks and '1/2'
// to graphic characters.
handlebars.registerHelper('ratingStars', function(rating) {
    return rating.replace(new RegExp('\\*', 'g'), '\u2605').replace('1/2', '\u00bd');
});

function htmlSchedules() {
    getSchedules((error, schedules) => {
        if (error) {
            console.log(error);
        }
        else {
            async.eachSeries(
                schedules,
                (schedule, done) => fillProgramData(schedule.programs, done),
                (error) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        fs.readFile('template.html', 'utf-8', (error, source) => {
                            const template = handlebars.compile(source);
                            const html = template({ schedules: schedules });
                            outs.write(html)
                        });
                    }
                }
            );
        }
    });
}

// Command-line arguments
const argv = require('yargs')
    .strict()
    .usage('Usage: $0 [options]')
    .boolean('html')
    .describe('html', 'Produce HTML output')
    .string('output')
    .alias('o', 'output')
    .describe('output', 'Specify output file path')
    .number('days')
    .alias('n', 'days')
    .default('days', 7)
    .describe('days', 'Number of days for schedules')
    .help('help')
    .alias('h', 'help')
    .example('$0', 'Write one-week text schedule to stdout')
    .example('$0 --html --o tcm.html -n14', 'Write two-week schedule to tcm.html')
    .argv;

if (argv.output) {
    outs = fs.createWriteStream(argv.output, {flags : 'w'});
}

numberOfDays = argv.days;

if (argv.html) {
    htmlSchedules();
}
else {
    logSchedules();
}

// vim: set ts=8 sw=4 tw=0 et :
