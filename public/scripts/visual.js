/*
 * binds visual functions to the window
 */
export function bind() {
	window.PALETTE = PALETTE;
	window.set_palette = set_palette;
	window.set_colours = set_colours;
	window.clear_colours = clear_colours;
	window.toggle_lcd = toggle_lcd;
}

const PALETTE = {
	ari: ["#b7fd49", "#111111"],
	mono: ["#ffffff", "#111111"],
	green: ["#00ff00", "#111111"],
	gold: ["#f9cb16", "#111111"],
	bsod: ["#ffffff", "#0000ff"],
	starlight: ["#d2b660", "#110717"],
	aperture: ["#ffce14", "#1d0b00"],
	halloween: ["#ff8000", "#1a120a"],
	catppuccin: {
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
	community: {
		/* @jorun@meta.jorun.dev */
		jorun: ["#0080ff", "#0d1020"],
		/* @meowcatheorange@moth.zone */
		meowca: ["#ff4000", "#130805"],
		/* @alcea@pb.todon.de */
		alcea: {
			peach: ["#cf4a7299", "#ffffff"],
			purple: ["#7f00ff", "#ffffff"],
		},
	},
};

/*
 * sets the colour palette using the name ("example.palette") or reference to a palette (PALETTE.example)
 */
function set_palette(palette) {
	if (palette.constructor == Array) {
		set_colours(palette[0], palette[1]);
		console.log(`Palette changed to [${palette}]`);
		return true;
	}
	const palette_route = palette.split(".");
	var palette = PALETTE;
	for (var i = 0; i < palette_route.length; i++) {
		var palette = palette[palette_route[i]];
		if (!palette) {
			console.error(`Palette [${palette_route.join(".")}] does not exist. Enter \`PALETTE\` for a list of palettes.`);
			return false;
		}
	}
	set_colours(palette[0], palette[1]);
	console.log(`Palette changed to [${palette}].`);
	return true;
}

/*
 * sets the foreground and background colours of the terminal.
 * NOTE: this does not override custom colours provided by
 * the server.
 */
function set_colours(foreground, background) {
	localStorage.setItem("foreground", foreground);
	localStorage.setItem("background", background);
	document.documentElement.style.setProperty('--colour', foreground);
	document.documentElement.style.setProperty('--bgcolour', background);
}

/*
 * returns all custom colour settings to default.
 */
function clear_colours() {
	localStorage.removeItem("foreground");
	localStorage.removeItem("background");
	document.documentElement.style.removeProperty('--colour');
	document.documentElement.style.removeProperty('--bgcolour');
}

/**
 * toggles LCD theme
 */
function toggle_lcd() {
	if (document.body.classList.contains("lcd") || localStorage.getItem("lcd")) {
		document.body.classList.remove("lcd");
		localStorage.removeItem("lcd");
	} else {
		document.body.classList.add("lcd");
		localStorage.setItem("lcd", true);
	}
}
