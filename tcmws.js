#!/usr/bin/env node

"use strict";

const request = require('request');

// See <http://www.tcm.com/tcmws/v1/docs/welcome.html>
const tcmws_base = 'http://www.tcm.com/tcmws/v1'

function showTitle(titleId) {
    const options = {
        url: `${tcmws_base}/title/${titleId}.json`,
        json: true
    };
    request.get(options, (error, response, body) => {
        if (error) {
            console.log(error);
        }
        else if (response.statusCode == 200) {
            const title = body.tcm.title;
            console.log(`Title: ${title.name}`);
            console.log(`Description: ${title.description}`);
            console.log(`Genres: ${title.genres.join(', ')}`);
        }  
        else {
            console.log(`Unexpected response status ${response.statusCode}`);
        }
    });
}

function showCredits(titleId) {
    const options = {
        url: `${tcmws_base}/title/${titleId}/credits.json`,
        json: true
    };
    request.get(options, (error, response, body) => {
        if (error) {
            console.log(error);
        }
        else if (response.statusCode == 200) {
            const credits = body.tcm.title.credits;
            console.log(`Directors: ${names(directors(credits))}`);
            console.log(`Writers: ${names(writers(credits))}`);
            console.log(`Actors: ${names(actors(credits))}`);
        }  
        else {
            console.log(`Unexpected response status ${response.statusCode}`);
        }
    });
}

// For an array of elements, return names separated by commas
function names(arr) {
    return arr.map(x => x.name).join(', ');
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

function showWhatsOnNow() {
    const options = {
        url: `${tcmws_base}/schedule/whatsOnNow/us.json`,
        json: true
    };
    request.get(options, (error, response, body) => {
        if (error) {
            console.log(error);
        }
        else if (response.statusCode == 200) {
            const titleId = body.tcm.schedule.whatsOnNow.titleId;
            showTitle(titleId);
            showCredits(titleId);
        }  
        else {
            console.log(`Unexpected response status ${response.statusCode}`);
        }
    });
}

showWhatsOnNow()

