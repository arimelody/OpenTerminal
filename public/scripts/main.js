var buffer = "";
var send_buffer = "";
var content;
var mobile_input;
var client;
var pre_buffer_chars = 0;
var term_interval = 10;
var ready = false;

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

	content.addEventListener("click", () => {
		mobile_input.focus();
	});

	buffer += "Connecting to the server...";
	
	setTimeout(connect, 500);

	loop();
}

function loop() {
	if (buffer.length > 0) {
		const char = buffer.substring(0, 1);
		insert_text(char);
		buffer = buffer.substring(1);
	}

	if (send_buffer.length > 0) {
		const char = send_buffer.substring(0, 1);
		client.send(char);
		send_buffer = send_buffer.substring(1);
	}

	mobile_input.value = content.innerText;

	setTimeout(loop, term_interval);
}

function connect() {
	client = new WebSocket("wss://" + window.location.host);

	client.addEventListener('open', () => {
		// insert_text('\x00');
		buffer += "\nConnection successful.\n\n";
		buffer += "=== BEGIN SESSION ===\n\n";
	});

	client.addEventListener('message', event => {
		buffer += event.data;
		if (pre_buffer_chars == 0) {
			pre_buffer_chars = content.innerText.length + buffer.length;
		}
	});

	client.addEventListener('close', () => {
		insert_text("\n\n[CONNECTION LOST, PLEASE REFRESH]");
	});
}

function insert_text(text) {
	const carat = content.querySelector("#carat");
	if (carat) carat.remove();

	if (text == "\x00") {
		content.innerText = "";
		pre_buffer_chars = 0;
	} else if (text == "\b") {
		if (content.innerText.length > pre_buffer_chars) {
			content.innerText = content.innerText.slice(0, content.innerText.length - 1);
		}
	} else {
		content.innerText += text;
	} 

	const new_carat = document.createElement("div");
	new_carat.id = "carat";
	content.appendChild(new_carat);
}

function handle_input(event) {
	if (event.key == "'") {
		event.preventDefault();
	}

	if (event.key == "Backspace") {
		if (event.ctrlKey && send_buffer.length == 0) {
			const last_space = content.innerText.lastIndexOf(" ");
			const last_newline = content.innerText.lastIndexOf("\n");
			
			var break_at = last_space;
			if (last_newline > last_space) {
				break_at = last_newline;
			}

			const word_length = content.innerText.length - break_at;
			for (let i = 0; i < word_length; i++) {
				send_buffer += '\b';
			}
			return;
		}
		send_buffer += '\b';
		return;
	}
	if (event.key == "Enter") {
		send_buffer += '\n';
		return;
	}
	if (event.key.length > 1) {
		return;
	}
	if (event.ctrlKey) {
		return;
	}

	send_buffer += event.key;
	content.scrollTop = content.scrollHeight;
}

function handle_paste(event) {
	event.preventDefault();

	if (send_buffer.length > 0) {
		return;
	}

	const paste = (event.clipboardData || window.clipboardData).getData("text");
	send_buffer += paste;
	content.scrollTop = content.scrollHeight;
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

