// ==UserScript==
// @name		GrandRP/Rockstar Social Club improvements
// @namespace	https://myself5.de
// @version		2.9
// @description	Conveniently link to Rockstars SocialClub list and highlight know good/bad SCs.
// @author		Myself5
// @match		https://gta5grand.com/admin_*/account/search
// @match		https://socialclub.rockstargames.com/members*
// @match		https://gta5grand.com/admin_de/logs/authorization*
// @grant		GM_getValue
// @grant		GM_setValue
// @grant		GM_deleteValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js
// ==/UserScript==

// Config
// weather to use Buttons behind the SC Names or make them clickable through a hyperlink
const acpUseButtons = false;

// Basevalues, don't touch
var acpTableCount = "";
const baseURL = "https://socialclub.rockstargames.com/members/";
const hostnameRS = 'socialclub.rockstargames.com';
const hostnameACP = 'gta5grand.com';
const pathAuthLogs = new RegExp('/admin_.*\/logs\/authorization');
const pathPlayerSearch = new RegExp('/admin_.*\/account\/search');

const _authLogCount = "body > div.app-layout-canvas > div > main > div > div.row > div";
const _authLogHeader = "body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > thead > tr > th:nth-child(4)";
const _authLogTable = "body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(4)";
const authLogSelectors = { count : _authLogCount, header : _authLogHeader, table : _authLogTable};

const _playerSearchCount = "#result_count";
const _playerSearchHeader = "#result-players-list div:nth-child(2) table tr th:nth-child(6)";
const _playerSearchTable = "#result-players-list div:nth-child(2) table tr td:nth-child(6)";
const playerSearchSelectors = { count : _playerSearchCount, header : _playerSearchHeader, table : _playerSearchTable};

var colorMatch = { id : 'colorMatch', value : GM_getValue("colorMatch_value", "true") === "true"};
var showSCID = { id : 'showSCID', value : GM_getValue("showSCID_value", "true") === "true"};
var showAllSCID = { id : 'showAllSCID', value : GM_getValue("showAllSCID_value", "false") === "true"};

function waitForInit(pathSelectors) {
	var checkExist = setInterval(function() {
		var newCount = $(pathSelectors.count).text().toLowerCase();
		if (acpTableCount !== newCount) {
			acpTableCount = newCount;
			var sctable = $(pathSelectors.table);
			initButtons(sctable, getSCNames(sctable), pathSelectors);
			clearInterval(checkExist);
		}
	}, 1000); // check every 1000ms
}

function getSCNames(sc_fields) {
	var sc_namesinternal = [];
	for (var i=0; i < sc_fields.length; i++) {
		sc_namesinternal[i] = sc_fields[i].textContent;
	}
	return sc_namesinternal;
}

function initSearchButton(pathSelectors) {
	acpTableCount = $(pathSelectors.count).text().toLowerCase();
	var search_button = document.getElementById('search-but');
	(function () {
		if (search_button != null) {
			search_button.addEventListener("click", function(){waitForInit(pathSelectors);}, false);
		}
	}());
}

function openSCWebsite(sc_name) {
	window.open(baseURL + sc_name + "/");
}

function redrawSCButtons(sc_fields, sc_names) {
	var sc_buttons = [];
	for (var i=0; i < sc_fields.length; i++) {
		if (sc_names[i].length != 0) {
			var fontcolor = "";
			if (!acpUseButtons) {
				fontcolor = "rgb(85, 160, 200)";
			}
			var rsValue = GM_getValue("sc_" + sc_names[i], null);
			var sc_checked = rsValue != null;
			if (sc_checked) {
				var sc_legit = rsValue === "true";
				if (sc_legit) {
					if (acpUseButtons) {
						fontcolor = "color='green'";
					} else {
						fontcolor = "rgb(0, 255, 0)";
					}
				} else {
					if (acpUseButtons) {
						fontcolor = "color='red'";
					} else {
						fontcolor = "rgb(255, 0, 0)";
					}
				}
			}

			if (acpUseButtons) {
				sc_fields[i].innerHTML = "<font " + fontcolor + " >" + sc_names[i] + "</font> <button type='button' id='scbutton"+ i + "'>SC Check</button>";
				sc_buttons[i] = document.getElementById('scbutton' + i);
				(function () {
					var name = sc_names[i];
					if (sc_buttons[i] != null) {
						sc_buttons[i].addEventListener("click", function(){openSCWebsite(name);}, false);
					}
				}());
			} else {
				sc_fields[i].innerHTML ="<a style='color: " + fontcolor + ";' href='" + baseURL + sc_names[i] + "/' target='_blank'>" + sc_names[i] + "</a>";
			}
		}
	}
}

