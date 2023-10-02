import * as Terminal from "./terminal.js";
import * as Visual from "./visual.js";

document.addEventListener("DOMContentLoaded", () => {
	Visual.bind();
	Terminal.start();

	document.getElementById("connect").addEventListener("click", () => {
		var new_server = prompt("Enter the address of the server you would like to connect to:");
		if (!new_server) return;
		Terminal.connect(new_server);
	});
});

