var TERM_INTERVAL = 0;
var buffer = "";
var content;

const banner =
`OpenTerminal v0.1.0
made with <3 by ari melody

`;

function start() {
	content = document.getElementById("content");
	send_text(banner);
	loop();
}

function loop() {
	if (buffer.length > 0) {
		const carat = content.querySelector("#carat");
		if (carat) carat.remove();

		const char = buffer.slice(0, 1);
		if (char == "\b") {
			content.innerText = content.innerText.slice(0, content.innerText.length - 1);
		} else {
			content.innerText += char;
		} 
		buffer = buffer.slice(1);

		const new_carat = document.createElement("div");
		new_carat.id = "carat";
		content.appendChild(new_carat);
	}

	setTimeout(loop, TERM_INTERVAL);
}

function handle_input(event) {
	// console.debug(event.key);

	if (event.key == "Backspace") {
		if (event.ctrlKey) {
			const last_space = content.innerText.lastIndexOf(" ");
			const last_newline = content.innerText.lastIndexOf("\n");
			
			var break_at = last_space;
			if (last_newline > last_space) {
				break_at = last_newline;
			}

			const word_length = content.innerText.length - break_at;
			send_text("\b".repeat(word_length));
			return;
		}
		send_text("\b");
		return;
	}
	if (event.key.startsWith("Arrow")) {
		return;
	}
	switch (event.key) {
		case 'Shift':
		case 'Control':
		case 'Alt':
			return;
		case 'Enter':
			send_text('\n');
			break;
	}
	if (event.key.length > 1) {
		return;
	}

	send_text(event.key);
}

function send_text(char) {
	content.scrollTop = content.scrollHeight;
	buffer += char;
}

document.addEventListener("DOMContentLoaded", () => {
	start();
});

document.addEventListener("keydown", handle_input);