function initButtons(sc_fields, sc_names, pathSelectors) {
	$(pathSelectors.header)[0].innerHTML = "Social Club <button type='button' id='sccolorredraw'>Color</button>";
	var sc_colorbutton = document.getElementById('sccolorredraw');
	if (sc_colorbutton != null) {
		sc_colorbutton.addEventListener("click", function(){redrawSCButtons(sc_fields, sc_names);}, false);
	}

	acpTableCount = $(pathSelectors.count).text().toLowerCase() + ".";
	$(pathSelectors.count).append(".");

	redrawSCButtons(sc_fields, sc_names);
}

function submitSCResult(name, result) {
	if (name.length != 0) {
		var res = result ? "true" : "false";
		GM_setValue("sc_" + name, res)
	}
}

function ClearSCResult(name) {
	if (name.length != 0) {
		GM_deleteValue("sc_" + name);
	}
}

function getSBValue() {
	var val = "";
	var searchbox = document.getElementsByClassName('Search__input__2XIsq')[0];

	if (searchbox != null) {
		val = searchbox.value;
	}
	return val;
}

function updateSCCheckboxState(cb, value) {
	var res = value ? "true" : "false";
	cb.value = value;
	GM_setValue(cb.id + "_value", res);
	waitForRSPlayerCards();
}

function initRSPage() {
	var txt = document.createElement("h4");
	txt.innerHTML = "\
	Social Club Legit? \
	<button type='button' id='sc_legit'>Yes</button> \
	<button type='button' id='sc_notlegit'>No</button> \
	<button type='button' id='sc_clear'>Clear</button><br>\
	<input type='checkbox' id=" + colorMatch.id + "> \
	<label for=" + colorMatch.id + "> Color Name Match</label> \
	<input type='checkbox' id=" + showSCID.id + "> \
	<label for=" + showSCID.id + "> Show Match SCID</label> \
	<input type='checkbox' id=" + showAllSCID.id + "> \
	<label for=" + showAllSCID.id + "> Show SCID for All Accounts</label> \
	";
	var searchfilter = document.getElementsByClassName('Search__filter__2wpcM')[0];

	if (searchfilter != null) {
		searchfilter.append(txt);
	}

	var sc_legitbutton = document.getElementById('sc_legit');
	var sc_unlegitbutton = document.getElementById('sc_notlegit');
	var sc_clearbutton = document.getElementById('sc_clear');
	var sc_colorMatches = document.getElementById(colorMatch.id);
	var sc_showSCID = document.getElementById(showSCID.id);
	var sc_showAllSCID = document.getElementById(showAllSCID.id);


	sc_colorMatches.checked = colorMatch.value;
	sc_showSCID.checked = showSCID.value;
	sc_showAllSCID.checked = showAllSCID.value;

	(function () {
		if (sc_legitbutton != null) {
			sc_legitbutton.addEventListener("click", function(){submitSCResult(getSBValue(), true);}, false);
		}
		if (sc_unlegitbutton != null) {
			sc_unlegitbutton.addEventListener("click", function(){submitSCResult(getSBValue(), false);}, false);
		}
		if (sc_clearbutton != null) {
			sc_clearbutton.addEventListener("click", function(){ClearSCResult(getSBValue());}, false);
		}
		if (sc_colorMatches != null) {
			sc_colorMatches.addEventListener("click", function(){updateSCCheckboxState(colorMatch, sc_colorMatches.checked);}, false);
		}
		if (sc_showSCID != null) {
			sc_showSCID.addEventListener("click", function(){updateSCCheckboxState(showSCID, sc_showSCID.checked);}, false);
		}
		if (sc_showAllSCID != null) {
			sc_showAllSCID.addEventListener("click", function(){updateSCCheckboxState(showAllSCID, sc_showAllSCID.checked);}, false);
		}
	}());
}

