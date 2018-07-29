/**
 * Example script getting pages from "Bosons" category on English Wikipedia
 *
 * @see http://en.wikipedia.org/wiki/Category:Bosons
 * @see http://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category%3ABosons&cmlimit=500&format=json
 */

const Bot = require('nodemw'),
	fs = require('mz/fs'),
	dsl_definition = require('./dsl_definition'),
	client = new Bot( {
		server: 'steven-universe.wikia.com',
		path: ''
	} );

function getPagesInCategory (name) {
	return new Promise ((resolve, reject) => {
		client.getPagesInCategory(name, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
}

function getPage (name) {
	return new Promise ((resolve, reject) => {
		client.getArticle(name, true, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	})
}

var data = {
	seasons: []
}

async function run () {
	const seasons = await getPagesInCategory("Seasons");

	await Promise.all(seasons.map(x => ProcessSeason(x)));

	fs.writeFile("data.json", JSON.stringify(data));
}

async function ProcessSeason (seasonData) {
    const seasonPage = await getPage(seasonData.title);
    const matches = seasonPage.match(/\{\{EP\s[^\}]+/gi);
	if (!matches) return;
	
    const episodes = await Promise.all(matches.map(x => {
        const titleMatches = x.match(/\|\"\[\[(.*?)\]\]/);
        if (!titleMatches) debugger;
        const episodeTitle = titleMatches[1];
        return ProcessEpisode(episodeTitle.split("|")[0]);
	}));
	
	data.seasons[parseInt(seasonData.title.match(/\d+/)[0]) - 1] = episodes;
}

async function ProcessEpisode (title) {
    //console.log(title);
	const [episodePage, transcript] = await Promise.all([getPage(title), getPage(title + "/Transcript")]);
	const matches = episodePage.match(/\{\{Episode\s[^\}]+/i);
	if (!matches) debugger;
	const episodeNr = matches[0].match(/\|\s*episodenumber\s*=\s*(\d+)/i);
	if (!episodeNr) debugger;
	const dialog = transcript.match(/\{\{TD\s*\|[^\}]+/gi);
	if (!dialog) debugger;
	return {
		nr: parseInt(episodeNr[1]),
		title: title,
		dialog: dialog.map(ProcessDialog)
	}
}

function ProcessDialog (tdText) {
	tdText = tdText.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, "$1");
	tdText = tdText.replace(/\[\[([^\]]+)\]\]/g, "$1");
	const segments = tdText.split("|");
	const speaker = ProcessSpeakers(segments[1]);
	let text = segments[2] || "";
	for (const element of speaker) {
		if (element.includes(">")) debugger;
	};

	if (!segments[2]) debugger;

	//text = text.toLowerCase();
	return {
		speakers: speaker,
		text: text.trim()
	}
}

const SpeakerModifiers = [
	"Faintly", "excitedly", "Shocked", "offscreen", "T.V", "Voiceover", "Narration", "Narrating", "TV", "voicemail"
];

const SpeakerModifiersExp = new RegExp ('\\((' + SpeakerModifiers.join('|') + ')\\)', 'gi');

function ProcessSpeakers (text) {
	const normalizedSpaces = text.replace(/&nbsp;/g, " ");
	const commonAnnotationsRemoved = normalizedSpaces.replace(/\(''.*?''\)/g, "").replace(SpeakerModifiersExp, "");
	const seperateSpeakers = commonAnnotationsRemoved.split(/\band\b|<br\s*\/?>|[&,\/]/g).map(x => x.trim()).filter(x => x !== "");
	const normalizedSpeakers = seperateSpeakers.map(x => dsl_definition.SpeakerAliases[x] || x);
	return normalizedSpeakers;
}

run().then(() => {}).catch((err) => { debugger; console.error(err); });
