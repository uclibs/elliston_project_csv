
var data;
var ellistonData = { 	totalRecords: 0,
						playlistID: {}
					};
var allTracks = [];
var authors = '';

// Array used for ONLY WP listing info:
var el = [];

$(document).ready(function(){
	  // Path of the current CSV
    var csvfile = "data/updated-elliston-data.csv";
    $.get(csvfile, function (csv) {
        data = Papa.parse(csv, {
    					header: true,
    					dynamicTyping: true,
    					complete: function(jsonListings) {
    						data = jsonListings
    					}
    				});
    });
});

$('#display-listings').on('click', function(){

	ellistonData.totalRecords = data.data.length;

	function initializePlaylistID(record) {
		ellistonData.playlistID[record.id] = ellistonData.playlistID[record.id] || {};
	}

	function initializeListings(record, playlistID, listing) {

		// Year
		var year = record['dc.coverage.temporal[en_US]'];
		if (year.toString().match(/^(19|20)[0-9][0-9]/g) && !year.toString().match(/\?/g)) {
			ellistonData.playlistID[record.id].year = year;
		} else {
			ellistonData.playlistID[record.id].year = 'unknown';
		}

		// Author(s)
		authors = data.data[i]['dc.contributor.author'].replace('||', ' & ');
		var split = authors.split(',');
		var firstName = split[1].substring(1);
		var lastName = split[0];

		ellistonData.playlistID[record.id].authors = [];
		ellistonData.playlistID[record.id].authors.push(firstName + ' ' + lastName);

		// Description
		ellistonData.playlistID[record.id].listing = listing;
	}

	function initializeTracklistInformation(record, playlistID, listing) {

		// Creates tracklist array by detecting track links in listing html
		var urlRegex = /(http)(.*)\"/g;
		var tracklist = [];

		listing.replace(urlRegex, function(url) {
			tracklist.push(url.slice(0, -1));
			allTracks.push({
				'playlistID' : playlistID,
				'mp3' : url.slice(0, -1)
			});
		});

		// Add array to ellistonData
		ellistonData.playlistID[record.id].tracks = [];

		for (var t = 1; t < tracklist.length; t++)  {
			var track = { 'trackNum': t, 'mp3': tracklist[t] };
			ellistonData.playlistID[record.id].tracks.push(track);
		}
	}

	function appendListings(playlistID, listings) {

		var playerStart = ' [wpse_playlist type="audio" tracklist="true" tracknumbers="true" images="true" artist="true"] ';
		// var allTracksMP3 = listing.match(/(http:\/\/drc)(.*)(?=<\/a>)/g) // returns an array
		var allTracksHTML = '';

		var listingHTML = ellistonData.playlistID[playlistID].listing;
		// Creates an array of trackNames
		var	trackNames = listingHTML.match(/<\/a>([^<]*)/g);

		for (var i = 0; i < ellistonData.playlistID[playlistID].tracks.length; i++) {
			var trackURL = ellistonData.playlistID[playlistID].tracks[i].mp3

			// Compensating for first track being overview title
		  // Find track name by seraching for first capitalized letter
			c = i + 1;
			var t = trackNames[i].search(/[A-Z]/);
			var trackName = trackNames[c].slice(t);

			// Replace apostrophe with ASCII & bracket with parenthese
			trackName = trackName.replace(/'/g, "&#39").replace(/\[/g, "(").replace(/\]/g, ")");
			authors = authors.replace(/'/g, "&#39")

			var individualTrack = '[wpse_trac title="' + trackName + '" src="' + trackURL + '" type="audio/mpeg" caption="" description="" meta_artist="' +
		 							authors + '" meta_length_formatted="" thumb_src="" image_width="300"]';
	 		allTracksHTML += individualTrack;
		}

		var drcListingURL = function () {
			var listing = listingHTML.match(/(http|https:\/\/?)(.*)[0-9]{6}/);
			if (listing) {
				return listing[0];
			} else {
				return 'unavailable';
			}
		}

		var linkToDRC = '<p>Find the DRC listing here: <a href="' + drcListingURL() + '">' + drcListingURL() + '</a>';
		var linkToAuthorPlaceholder = '<p><code>&lt;i&gt;Author information from&lt;/i&gt; &lt;a href=""&gt;this source&lt;/a&gt;.</code></p>';
		var playlistHTML = '<h2>' + authors + '</h2>' +
						playerStart +
							allTracksHTML +
						'[/wpse_playlist]';

		$('#output').append('<code>' + playlistHTML +
									 '<br><br>' +
									 linkToDRC +
									 '<br><br>' +
									 linkToAuthorPlaceholder +
									 '</code>');

		ellistonData.playlistID[playlistID].playlistHTML = playlistHTML;

		// EL, the post JSON - magic!!!
		// Adding escapes for quotes in JSON postHTML
		// Saving as JSON willl auto-insert escapes

		var l = {};
		l.author = ellistonData.playlistID[playlistID].authors[0] || '';
		l.playlist = playlistHTML;
		l.authorInfoPlaceholder = linkToAuthorPlaceholder;
		l.drcLink = drcListingURL();
		el.push(l);
	}

	for (var i=0; i < data.data.length; i++) {
		var listing = data.data[i]['dc.description'];
		var playlistID = data.data[i].id;
		initializePlaylistID(data.data[i]);
		initializeListings(data.data[i], playlistID, listing);
		initializeTracklistInformation(data.data[i], playlistID, listing);
		appendListings(playlistID, listing);
	}

	function split_into_sections(arr) {
		var sections = [], size = 100;
		while (arr.length) {
    	sections.push(arr.splice(0, size));
	  }
		return sections;
	}

	console.log(ellistonData);
	console.log(el);
});