function getCookie(e) {
	for (var t = e + "=", r = decodeURIComponent(document.cookie).split(";"), o = 0; o < r.length; o++) {
		for (var n = r[o];
			" " == n.charAt(0);) n = n.substring(1);
			if (0 == n.indexOf(t)) return n.substring(t.length, n.length)
		}
	return ""
}

function waitForRSPlayerCards() {
	var playerCards = document.getElementsByClassName('UI__PlayerCard__text');
	var playerCardsSize = 0;

	var checkExist = setInterval(function() {
		playerCards = document.getElementsByClassName('UI__PlayerCard__text');
		var newCount = playerCards.length;
		if (playerCards != null && playerCardsSize != newCount) {
			playerCardsSize = newCount;
			processRSPlayerCards(playerCards);
			clearInterval(checkExist);
		}
    }, 500); // check every 1000ms

	// Observer to update Playercards on new search input. For the lack of a better check, observe the URL.
	var oldPath = location.pathname;
	var checkUpdated = setInterval(function() {
		if (oldPath !== location.pathname) {
			oldPath = location.pathname;
			waitForRSPlayerCards();
			clearInterval(checkUpdated);
		}
    }, 500); // check every 1000ms
}

function processRSPlayerCards(playerCards) {
	for (var i=0; i < playerCards.length; i++) {
		
		var outerdiv = document.createElement('div');
		outerdiv.className = 'UI__PlayerCard__service';
		var textspan = document.createElement('span');
		textspan.className = 'markedText';



		if (playerCards[i].getElementsByClassName('UI__PlayerCard__username') != null) {
			var uNameCard = playerCards[i].getElementsByClassName('UI__PlayerCard__username')[0];
			uNameCard.after(outerdiv);
			var username = uNameCard.textContent;
			textspan.id = "rid_" + username;

			var playercardTextField = document.getElementById(textspan.id);
			if (playercardTextField == null) {
				outerdiv.appendChild(textspan);
				playercardTextField = textspan;
			}

			if (getSBValue() === username) {
				var uNameCardText = uNameCard.getElementsByClassName('UI__MarkText__mark');
				var colorstyle =  colorMatch.value ? "color:green" : "";
				if (uNameCardText != null) {
					uNameCardText[0].style = colorstyle;
				}
				playercardTextField.style = colorstyle;
			}

			if (showSCID.value && (getSBValue() === username || showAllSCID.value)) {
				$.ajax({
					method: 'GET',
					url: 'https://scapi.rockstargames.com/profile/getprofile?nickname=' + username + '&maxFriends=3',
					beforeSend: function(request) {
						request.setRequestHeader('Authorization', 'Bearer ' + getCookie('BearerToken'));
						request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
					}
				})
				.done(function(data) {
					var scid = data.accounts[0].rockstarAccount.rockstarId;
					var uname = data.accounts[0].rockstarAccount.name;
					document.getElementById("rid_" + uname).innerHTML = "RID: " + scid;
				});
			} else {
				playercardTextField.remove();
			}
		}
	}
}

window.addEventListener('load', function() {

	if (location.hostname === hostnameACP) {
		if (pathPlayerSearch.test(location.pathname)) {
			initSearchButton(playerSearchSelectors);
		}
		if (pathAuthLogs.test(location.pathname)) {
			waitForInit(authLogSelectors);
		}
	}

	if (location.hostname === hostnameRS) {
		initRSPage();
		waitForRSPlayerCards();
	}

}, false);
