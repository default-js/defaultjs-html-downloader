import "/browser-defaultjs-html-downloader.js";

document.body.on("d-downloader--acknowledge--download", () => {
	console.log("download done");
});

document.body.on("d-downloader--executing--download", () => {
	console.log("downloading ...");
});

const byFunctionButton = find("#by-function").first();
byFunctionButton.on("click", async (event) => {
	console.log("execute download by function");
	await find("d-downloader").first().download();
	console.log("download by function is done");
});

const byEventButton = find("#by-event").first();
byEventButton.on("click", async (event) => {
	console.log("execute download by event");
	find("d-downloader").first().trigger("d-downloader--action--download");
});
