var recv_buffer = [];
var send_buffer = [];

var content;
var mobile_input;

var client;

var my_colour = false;
var pre_buffer_chars = 0;
var server_url = "";

const DATA_TYPES = {
	ping: 0,
	text: 1,
	colour: 2,
	buffer: 3,
	backspace: 4,
	backword: 5,
	arrow: 6,
};

export function start() {
	console.log("%chello, world!", "color: #b7fd49; font-size: 3rem; font-weight: bold");
	console.log(
`welcome to OpenTerminal!
home to an online terminal and communal text buffer.

i hope you enjoy your stay here!
to help you feel a little more comfortable, i've prepared some commands for you:

- set_colours(foreground, background)
	changes the foreground and background colours of your terminal!
	\`foreground\` and \`background\` must be hex colour codes, such as \`#ff00ff\`.

- set_palette(palette_name)
	changes the foreground and background colours of your terminal to one of our many options of premade themes! including but not limited to the entire collection of catppuccin mocha colours! (i really like their palette ;p)

	try it out! enter \`PALETTE\` into your console and browse the list of themes we have!

- toggle_lcd()
	swaps out the flickering CRT scanline effect for a more modern, LCD screen effect! (bonus: may reduce eye strain)`);

	server_url = new URL(window.location).searchParams.get("server") || window.location.host;

	const foreground = localStorage.getItem("foreground");
	const background = localStorage.getItem("background");
	if (foreground && background) {
		set_colours(foreground, background);
	}

	if (localStorage.getItem("lcd")) {
		document.body.classList.add("lcd");
	}

	content = document.getElementById("content");
	mobile_input = document.getElementById("mobile-input");

	document.addEventListener("keydown", handle_input);
	document.addEventListener("paste", handle_paste);
	
	content.addEventListener("touchend", () => {
		mobile_input.focus();
	});

	add_system_message("Connecting to the server...");
	
	setTimeout(connect, 500);

	setInterval(() => {
		if (send_buffer.length > 0) {
			const data = JSON.stringify(send_buffer[0]);
			client.send(data);
			send_buffer = send_buffer.slice(1);
		}
	}, 1000 / 600);

	loop();
}

function loop() {
	mobile_input.value = content.innerText;

	setTimeout(loop, 1000 / 60);
}

function connect() {
	client = new WebSocket("wss://" + server_url);

	client.addEventListener('open', () => {
		add_system_message(`\nConnection successful.\n\n`);
		add_system_message(`=== BEGIN SESSION ===\n\n`);
		new_caret();
	});

	client.addEventListener('message', event => { handle_message(JSON.parse(event.data)) });

	client.addEventListener('close', () => {
		add_system_message(`\n[CONNECTION LOST, PLEASE REFRESH]\n`);
	});
}

function add_system_message(text) {
	const span = document.createElement("span");
	span.classList.add('sticky');
	span.innerText = text;
	content.appendChild(span);

	new_caret();
}

function handle_message(data) {
	if (!data.type && data.type != 0) return;

	const is_at_bottom = content.scrollHeight - content.offsetHeight - content.scrollTop < 10;
	
	switch (data.type) {
		case DATA_TYPES.ping:
			client.send(JSON.stringify({type: DATA_TYPES.ping}));
			break;
		case DATA_TYPES.colour:
			my_colour = data.colour;
			console.log(`%cColour has been changed to ${my_colour}`, `color: ${my_colour}`);
			break;
		case DATA_TYPES.backspace:
			content.querySelectorAll("#caret").forEach(caret => caret.remove());
			/*
			const last_child = content.lastChild;
			if (last_child.classList.contains('sticky')) break;
			last_child.remove();
			*/		
			if (content.innerText.length <= pre_buffer_chars) {
				break;
			}
			content.innerText = content.innerText.slice(0, content.innerText.length - 1);
			break;
		case DATA_TYPES.text:
			/*
			const span = document.createElement("span");
			if (data.colour) span.style.color = data.colour;
			if (data.sticky) span.classList.add('sticky');
			span.innerText = data.text;
			content.appendChild(span);
			*/
			content.innerText += data.text;
			break;
		case DATA_TYPES.buffer:
			content.innerText += data.data;
			break;
			/*
			data.data.forEach(block => {
				handle_message(block);
			});
			*/
	}

	if (pre_buffer_chars == 0) {
		pre_buffer_chars = content.innerText.length;
	}
	
	new_caret();

	if (is_at_bottom) content.scrollTop = content.scrollHeight - content.offsetHeight;
}

function new_caret() {
	content.querySelectorAll("#caret").forEach(caret => caret.remove());
	const new_caret = document.createElement("div");
	new_caret.id = "caret";
	if (my_colour) {
		new_caret.style.backgroundColor = my_colour;
	}
	content.appendChild(new_caret);
}

function handle_input(event) {
	if (event.key == "'") {
		event.preventDefault();
	}

	switch (event.key) {
		case "Backspace":
			if (event.ctrlKey) {
				if (send_buffer.length > 0) return;
				/*
				send_buffer.push({
					type: DATA_TYPES.backword,
				});
				*/
				var break_point = content.innerText.lastIndexOf(" ");
				const last_newline = content.innerText.lastIndexOf("\n");
				if (last_newline > break_point) break_point = last_newline;
				const count = content.innerText.length - break_point;
				for (var i = 0; i < count; i++) {
					send_buffer.push({
						type: DATA_TYPES.backspace,
					});
				}
				return;
			}
			send_buffer.push({
				type: DATA_TYPES.backspace,
			});
			return;
		case "Enter":
			send_buffer.push({
				type: DATA_TYPES.text,
				text: "\n",
			});
			return;
		case "ArrowUp":
			send_buffer.push({
				type: DATA_TYPES.arrow,
				dir: "up",
			});
			return;
		case "ArrowDown":
			send_buffer.push({
				type: DATA_TYPES.arrow,
				dir: "down",
			});
			return;
		case "ArrowLeft":
			send_buffer.push({
				type: DATA_TYPES.arrow,
				dir: "left",
			});
			return;
		case "ArrowRight":
			send_buffer.push({
				type: DATA_TYPES.arrow,
				dir: "right",
			});
			return;
	}

	if (event.key.length > 1) {
		// server will discard text over 1 character, anyway
		return;
	}

	if (event.ctrlKey || event.metaKey) {
		return;
	}

	send_buffer.push({
		type: DATA_TYPES.text,
		text: event.key,
	});

	content.scrollTop = content.scrollHeight - content.offsetHeight;
}

function handle_paste(event) {
	event.preventDefault();

	if (send_buffer.length > 0) {
		return;
	}

	const paste = (event.clipboardData || window.clipboardData).getData("text");
	send_buffer.push({
		type: DATA_TYPES.text,
		text: paste,
	});
	content.scrollTop = content.scrollHeight - content.offsetHeight;
