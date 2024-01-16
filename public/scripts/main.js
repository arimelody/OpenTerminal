import * as Terminal from "./terminal.js";
import * as Visual from "./visual.js";

document.addEventListener("DOMContentLoaded", () => {
	Visual.bind();
	Terminal.start();

	const dialog_backdrop = document.getElementById("dialog-backdrop");

	const connect_button = document.getElementById("connect");
	const connect_dialog = document.getElementById("connect-dialog");
	const connect_url = document.getElementById("connect-url");
	const connect_submit = document.getElementById("connect-submit");
	const connect_close = connect_dialog.getElementsByClassName("dialog-close").item(0);

	connect_url.placeholder = window.location.host;

	connect_button.addEventListener("click", () => {
		connect_url.value = "";
		connect_dialog.classList.add("show");
		dialog_backdrop.classList.add("show");
		connect_url.focus();
		Terminal.set_enable_input(false);
	});

	connect_submit.addEventListener("click", () => {
		connect_close.click();
		const new_server = connect_url.value || window.location.host;
		Terminal.connect(new_server);
	});

	connect_dialog.addEventListener("keydown", event => {
		switch (event.key) {
			case "Enter":
				connect_submit.click();
				break;
			case "Escape":
				connect_close.click();
				break;
		}
		return;
	});

	[...document.getElementsByClassName("dialog-close")].forEach(dialog_close => {
		dialog_close.addEventListener("click", () => {
			[...document.getElementsByClassName("dialog")].forEach(element => {
				element.classList.remove("show");
			});
			dialog_backdrop.classList.remove("show");
			Terminal.set_enable_input(true);
		});
	});

	dialog_backdrop.addEventListener("click", () => {
		connect_close.click();
	});
});

