const fs = require('fs');
const http = require('http');
const path = require('path');
const Websocket = require('ws');

const VERSION = "1.1.0";

const MIME_TYPES = {
	default: "application/octet-stream",
	html: "text/html; charset=UTF-8",
	js: "application/javascript",
	css: "text/css",
	png: "image/png",
	jpg: "image/jpg",
	gif: "image/gif",
	ico: "image/x-icon",
	svg: "image/svg+xml",
};

const DATA_TYPES = {
	ping: 0,
	text: 1,
	colour: 2,
	buffer: 3,
	backspace: 4,
	backword: 5,
	arrow: 6,
	version: 7,
};

const MOTDS = [
	"hello, world!",
	"all your TTY are belong to us.",
	"TIP: got a linux system low on storage? try running `sudo rm -rf /`!",
	"none of this is real! don't believe what they tell you.",
	"it's awfully cosy in here!",
	"how's the weather?",
	"with each web request, my server room grows hotter.",
	"mobile support coming later probably!",
	"there is science to do...",
	"now fully open-source!",
	"somehow not the worst communication app!",
	"\"oh this is like nano but multiplayer\"",
	"there's no place like 127.0.0.1",
	"it's no emacs, but it'll do",
];

const STATIC_PATH = path.join(process.cwd(), "public");
const CACHE_MAX_AGE = 14400 // 4 hours

const BANNER =
`Welcome to OpenTerminal!

`;
const FAKE_CRASH =
`

=========================================
This copy of OpenTerminal is not genuine.
Please acquire a genuine copy.
This connection will now terminate.
=========================================
`;
const VERSION_ERROR =
`Your client does not match this server's version of OpenTerminal (${VERSION})!
If you are connecting to this site's own OpenTerminal server, please refresh the page or clear your browser's cache to update.
`

console.log("using env vars: " + Object.keys(process.env).filter(value => { return value.startsWith("OPENTERM_") }).join(', '));
const HOST = process.env.OPENTERM_HOST || '0.0.0.0';
const PORT = process.env.OPENTERM_PORT || 8080;
const TRUSTED_PROXIES = process.env.OPENTERM_TRUSTED_PROXIES ? process.env.OPENTERM_TRUSTED_PROXIES.split(',') : [];
const PING_INTERVAL = 10000;
let sockets = [];

let buffer = "";
const MAX_BUFFER_SIZE = 1024 * 1000;
const MAX_MESSAGE_LENGTH = 1024;

/**
 * simple file fetching for the HTTP server
 */
async function get_file(url) {
	// ignore query params...not very helpful when getting files!
	url = url.split("?")[0];

	const paths = [STATIC_PATH, url];
	if (url.endsWith("/")) paths.push("index.html");
	const file_path = path.join(...paths);

	// check for path traversal. path traversal is...bad.
	const path_traversal = !file_path.startsWith(STATIC_PATH);
	const exists = fs.existsSync(file_path) && fs.statSync(file_path).isFile();
	if (path_traversal || !exists) return false;

	const ext = path.extname(file_path).substring(1).toLowerCase();

	try {
		const data = await fs.promises.readFile(file_path, { encoding: 'utf8' });
		return { data, ext };
	} catch (error) {
		console.error(error);
		return false;
	}
	
}

const server = http.createServer(async (req, res) => {
	const request_time = new Date().getTime();
	const file = await get_file(req.url);
	if (file === false) {
		res.writeHead(404);
		res.end("404 not found!");
		return log_request(req, res, request_time);
	}
	const mime_type = MIME_TYPES[file.ext] || MIME_TYPES.default;
	res.writeHead(200, {
		"Content-Type": mime_type,
		"Cache-Control": `max-age=${CACHE_MAX_AGE}`,
		"Server": "OpenTerminal",
	});
	res.write(file.data);
	res.end();
	return log_request(req, res, request_time);
});

