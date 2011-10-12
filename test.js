var irc = require('irc');
var
  sys = require('util'),
  couchdb = require('felix-couchdb'),
  client = couchdb.createClient(5984, 'localhost', "couchpotato", "what,isWhat101"),
  db = client.db('chiglug');

/**
 * finds a link inside a message
 */
var linksfinder = function(message){
	var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;	
	return message.match(exp);
};
var channel = "#chiglug",
    botname = "human";

var client = new irc.Client('irc.oftc.net', 'human', {
    channels: [channel],
});

function process(from, message) {
	var words = message.split(" "),
		property = words[1];

	if(words.length < 3)
		return;
	
	// get rid of the first two elements
	words.splice(0,1);
	words.splice(0,1);
	var value = words.join(" ");

	// get the doc if it exists
	var docid = from;
	db.getDoc(docid, function(er, doc) {
		if(er && er.error == "not_found") {
			doc = {};
			doc.type = "user";
		}
		doc[property] = value;
		db.saveDoc(docid, doc, function(er, ok) {
			if (er) throw new Error(JSON.stringify(er));
		});
	});
	return;
}

client.addListener('message'+channel, function (from, message) {	
	var links = linksfinder(message) || [];
	
	links.forEach(function(link) {
			db.saveDoc({
				type: 'link',
				created_at: new Date(),
				user: from,
				link: link
			}, function(er, ok) {
				if (er) throw new Error(JSON.stringify(er));
				//client.say(channel, "I've saved your shit here: http://chiglug.tk/api/"+ok.id);
			});
	});

	if(message.indexOf(botname) == 0) {
		process(from, message);
	}
});
