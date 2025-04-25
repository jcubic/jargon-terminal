ALL: jargon.db

jargon.db: jargon.xml
	test -e jargon.db && rm jargon.db* || true
	./scripts/sqlite.js jargon.xml jargon.db

jargon.xml: jargon/jargon.xslt jargon/jargon.xml
	xsltproc jargon/jargon.xslt jargon/jargon.xml > jargon.xml