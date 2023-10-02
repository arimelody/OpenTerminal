import * as Terminal from "./terminal.js";
import * as Visual from "./visual.js";

document.addEventListener("DOMContentLoaded", () => {
	Visual.bind();
	Terminal.start();
});

