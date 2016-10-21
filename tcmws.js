#!/usr/bin/env node

const request = require('request');

// See <http://www.tcm.com/tcmws/v1/docs/welcome.html>
const tcmws_base = 'http://www.tcm.com/tcmws/v1'

function showWhatsOnNow() {
    const options = {
        url: `${tcmws_base}/schedule/whatsOnNow/us.json`,
        json: true,
    };
    request.get(options, (error, response, body) => {
        if (error) {
            console.log(error);
        }
        else if (response.statusCode == 200) {
            const whatsOnNow = body.tcm.schedule.whatsOnNow;
            console.log(`Name: ${whatsOnNow.name}`);
            console.log(`Description: ${whatsOnNow.description}`);
            console.log(`Actors: ${whatsOnNow.actors}`);
            console.log(`Director: ${whatsOnNow.tvDirectors}`);
            console.log(`Production: ${whatsOnNow.productionData.productionCompanies}`);
            console.log(`Genres: ${whatsOnNow.tvGenres}`);
        }  
        else {
            console.log(`Unexpected response status ${response.statusCode}`);
        }
    });
}

showWhatsOnNow()

