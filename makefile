compress:
	uglifyjs --mangle --compress -o engine.min.js -- engine.js
	uglifyjs --mangle --compress -o engine-lite.min.js -- engine-lite.js
	uglifycss style.css > style.min.css
	uglifycss style-lite.css > style-lite.min.css