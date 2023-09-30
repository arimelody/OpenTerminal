var recv_buffer = [];
var send_buffer = [];

var content;
var mobile_input;

var client;

var my_colour = false;
var pre_buffer_chars = 0;

const DATA_TYPES = {
	text: 0,
	colour: 1,
	buffer: 2,
	backspace: 3,
	backword: 4,
	arrow: 5,
};

function start() {
	console.log("%chello, world!", "color: #b7fd49; font-size: 3rem; font-weight: bold");
	console.log(
`welcome to OpenTerminal!
home to an online terminal and communal text buffer.

i hope you enjoy your stay here!
to help you feel a little more comfortable, i've prepared some commands for you:

- set_colours(foreground, background)
	changes the foreground and background colours of your terminal!
	\`foreground\` and \`background\` must be hex colour codes, such as \`#ff00ff\`.

- set_palette(palette)
	changes the foreground and background colours of your terminal to one of our many options of premade themes! including but not limited to the entire collection of catppuccin mocha colours! (i really like their palette ;p)

	try it out! type \`PALETTE.\` into your console and browse the list of themes we have!`);

	const foreground = localStorage.getItem("foreground");
	const background = localStorage.getItem("background");
	if (foreground && background) {
		set_colours(foreground, background);
	}

	content = document.getElementById("content");
	mobile_input = document.getElementById("mobile-input");

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
	client = new WebSocket("wss://" + window.location.host);

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

	const is_at_bottom = content.scrollTop == content.scrollTopMax;
	
	switch (data.type) {
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

	if (is_at_bottom) content.scrollTop = content.scrollTopMax;
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

	if (event.ctrlKey) {
		return;
	}

	send_buffer.push({
		type: DATA_TYPES.text,
		text: event.key,
	});

	content.scrollTop = content.scrollTopMax;
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
	content.scrollTop = content.scrollTopMax;
}

const PALETTE = {
	ari:
		["#b7fd49", "#111111"],
	green:
		["#00ff00", "#111111"],
	gold:
		["#f9cb16", "#111111"],
	bsod:
		["#ffffff", "#0000ff"],
	starlight:
		["#d2b660", "#110717"],
	catppuccin: {
		frappe: {
			green: ["#a6d189", "#232634"],
		},
		macchiato: {
			green: ["#a6da95", "#24273a"],
		},
		mocha: {
			rosewater: 	["#f9e2af", "#1e1e2e"],
			flamingo: 	["#f2cdcd", "#1e1e2e"],
			pink: 		["#f5c2e7", "#1e1e2e"],
			mauve: 		["#cba6f7", "#1e1e2e"],
			red: 		["#f38ba8", "#1e1e2e"],
			maroon: 	["#eba0ac", "#1e1e2e"],
			peach: 		["#fab387", "#1e1e2e"],
			yellow: 	["#f9e2af", "#1e1e2e"],
			green: 		["#a6e3a1", "#1e1e2e"],
			teal: 		["#94e2d5", "#1e1e2e"],
			sky: 		["#89dceb", "#1e1e2e"],
			sapphire: 	["#74c7ec", "#1e1e2e"],
			blue: 		["#89b4fa", "#1e1e2e"],
			lavendar: 	["#b4befe", "#1e1e2e"],
		},
	},
	community: {
		jorun: /* @jorun@meta.jorun.dev */
			["#0080ff", "#0d1020"],
		meowca: /* @meowcatheorange@moth.zone */
			["#ff4000", "#130805"],
		halloween:
			["#ff8000", "#1a120a"],
		alcea: {
			peach:
				["#cf4a7299", "#fff"],
			purple:
				["#7f00ff", "#fff"],
		},
	},
};

function set_palette(palette) {
	set_colours(palette[0], palette[1]);
}

function set_colours(foreground, background) {
	localStorage.setItem("foreground", foreground);
	localStorage.setItem("background", background);
	document.documentElement.style.setProperty('--colour', foreground);
	document.documentElement.style.setProperty('--bgcolour', background);
}

function clear_colours() {
	localStorage.removeItem("foreground");
	localStorage.removeItem("background");
	document.documentElement.style.removeProperty('--colour');
	document.documentElement.style.removeProperty('--bgcolour');
}

document.addEventListener("DOMContentLoaded", () => {
	start();
});

document.addEventListener("keydown", handle_input);
document.addEventListener("paste", handle_paste);

