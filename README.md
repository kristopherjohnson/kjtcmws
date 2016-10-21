kjtcmws
=======

This is a simple experiment to retrieve schedule information from Turner
Classic Movies, using TCM's Web Services APIs as described at
<http://www.tcm.com/tcmws/v1/docs/welcome.html>.

My goal is to have an automated service that notifies me when "something good"
is showing on TCM so that I can set my DVR to record it.  It will look for
particular genres, actors, and directors.

Requires [Node](http://nodejs.org).  Run `npm install` to install the
dependencies, then execute `tcmws.js` to display what's currently showing on
TCM.
