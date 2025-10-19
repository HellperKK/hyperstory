compress:
	uglifyjs --mangle --compress -o engine.min.js -- engine.js
	uglifycss style.css > style.min.css