function log_request(req, res, time) {
	const elapsed = new Date().getTime() - time;
	console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - ${res.statusCode} - ${get_real_address(req)} in ${elapsed}ms`);
}

function get_real_address(req) {
	if (TRUSTED_PROXIES.indexOf(req.connection.remoteAddress) !== -1 && req.headers['x-forwarded-for']) {
		return req.headers['x-forwarded-for'];
	}
	return req.connection.remoteAddress;
}

const wss = new Websocket.Server({ server });
wss.on('connection', (socket, req) => {
	console.log(`${new Date().toISOString()} - WS OPEN - ${get_real_address(req)} (active connections: ${sockets.length + 1})`);
	/*
	socket.colour = generate_colour();
	socket.send(JSON.stringify({
		type: DATA_TYPES.colour,
		colour: socket.colour,
	}));
	*/
	socket.send(JSON.stringify({
		type: DATA_TYPES.text,
		text: `${BANNER}/* ${MOTDS[Math.floor(Math.random() * MOTDS.length)]} */\n\n`,
		colour: false,
		sticky: true,
	}));
	if (buffer.length > 0) {
		socket.send(JSON.stringify({
			type: DATA_TYPES.buffer,
			data: buffer,
		}));
	}

	const ping_routine = setInterval(
		function() {
			socket.send(JSON.stringify({
				type: DATA_TYPES.ping,
			}))
		}, PING_INTERVAL);
	socket.ping_routine = ping_routine;

	sockets.push(socket);

	socket.on('message', event => {
		try {
			handle_message(JSON.parse(event), socket)
		} catch (error) {
			socket.send(JSON.stringify({
				type: DATA_TYPES.text,
				text: FAKE_CRASH,
			}));
			console.error(error);
		}
	});

	socket.on('close', () => {
		clearInterval(socket.ping_routine);
		sockets = sockets.filter(s => s !== socket);
		// console.log(`connection closed.\n\tcurrent connections: ${sockets.length}`);
	});
});

/**
 * handles parsed JSON data sent by the client.
 */
function handle_message(data, user) {
	if (user.version === undefined) {
		if (data.type !== DATA_TYPES.version) {
			user.send(JSON.stringify({
				type: DATA_TYPES.text,
				text: VERSION_ERROR
			}));
			user.close();
			return;
		} else if (data.text !== VERSION) {
			user.send(JSON.stringify({
				type: DATA_TYPES.text,
				text: VERSION_ERROR
			}));
			user.close();
			return;
		} else {
			user.version = data.text;
			return;
		}
	}

	switch (data.type) {
		case DATA_TYPES.backword:
			var break_point = buffer.lastIndexOf(" ");
			const last_newline = buffer.lastIndexOf("\n");
			if (last_newline > break_point) break_point = last_newline;
			buffer = buffer.substring(0, break_point);
			for (var i = 0; i < buffer.length - break_point; i++) {
				broadcast(JSON.stringify({
					type: DATA_TYPES.backspace,
				}));
			}
		case DATA_TYPES.backspace:
			buffer = buffer.substring(0, buffer.length - 1);
			broadcast(JSON.stringify({
				type: DATA_TYPES.backspace,
			}));
			return;
		case DATA_TYPES.text:
			if (buffer.length >= MAX_BUFFER_SIZE) {
				return;
			}
			if (data.text.length > MAX_MESSAGE_LENGTH) {
				user.send(JSON.stringify({
					type: DATA_TYPES.text,
					text: "bleeeehhhh :P\n(message too long!)\n",
				}))
				user.close();
				return;
			}
			block = {
				type: DATA_TYPES.text,
				text: data.text,
				colour: user.colour,
			};
			buffer += data.text;
			broadcast(JSON.stringify(block));
	}

	if (buffer.length > MAX_BUFFER_SIZE) {
		broadcast_as_server(`\n\nSERVER: This channel's maximum buffer length has been hit (${MAX_BUFFER_SIZE}).\n` +
				`You will need to make more room, or the server will have to be restarted.\n` +
				`Apologies for the inconvenience!`)
	}
}

/**
 * generates a random hexadecimal colour value (ex. #ff00ff)
 */
function generate_colour() {
	let result = '#';
	let hexref = '0123456789abcdef';
	for (let i = 0; i < 6; i++) {
		result += hexref.charAt(Math.floor(Math.random() * hexref.length * .75) + 4);
	}
	return result;
}

server.listen(PORT, HOST, () => {
	console.log(`OpenTerminal is now LIVE on http://${HOST === '0.0.0.0' ? '127.0.0.1' : HOST}:${PORT}`);
	if (TRUSTED_PROXIES.length > 0) console.log(`Using X-Forwarded-For headers for hosts: ${TRUSTED_PROXIES.join(", ")}`);
});

/**
 * sends a server-wide message to all connected clients.
 */
function broadcast_as_server(message) {
	broadcast(JSON.stringify({
		type: DATA_TYPES.text,
		text: message,
		colour: "#ffffff",
	}));
}

/**
 * sends raw data to all connected clients.
 */
function broadcast(data) {
	sockets.forEach(s => s.send(data));
}

