var traits = {
    "live": {
        "attributes": {
            "liveness": {
                "value": 0.8,
                "type": "min"
            }
        }
    },
    "studio": {
        "attributes": {
            "liveness": {
                "value": 0.6,
                "type": "max"
            }
        }
    },
    "acoustic": {
        "attributes": {
            "acousticness": {
                "value": 0.8,
                "type": "min"
            }
        }
    },
    "hype": {
        "attributes": {
            "energy": {
                "value": 0.7,
                "type": "min"
            }
        }
    },
    "mellow": {
        "attributes": {
            "energy": {
                "value": 0.4,
                "type": "max"
            }
        }
    },
    "happy": {
        "attributes": {
            "mode": {
                "value": 1,
                "type": "target"
            },
            "valence": {
                "value": 0.6,
                "type": "min"
            }
        }
    },
    "sad": {
        "attributes": {
            "mode": {
                "value": 0,
                "type": "target"
            },
            "valence": {
                "value": 0.4,
                "type": "max"
            }
        }
    },
    "melancholy": {
        "attributes": {
            "mode": {
                "value": 0,
                "type": "target"
            },
            "valence": {
                "value": 0.6,
                "type": "max"
            }
        }
    },
    "instrumental": {
        "attributes": {
            "instrumentalness": {
                "value": 0.5,
                "type": "min"
            }
        }
    },
    "danceable": {
        "attributes": {
            "danceability": {
                "value": 0.5,
                "type": "min"
            }
        }
    }
}
var enabledTraits = [];

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();

    // Change this to div.childNodes to support multiple top-level nodes
    return div.firstChild; 
}

var modeControl = false;
function toggleModeControl() {
    modeControl = !modeControl;
    if (modeControl) {
        document.getElementById("key-letter").setAttribute("contenteditable", true);
        document.getElementById("key-accidental").removeAttribute("disabled");
        document.getElementById("mode").removeAttribute("disabled");
    } else {
        document.getElementById("key-letter").removeAttribute("contenteditable");
        document.getElementById("key-accidental").setAttribute("disabled", true);
        document.getElementById("mode").setAttribute("disabled", true);
    }
}

window.onload = function() {
    document.getElementById("key-letter").removeAttribute("contenteditable");
    document.getElementById("key-accidental").setAttribute("disabled", true);
    document.getElementById("mode").setAttribute("disabled", true);

    for (var i = 0; i < Object.keys(traits).length; i++) {
        var traitName = Object.keys(traits)[i];
        var button = document.createElement("button");
        
        document.getElementById("traits").appendChild(createElementFromHTML(`<button type="button" id="trait-${traitName}" class="btn btn-primary" data-toggle="button" aria-pressed="false" autocomplete="off">${traitName}</button>`));
        document.getElementById("trait-" + traitName).addEventListener("click", function(e) {
            var trait = e.srcElement.textContent;
            if (enabledTraits.indexOf(trait) == -1) {
                enabledTraits.push(trait)
            } else {
                enabledTraits.splice(enabledTraits.indexOf(trait), 1);
            }
        })
    }

    document.getElementById("generate").addEventListener("click", function(e) {
        /*var test_parameters = {
            traits: decodeURI(req.query["traits"]).split(","),
            artists: decodeURI(req.query["artists"]).split(","),
            genres: decodeURI(req.query["genres"]).split(","),
            signature: decodeURI(req.query["signature"]),
            key: decodeURI(req.query["key"]),
            mode: decodeURI(req.query["mode"]),
            tracks: req.query["tracks"]
        }*/

        var URL = "/music/playlist?";
        URL += "traits=" + enabledTraits.join(",") + "&";
        URL += "artists=" + encodeURI(document.getElementById("artists").innerText.replace(", ", ",")) + "&";
        URL += "genres=" + encodeURI(document.getElementById("genres").innerText.replace(", ", ",")) + "&";
        URL += "signature=" + document.getElementById("meter").innerText + "&";
        if (modeControl) {
            var keyArray = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            var keyLetter = document.getElementById("key-letter").innerText;
            var e = document.getElementById("key-accidental");
            var keyAccidental = e.options[e.selectedIndex].value;
            var keyNumber = keyArray.indexOf(keyLetter);

            switch (keyAccidental) {
                case "natural":
                    break;
                case "sharp":
                    keyNumber += 1;
                    break;
                case "flat":
                    keyNumber -= 1;
                    break;
            }

            URL += "key=" + encodeURI(keyNumber) + "&";
            
            var f = document.getElementById("key-accidental");
            var mode = f.options[f.selectedIndex].value;
            if (mode == "major") {
                URL += "mode=" + 1 + "&";
            } else {
                URL += "mode=" + 0 + "&";
            }
        } else {
            URL += "modecontrol=0&"
        }
        URL += "tracks=" + document.getElementById("tracknumber").innerText;
        console.log(URL);
        $.get(URL, function(data) {
            var playlistURL = data["url"];
            var embedURL = playlistURL.replace("/user/", "/embed/user/");
            document.getElementById("playlist").setAttribute("src", embedURL);
            document.getElementById("playlist").contentWindow.location.reload(); 
        });
    });
}