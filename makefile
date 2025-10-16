compress:
	uglifyjs --mangle --mangle-props --toplevel --compress -o enjine.min.js -- engine.js
	uglifycss style.css > style.min.css