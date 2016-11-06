kjtcmws
=======

This is a simple experiment to retrieve schedule information from Turner
Classic Movies, using TCM's Web Services APIs as described at
<http://www.tcm.com/tcmws/v1/docs/welcome.html>, and show only the
movies that match my preference.

My goal is to have an automated service that notifies me when "something good"
is showing on TCM so that I can set my DVR to record it.  It looks for
particular genres, actors, directors, and screenwriters, and for movies
that have earned a four-star rating from Leonard Maltin.

The script requires <a href="http://www.nodejs.org">Node</a>.  You need to run
`npm install` or `yarn` to download the dependencies before running the script.
Alternatively, if you have a UNIX-ish system, you can probably run `make` to
download the dependencies and run the script.

The script is `tcmws.js`.  If you run the script without any options, it will
retrieve schedule information for the next seven days and write it in
plain-text format to standard output.

    node tcmws.js

To write the output as HTML to a file, use the `--html` and `--output` options,
like this:

    node tcmws.js --html --output tcm.html

For more information on the command-line options, try this:

    node tcmws.js --help

For an example of the text output, see <https://gist.github.com/kristopherjohnson/2406522eb20a2639b85321a0a335e56e>.

For an example of the HTML output, see <http://secretspacelab.com/tcm.html>.

I like film noir and classic horror and sci-fi movies.  If your tastes vary
from mine, just modify the definitions of `favoriteGenres`, `favoriteActors`,
`favoriteDirectors`, and `favoriteWriters` in `tcmws.js`.

I don't know why, but once in a while the TCM web service returns invalid
JSON responses with a 200 status code.  If you get an error indicating that
`body.tcm.title` is null, just try running the script again.

