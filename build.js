const Bot = require('nodemw'),
	fs = require('mz/fs'),
	dsl_definition = require('./dsl_definition'),
	client = new Bot( {
		server: 'steven-universe.wikia.com',
		path: ''
	} );

var data = {
	seasons: []
}

async function run () {
	const seasons = await getPagesInCategory("Seasons");

	await Promise.all(seasons.map(x => ProcessSeason(x)));

	fs.writeFile("data.json", JSON.stringify(data));
}

run().then(() => {}).catch((err) => { debugger; console.error(err); });

/**
 * Processes and stores the data for every episode of a season.
 * @param {object} seasonData - The metadata of a single season page 
 */
async function ProcessSeason (seasonData) {
	const seasonPage = await getPage(seasonData.title);

	// Episodes on a season page are stored in the schema:
	// {{
	// |(Overall episode number)
	// |(Episode number in season)
	// |(Picture)
	// |(Title and link)
	// |(Date)
	// |(Production code)
	// |(Episode description)
	// }}
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
	'faintly',
	'excitedly',
	'shocked',
	'offscreen',
	'voiceover',
	'narration',
	'narrating',
	'TV',
	'voicemail',
	'unison',
	'whispering'
];

// Characters 
const SharedBodyCharacters = [
	'Steven',
	'Connie',
	'Jamie', /* For Buddy's book */
]

const SpeakerModifiersExp = new RegExp ('\\((' + SpeakerModifiers.join('|') + ')\\)', 'gi');
const SharedBodyExp = new RegExp ("^(.*?)\\((through )?(" + SharedBodyCharacters.join("|") + ")\\)$", 'i');

function ProcessSpeakers (text) {
	let sharedBody = false;
	const speakers = text
		.replace(/&nbsp;/g, " ")              // Normalize speakers
		.replace(/\(''.*?''\)/g, "")          // Remove annotaions in parentesis
		.replace(/\[.*?\]/g, "")              // Remove annotations in brakets
		.replace(SpeakerModifiersExp, "")     // Remove common annotations
		.split(/\band\b|<br\s*\/?>|[&,\/]/g)  // Seperate multiple speakers
		.map(x => x.trim())
		.filter(x => x !== "")
		.map(x => x.match(/(on TV|\(T.V\)|TV Narrator)/) ? "TV" : x)       // Normalize TV (None of these characters are all that important)
		.map(x => x.replace(/^(HW )?Amethyst \d+$/gi, "Unknown Amethyst")) // Normalize Unknown Amethysts (Handled this way to prevent issues with the main Amethyst)
		.map(x => x.replace(/\s*#?\d+$/gi, ""))                            // Normalize enumerated characters (Names like "Bodyguard #2" are useless for queries)
		.map(x => dsl_definition.SpeakerAliases[x] || x)                   // Resolve common aliases
		.map(x => {
			const match = x.match(SharedBodyExp);
			if (!match) return x;
			sharedBody = true;
			return [match[1].trim(), match[3].trim()];
		});

	if (sharedBody) {
		return [].concat.apply([], speakers); // Flatten speakers array, since shared body left sub-array
	}

	return speakers;
}


/**
 * Returns a Promise for all pages in a given category in the SU wiki
 * @param {string} name - The name of the category
 * @returns {Promise<object[]>} 
 */
function getPagesInCategory (name) {
	return new Promise ((resolve, reject) => {
		client.getPagesInCategory(name, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	});
}

/**
 * Returns a Promise for a singe page-content by a page name
 * @param {string} name - The name of the wiki page
 * @returns {} 
 */
function getPage (name) {
	return new Promise ((resolve, reject) => {
		client.getArticle(name, true, (err, data) => {
			if (err) reject(err);
			resolve(data);
		});
	})
}
