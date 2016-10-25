kjtcmws
=======

This is a simple experiment to retrieve schedule information from Turner
Classic Movies, using TCM's Web Services APIs as described at
<http://www.tcm.com/tcmws/v1/docs/welcome.html>.

My goal is to have an automated service that notifies me when "something good"
is showing on TCM so that I can set my DVR to record it.  It looks for
particular genres, actors, and directors.

Requires [Node](http://nodejs.org).  Run `npm install` to install the
dependencies, then execute `tcmws.js` to display what's coming up in the next
week on TCM.

For an example of the output, see <https://gist.github.com/kristopherjohnson/2406522eb20a2639b85321a0a335e56e>.

If your tastes vary from mine, just modify the definitions of `favoriteGenres`,
`favoriteActors`, and `favoriteDirectors` in the script.

I don't know why, but once in a while the TCM web service returns invalid
responses with a 200 status code.  If you get an error indicating that
`body.tcm.title` is null, just try running the script again.

