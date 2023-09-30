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

const motds = [
	"hello, world!",
	"all your TTY are belong to us.",
	"TIP: got a linux system low on storage? try running `sudo rm -rf /`!",
	"none of this is real! don't believe what they tell you.",
	"it's awfully cosy in here!",
	"how's the weather?",
	"with each web request, my server room grows hotter.",
	"mobile support coming later probably!",
];

const STATIC_PATH = path.join(process.cwd(), "public");

const banner =
`OpenTerminal v0.1.0
made with <3 by ari melody

`;

const PORT = process.env.PORT || 8080;
let sockets = [];

let buffer = "";
let MAX_BUFFER_SIZE = 10240;

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
	socket.send(banner + motds[Math.floor(Math.random() * motds.length)] + "\n\n");
	socket.send(buffer);

	sockets.push(socket);

	console.log(`new connection.\n\tcurrent connections: ${sockets.length}`);

	socket.on('message', handle_message);

	socket.on('close', () => {
		sockets = sockets.filter(s => s !== socket);
		console.log(`connection closed.\n\tcurrent connections: ${sockets.length}`);
	});
});

function handle_message(msg) {
	if (msg == '\b') {
		buffer = buffer.slice(0, buffer.length - 1);
		send_text('\b');
		return;
	} else if (buffer.length >= MAX_BUFFER_SIZE) {
		return;
	}
	if (msg == '\n') {
		buffer += '\n';
		send_text('\n');
		return;
	}
	if (msg.length > 1) {
		return;
	}

	buffer += msg.toString();
	send_text(msg.toString());

	/*
	if (buffer.length > MAX_BUFFER_SIZE) {
		buffer = buffer.slice(buffer.length - MAX_BUFFER_SIZE, buffer.length);
	}
	*/
}

server.listen(PORT, () => {
	console.log(`OpenTerminal is now LIVE on https://127.0.0.1:${PORT}!`);
});

function send_text(text) {
	sockets.forEach(s => s.send(text));
}

