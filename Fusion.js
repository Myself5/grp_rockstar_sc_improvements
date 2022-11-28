// ==UserScript==
// @name		GrandRP ACP Social Club improvements
// @namespace	https://myself5.de
// @version		1.0.3
// @description	Conveniently link to Rockstars SocialClub list and highlight know good/bad SCs.
// @author		Myself5
// @match		https://gta5grand.com/admin_*/account/search
// @match		https://socialclub.rockstargames.com/members*
// @grant		GM_getValue
// @grant		GM_setValue
// @grant		GM_deleteValue
// ==/UserScript==

// Config
// weather to use Buttons behind the SC Names or make them clickable through a hyperlink
var acpUseButtons = false;

// Basevalues, don't touch
var baseURL = "https://socialclub.rockstargames.com/members/";
var acpTableCount = "";
var hostnameRS = 'socialclub.rockstargames.com';
var hostnameACP = 'gta5grand.com';

function waitForInit() {
	var checkExist = setInterval(function() {
		var newCount = $("#result_count").text().toLowerCase();
		if (acpTableCount !== newCount) {
			acpTableCount = newCount;
			var sctable = $("#result-players-list div:nth-child(2) table tr td:nth-child(6)");
			initButtons(sctable, getSCNames(sctable));
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

function initSearchButton() {
	acpTableCount = $("#result_count").text().toLowerCase();
	var search_button = document.getElementById('search-but');
	(function () {
		if (search_button != null) {
			search_button.addEventListener("click", function(){waitForInit();}, false);
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
			console.log("Checking sc_"+ sc_names[i]);
			var sc_checked = rsValue != null;
			if (sc_checked) {
				var sc_legit = rsValue === "true";
				console.log("Value for sc_"+ sc_names[i] + " is " + sc_legit);
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
				sc_fields[i].setHTML("<td><font " + fontcolor + " >" + sc_names[i] + "</font> <button type='button' id='scbutton"+ i + "'>SC Check</button></td>");
				sc_buttons[i] = document.getElementById('scbutton' + i);
				(function () {
					var name = sc_names[i];
					if (sc_buttons[i] != null) {
						sc_buttons[i].addEventListener("click", function(){openSCWebsite(name);}, false);
					}
				}());
			} else {
				sc_fields[i].setHTML("<td><a style='color: " + fontcolor + ";' href='" + baseURL + sc_names[i] + "/' target='_blank'>" + sc_names[i] + "</a></td>");
			}
		}
	}
}

function initButtons(sc_fields, sc_names) {
	$("#result-players-list div:nth-child(2) table tr th:nth-child(6)")[0].setHTML("<th>Social Club <button type='button' id='sccolorredraw'>Color</button></th>");
	var sc_colorbutton = document.getElementById('sccolorredraw');
	if (sc_colorbutton != null) {
		sc_colorbutton.addEventListener("click", function(){redrawSCButtons(sc_fields, sc_names);}, false);
	}

	acpTableCount = $("#result_count").text().toLowerCase() + ".";
	$("#result_count").append(".");

	redrawSCButtons(sc_fields, sc_names);
}

function submitSCResult(name, result) {
	if (name.length != 0) {
		var res = result ? "true" : "false";
		console.log("Storing " + name + " with Value " + res);
		GM_setValue("sc_" + name, res)
	}
}

function ClearSCResult(name) {
	if (name.length != 0) {
		console.log("clearing " + name)
		GM_deleteValue("sc_" + name);
	}
}

function getSBValue() {
	var val = "";
	var searchbox = document.getElementsByClassName('Search__input__2XIsq')[0];

	if (searchbox != null) {
		console.log("searchbox defined " + searchbox);
		val = searchbox.value;
		console.log("searchbox value " + val);
	} else {
		console.log("searchbox  undefined");
	}
	return val;
}

function initRSButtons() {
	var txt = document.createElement("h4");
	txt.innerHTML = "Social Club Legit? <button type='button' id='sc_legit'>Yes</button> <button type='button' id='sc_notlegit'>No</button> <button type='button' id='sc_clear'>Clear</button>";
	var searchfilter = document.getElementsByClassName('Search__filter__2wpcM')[0];

	if (searchfilter != null) {
		searchfilter.append(txt);
	}

	var sc_legitbutton = document.getElementById('sc_legit');
	var sc_unlegitbutton = document.getElementById('sc_notlegit');
	var sc_clearbutton = document.getElementById('sc_clear');

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
	}());
}

window.addEventListener('load', function() {

	if (location.hostname === hostnameACP) {
		initSearchButton();
	}

	if (location.hostname === hostnameRS) {
		initRSButtons();
	}

}, false);