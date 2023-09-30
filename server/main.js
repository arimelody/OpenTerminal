const fs = require('fs');
const https = require('https');
const path = require('path');
const Websocket = require('ws');

const config = {
	cert: fs.readFileSync(process.env.SSL_CERT || './certs/cert.crt'),
	key: fs.readFileSync(process.env.SSL_KEY || './certs/cert.key'),
}

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
	text: 0,
	colour: 1,
	buffer: 2,
	backspace: 3,
	backword: 4,
	arrow: 5,
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
];

const STATIC_PATH = path.join(process.cwd(), "public");

const banner =
`Welcome to OpenTerminal!

`;

const PORT = process.env.PORT || 8080;
let sockets = [];

let buffer = "";
const MAX_BUFFER_SIZE = 10240;
const MAX_MESSAGE_LENGTH = 1024;

async function get_file(url) {
	const paths = [STATIC_PATH, url];
	if (url.endsWith("/")) paths.push("index.html");
	const file_path = path.join(...paths);
	const path_traversal = !file_path.startsWith(STATIC_PATH);
	const exists = await fs.promises.access(file_path).then(...[() => true, () => false]);
	if (path_traversal || !exists) return false;

	const ext = path.extname(file_path).substring(1).toLowerCase();
	const stream = fs.createReadStream(file_path);
	return { stream, ext };
}

const server = https.createServer(config, async (req, res) => {
	const file = await get_file(req.url);
	if (!file) {
		res.writeHead(404);
		res.end();
		return;
	}
	const mime_type = MIME_TYPES[file.ext] || MIME_TYPES.default;
	res.writeHead(200, { "Content-Type": mime_type });
	file.stream.pipe(res);
	// console.log(`${req.method} - ${req.url}`);
});

const wss = new Websocket.Server({ server });
wss.on('connection', socket => {
	/*
	socket.colour = generate_colour();
	socket.send(JSON.stringify({
		type: DATA_TYPES.colour,
		colour: socket.colour,
	}));
	*/
	socket.send(JSON.stringify({
		type: DATA_TYPES.text,
		text: `${banner}/* ${MOTDS[Math.floor(Math.random() * MOTDS.length)]} */\n\n`,
		colour: false,
		sticky: true,
	}));
	if (buffer) {
		socket.send(JSON.stringify({
			type: DATA_TYPES.buffer,
			data: buffer,
		}));
	}

	sockets.push(socket);

	// console.log(`new connection.\n\tcurrent connections: ${sockets.length}`);

	socket.on('message', event => { handle_message(JSON.parse(event), socket) });

	socket.on('close', () => {
		sockets = sockets.filter(s => s !== socket);
		// console.log(`connection closed.\n\tcurrent connections: ${sockets.length}`);
	});
});

function handle_message(data, user) {
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
		send_as_server(`\n\nSERVER: This channel's maximum buffer length has been hit (${MAX_BUFFER_SIZE}).\n` +
				`You will need to make more room, or the server will have to be restarted.\n` +
				`Apologies for the inconvenience!`)
	}
}

function generate_colour() {
	let result = '#';
	let hexref = '0123456789abcdef';
	for (let i = 0; i < 6; i++) {
		result += hexref.charAt(Math.floor(Math.random() * hexref.length * .75) + 4);
	}
	return result;
}

server.listen(PORT, () => {
	console.log(`OpenTerminal is now LIVE on https://127.0.0.1:${PORT}!`);
});

function send_as_server(message) {
	broadcast(JSON.stringify({
		type: DATA_TYPES.text,
		text: message,
		colour: "#ffffff",
	}));
}

function broadcast(data) {
	sockets.forEach(s => s.send(data));
}

