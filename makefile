compress:
	uglifyjs --mangle --mangle-props --toplevel --compress -o engine.min.js -- engine.js
	uglifycss style.css > style.min.css