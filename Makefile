NODE=node
NPM=npm

# Default target creates tcm.html page for upcoming 7 days
tcm.html: tcmws.js template.html node_modules
	$(NODE) tcmws.js --html --output $@

# tcm-today.html will contain only today's schedule
tcm-today.html: tcmws.js template.html node_modules
	$(NODE) tcmws.js --html --output $@ --days 1

node_modules: package.json
	$(NPM) install

clean:
	- $(RM) tcm.html
	- $(RM) tcm-today.html

dev-clean: clean
	- $(RM) -r node_modules

.PHONY: clean dev-clean

