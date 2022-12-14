// ==UserScript==
// @name		GrandRP/Rockstar Social Club improvements
// @namespace	https://myself5.de
// @version		4.1.1
// @description	Improve all kinds of ACP and SocialClub features
// @author		Myself5
// @updateURL	https://g.m5.cx/Fusion.js
// @downloadURL	https://g.m5.cx/Fusion.js
// @match		https://gta5grand.com/admin_*/account/search
// @match		https://socialclub.rockstargames.com/members*
// @match		https://gta5grand.com/admin_*/logs/authorization*
// @match		https://gta5grand.com/admin_*/logs/money*
// @grant		GM_getValue
// @grant		GM_setValue
// @grant		GM_deleteValue
// @require		https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js
// ==/UserScript==

// Basevalues, don't touch
// Common
const closeAfterProcessLocationSearch = "?closeAfterProcess";

// ACP Variables
var acpTableCount = "";
const baseURL = "https://socialclub.rockstargames.com/members/";
const hostnameACP = 'gta5grand.com';
const pathAuthLogs = new RegExp('/admin_.*\/logs\/authorization');
const pathMoneyLogs = new RegExp('/admin_.*\/logs\/money');
const pathPlayerSearch = new RegExp('/admin_.*\/account\/search');
const moneyMaxValue = 5000000;

const _selectorTypes = { socialclub: 0, money: 1 };

const _authLogCount = "body > div.app-layout-canvas > div > main > div > div.row > div";
const _authLogHeader = "body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > thead > tr > th:nth-child(4)";
const _authLogTable = "body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(4)";
const authLogSelectors = { count: _authLogCount, header: _authLogHeader, table: _authLogTable, type: _selectorTypes.socialclub };

const _moneyLogCount = "body > div.app-layout-canvas > div > main > div > div.row > div";
const _moneyLogHeader = "body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > thead > tr > th:nth-child(4)";
const _moneyLogNameTable = "body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(1) > a";
const _moneyLogDateTable = "body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(2)";
const _moneyLogQttyTable = "body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(4)";
const moneyLogSelectors = { count: _moneyLogCount, header: _moneyLogHeader, nametable: _moneyLogNameTable, datetable: _moneyLogDateTable, qttytable: _moneyLogQttyTable, type: _selectorTypes.money };

const _playerSearchCount = "#result_count";
const _playerSearchHeader = "#result-players-list div:nth-child(2) table tr th:nth-child(6)";
const _playerSearchTable = "#result-players-list div:nth-child(2) table tr td:nth-child(6)";
const playerSearchSelectors = { count: _playerSearchCount, header: _playerSearchHeader, table: _playerSearchTable, type: _selectorTypes.socialclub };

var autoProcess = { id: 'autoProcess', value: GM_getValue("autoProcess_value", "false") === "true", spoiler: 'autoProcessOptions' };
var closeAfterProcess = { id: 'closeAfterProcess', value: GM_getValue("closeAfterProcess_value", "false") === "true" };
var backgroundProcessButton = { id: 'backgroundProcessButton', value: GM_getValue("backgroundProcessButton_value", "false") === "true" };
var hideButtonOnProcessedNames = { id: 'hideButtonOnProcessedNames', value: GM_getValue("hideButtonOnProcessedNames_value", "false") === "true", spoiler: 'hideButtonOnProcessedNamesSpoiler' };

const scOptionsSpoiler = "<br>\
<input type='checkbox' id=" + autoProcess.id + ">\
<label for=" + autoProcess.id + "> Automatically process SC</label><br>\
<div id='" + autoProcess.spoiler + "' style='display:none;'>\
<input type='checkbox' id=" + closeAfterProcess.id + ">\
<label for=" + closeAfterProcess.id + "> Automatically close after processing SC</label><br>\
<input type='checkbox' id=" + backgroundProcessButton.id + ">\
<label for=" + backgroundProcessButton.id + "> Show Button to process SC in Background</label><br>\
<div id='" + hideButtonOnProcessedNames.spoiler + "' style='display:none;'>\
<input type='checkbox' id=" + hideButtonOnProcessedNames.id + ">\
<label for=" + hideButtonOnProcessedNames.id + "> Hide Button on previously processed SCs</label><br>\
</div>\
</div>\
";

const moneyOptionsSpoiler = "Currently Empty";

const optionSpoilerTypes = [scOptionsSpoiler, moneyOptionsSpoiler];

var playerMapPagesSum = getPlayerMapPagesSum();

// RS Variables
const hostnameRS = 'socialclub.rockstargames.com';

var colorMatch = { id: 'colorMatch', value: GM_getValue("colorMatch_value", "true") === "true" };
var showSCID = { id: 'showSCID', value: GM_getValue("showSCID_value", "true") === "true" };
var showAllSCID = { id: 'showAllSCID', value: GM_getValue("showAllSCID_value", "false") === "true" };

// Helper Methods
function JSONMapReplacer(key, value) {
	if (value instanceof Map) {
		return {
			dataType: 'Map',
			value: Array.from(value.entries()), // or with spread: value: [...value]
		};
	} else {
		return value;
	}
}

function JSONMapReviver(key, value) {
	if (typeof value === 'object' && value !== null) {
		if (value.dataType === 'Map') {
			return new Map(value.value);
		}
	}
	return value;
}

function getPlayerMapPagesSum() {
	var str = GM_getValue('playerMapPagesSum', '{"dataType":"Map","value":[]}');
	var map;
	try {
		map = JSON.parse(str, JSONMapReviver);
	} catch (e) {
		map = new Map();
	}
	return map;
}

function setPlayerMapPagesSum(map) {
	try {
		var str = JSON.stringify(map, JSONMapReplacer);
		GM_getValue('playerMapPagesSum', str);
	} catch (e) {
		// Invalid Map, reset values
		map = new Map();
	}
	return map;
}

function resetPlayerMapPagesSum() {
	GM_deleteValue('playerMapPagesSum');
	return new Map();
}

// Code
function waitForInit(pathSelectors) {
	var checkExist = setInterval(function () {
		var newCount = $(pathSelectors.count).text().toLowerCase();
		if (acpTableCount !== newCount) {
			acpTableCount = newCount;
			if (pathSelectors.type == _selectorTypes.socialclub) {
				var sctable = $(pathSelectors.table);
				initSCButtons(sctable, getTableValues(sctable), pathSelectors);
			} else if (pathSelectors.type == _selectorTypes.money) {
				var tables = {};
				tables.nameField = $(pathSelectors.nametable);
				tables.dateText = getTableValues($(pathSelectors.datetable));
				tables.qtty = $(pathSelectors.qttytable);
				initMoneyFields(tables, pathSelectors);
			}
			clearInterval(checkExist);
		}
	}, 1000); // check every 1000ms
}

function getTableValues(table) {
	var tableinternal = [];
	for (var i = 0; i < table.length; i++) {
		tableinternal[i] = table[i].textContent;
	}
	return tableinternal;
}

function initSearchButton(pathSelectors, button_listener) {
	var search_button;
	// Search Button on Auto an money logs is not labled, search by class and type
	// search_button = document.getElementById('search-but');
	var buttons = document.getElementsByClassName('btn btn-default');

	for (var i = 0; i < buttons.length; i++) {
		if (buttons[i].type === 'submit') {
			search_button = buttons[i];
		}
	}

	if (button_listener) {
		acpTableCount = $(pathSelectors.count).text().toLowerCase();
		(function () {
			if (search_button != null) {
				search_button.addEventListener("click", function () { waitForInit(pathSelectors); }, false);
			}
		}());
	}

	var optionsbutton = document.createElement('button');
	optionsbutton.title = "Click to show/hide content";
	optionsbutton.type = "button";
	optionsbutton.className = "btn btn-default";
	optionsbutton.onclick = function () {
		if (document.getElementById('optionsspoiler').style.display == 'none') {
			document.getElementById('optionsspoiler').style.display = '';
		} else {
			document.getElementById('optionsspoiler').style.display = 'none';
		}
	}
	optionsbutton.innerHTML = "Options";

	search_button.after(optionsbutton);

	var optionsspoiler = document.createElement('div');
	optionsspoiler.id = "optionsspoiler";
	optionsspoiler.style = "display:none";
	optionsspoiler.innerHTML = optionSpoilerTypes[pathSelectors.type];

	optionsbutton.after(optionsspoiler);

	if (pathSelectors.type == _selectorTypes.socialclub) {
		initSCOptionsBoxes();
	} else if (pathSelectors.type == _selectorTypes.money) {
		initMoneyOptionsBoxes();
	}

	if (!button_listener) {
		waitForInit(pathSelectors);
	}
}

function initSCOptionsBoxes() {
	var autoProcessCB = document.getElementById(autoProcess.id);
	autoProcessCB.checked = autoProcess.value;

	if (autoProcess.value) {
		document.getElementById(autoProcess.spoiler).style.display = '';
	} else {
		document.getElementById(autoProcess.spoiler).style.display = 'none';
	}

	var closeAfterProcessCB = document.getElementById(closeAfterProcess.id);
	closeAfterProcessCB.checked = closeAfterProcess.value;

	var backgroundProcessButtonCB = document.getElementById(backgroundProcessButton.id);
	backgroundProcessButtonCB.checked = backgroundProcessButton.value;

	var hideButtonOnProcessedNamesCB = document.getElementById(hideButtonOnProcessedNames.id);
	hideButtonOnProcessedNamesCB.checked = hideButtonOnProcessedNames.value;

	if (backgroundProcessButton.value) {
		document.getElementById(hideButtonOnProcessedNames.spoiler).style.display = '';
	} else {
		document.getElementById(hideButtonOnProcessedNames.spoiler).style.display = 'none';
	}

	(function () {
		initACPOptions(autoProcessCB, closeAfterProcessCB, backgroundProcessButtonCB, hideButtonOnProcessedNamesCB);
	}());
}

function initMoneyOptionsBoxes() {
	// do nothing for now
}

function initACPOptions(autoProcessCB, closeAfterProcessCB, backgroundProcessButtonCB, hideButtonOnProcessedNamesCB, sc_fields, sc_names) {
	if (autoProcessCB != null) {
		autoProcessCB.addEventListener("click", function () {
			updateCheckboxState(autoProcess, autoProcessCB.checked);
			if (autoProcessCB.checked) {
				document.getElementById(autoProcess.spoiler).style.display = '';
			} else {
				document.getElementById(autoProcess.spoiler).style.display = 'none';
			}
			if (sc_fields != null && sc_names != null) {
				redrawSCButtons(sc_fields, sc_names);
			}
		}, false);
	}
	if (closeAfterProcessCB != null) {
		closeAfterProcessCB.addEventListener("click", function () {
			updateCheckboxState(closeAfterProcess, closeAfterProcessCB.checked, backgroundProcessButton, closeAfterProcessCB.checked, false);
			if (sc_fields != null && sc_names != null) {
				redrawSCButtons(sc_fields, sc_names);
			}
		}, false);
	}

	if (backgroundProcessButtonCB != null) {
		backgroundProcessButtonCB.addEventListener("click", function () {
			updateCheckboxState(backgroundProcessButton, backgroundProcessButtonCB.checked, closeAfterProcess, backgroundProcessButtonCB.checked, false);
			if (backgroundProcessButtonCB.checked) {
				document.getElementById(hideButtonOnProcessedNames.spoiler).style.display = '';
			} else {
				document.getElementById(hideButtonOnProcessedNames.spoiler).style.display = 'none';
			}
			if (sc_fields != null && sc_names != null) {
				redrawSCButtons(sc_fields, sc_names);
			}
		}, false);
	}

	if (hideButtonOnProcessedNamesCB != null) {
		hideButtonOnProcessedNamesCB.addEventListener("click", function () {
			updateCheckboxState(hideButtonOnProcessedNames, hideButtonOnProcessedNamesCB.checked);
			if (sc_fields != null && sc_names != null) {
				redrawSCButtons(sc_fields, sc_names);
			}
		}, false);
	}
}

function bgCheckSC(sc_name) {
	var url = baseURL + sc_name + "/" + closeAfterProcessLocationSearch;
	var path = window.document.URL;
	var win = window.open(url, sc_name, "width= 640, height= 480, left=0, top=0, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no").blur();
	window.focus();
}

function redrawSCButtons(sc_fields, sc_names) {
	var sc_buttons = [];
	for (var i = 0; i < sc_fields.length; i++) {
		if (sc_names[i].length != 0) {
			var fontcolor = "rgb(85, 160, 200)";
			var rsValue = GM_getValue("sc_" + sc_names[i], null);
			var sc_checked = rsValue != null;
			if (sc_checked) {
				var sc_legit = rsValue === "true";
				if (sc_legit) {
					fontcolor = "rgb(0, 255, 0)";
				} else {
					fontcolor = "rgb(255, 0, 0)";
				}
			}

			sc_fields[i].innerHTML = "<a style='color: " + fontcolor + ";' href='" + baseURL + sc_names[i] + "/" + ((autoProcess.value && closeAfterProcess.value) ? closeAfterProcessLocationSearch : "") + "' target='_blank'>"
				+ sc_names[i]
				+ "</a> "
				+ ((sc_checked && hideButtonOnProcessedNames.value) ? "" : ((autoProcess.value && backgroundProcessButton.value) ? "<button type='button' id='bgcheckButton_" + i + "'>Check</button>" : ""));

			if ((autoProcess.value && backgroundProcessButton.value)) {
				sc_buttons[i] = document.getElementById('bgcheckButton_' + i);
				(function () {
					var name = sc_names[i];
					if (sc_buttons[i] != null) {
						sc_buttons[i].addEventListener("click", function () {
							bgCheckSC(name);
						}, false);
					}
				}());
			}
		}
	}
}

function redrawMoneyFields(tables) {
	for (var i = 0; i < tables.qtty.length; i++) {
		var fontcolor = "";
		if (!isNaN(tables.qttyValue[i].value) && tables.qttyValue[i].value > moneyMaxValue) {
			fontcolor = "rgb(255, 0, 0)";
		}
		tables.qtty[i].style.color = fontcolor;
	}
}

function initSCButtons(sc_fields, sc_names, pathSelectors) {
	$(pathSelectors.header)[0].innerHTML = "Social Club <button type='button' id='sccolorredraw'>Update</button>";
	var sc_colorbutton = document.getElementById('sccolorredraw');
	if (sc_colorbutton != null) {
		sc_colorbutton.addEventListener("click", function () {
			redrawSCButtons(sc_fields, sc_names);
		}, false);
	}

	var autoProcessCB = document.getElementById(autoProcess.id);
	var closeAfterProcessCB = document.getElementById(closeAfterProcess.id);
	var backgroundProcessButtonCB = document.getElementById(backgroundProcessButton.id);
	var hideButtonOnProcessedNamesCB = document.getElementById(hideButtonOnProcessedNames.id);

	initACPOptions(autoProcessCB, closeAfterProcessCB, backgroundProcessButtonCB, hideButtonOnProcessedNamesCB, sc_fields, sc_names);

	acpTableCount = $(pathSelectors.count).text().toLowerCase() + ".";
	$(pathSelectors.count).append(".");

	redrawSCButtons(sc_fields, sc_names);
}

function initMoneyFields(tables, pathSelectors) {
	tables.qttyText = getTableValues(tables.qtty);
	tables.qttyValue = [];

	for (var i = 0; i < tables.qttyText.length; i++) {
		tables.qttyValue[i] = { value: parseInt(tables.qttyText[i].replace(/^\D+/g, '')), outgoing: tables.qttyText[i].startsWith('-') };
	}

	acpTableCount = $(pathSelectors.count).text().toLowerCase() + ".";
	$(pathSelectors.count).append(".");

	$(pathSelectors.header)[0].innerHTML = "Quantity  <button type='button' id='resetSumMoneyButton'>Reset</button> <button type='button' id='addToSumMoneyButton'>Add</button> <button type='button' id='sumMoneyButton'>Show</button>";
	const resetSumTableButton = document.getElementById('resetSumMoneyButton');
	const addToSumMoneyButton = document.getElementById('addToSumMoneyButton');
	const sumMoneyButton = document.getElementById('sumMoneyButton');
	if (resetSumTableButton != null) {
		resetSumTableButton.addEventListener("click", function () {
			playerMapPagesSum = resetPlayerMapPagesSum();
			addToSumMoneyButton.style.visibility = 'visible';
		}, false);
	}
	if (addToSumMoneyButton != null) {
		addToSumMoneyButton.addEventListener("click", function () {
			addToDailySumMap(tables);
			addToSumMoneyButton.style.visibility = 'hidden';
		}, false);
	}
	if (sumMoneyButton != null) {
		sumMoneyButton.addEventListener("click", function () {
			openDailyTotalTable(getTrimmedDatePlayerData(addToDailySumMap(tables)));
		}, false);
	}

	redrawMoneyFields(tables);
}

function getTrimmedDatePlayerData(untrimmedPlayerMap) {
	var playerDateData = { allDates: [], playerMap: new Map() };
	untrimmedPlayerMap.forEach((untrimmedPlayerDateMap, playerID) => {
		untrimmedPlayerDateMap.forEach((qtty, date) => {
			var dateTrimmed = date.split(' ')[0];
			var qttyTrimmed = { ...qtty };
			if (!playerDateData.allDates.includes(dateTrimmed)) {
				playerDateData.allDates.push(dateTrimmed);
			}
			var playerDateMap = new Map();
			if (playerDateData.playerMap.has(playerID)) {
				playerDateMap = playerDateData.playerMap.get(playerID);
				if (playerDateMap.has(dateTrimmed)) {
					qttyTrimmed.incoming += playerDateMap.get(dateTrimmed).incoming;
					qttyTrimmed.outgoing += playerDateMap.get(dateTrimmed).outgoing;
				}
			}
			playerDateMap.set(dateTrimmed, qttyTrimmed);
			playerDateData.playerMap.set(playerID, playerDateMap);
		})
	})
	return playerDateData;
}

function addToDailySumMap(tables) {
	for (var i = 0; i < tables.qtty.length; i++) {
		var hrefSplit = tables.nameField[i].href.split('/');
		var playerID = tables.nameField[i].text + " (" + hrefSplit[hrefSplit.length - 1] + ")";
		var date = tables.dateText[i];
		var qtty = tables.qttyValue[i].value;
		const isOutgoing = tables.qttyValue[i].outgoing;
		var todayBal = isOutgoing ? { incoming: 0, outgoing: qtty } : { incoming: qtty, outgoing: 0 };
		var playerDateMap = new Map();
		if (playerMapPagesSum.has(playerID)) {
			playerDateMap = playerMapPagesSum.get(playerID);
			if (playerDateMap.has(date)) {
				// Assume that there's only one transfer per Second per Player
				// Overwrite whatever value is there already (which should always be zero)
				todayBal = playerDateMap.get(date);
				isOutgoing ? todayBal.outgoing = qtty : todayBal.incoming = qtty;
			}
		}
		playerDateMap.set(date, todayBal);
		playerMapPagesSum.set(playerID, playerDateMap);
	}
	return setPlayerMapPagesSum(playerMapPagesSum);
}

function openDailyTotalTable(moneyData) {
	var tbl = document.createElement('table'),
		header = tbl.createTHead();
	tbl.width = "90%";
	tbl.align = "center";
	tbl.style.textAlign = "center";
	tbl.style.border = '1px solid #ddd';
	tbl.style.borderCollapse = "collapse";

	var headerRow = header.insertRow();

	var cell = headerRow.insertCell();
	cell.innerHTML = "<b>Name/Date</b>";
	cell.style.border = '1px solid #ddd';
	cell.style.padding = "10px";

	for (let i = 0; i < moneyData.allDates.length; i++) {
		cell = headerRow.insertCell();
		cell.innerHTML = "<b>" + moneyData.allDates[i] + "</b>";
		cell.style.border = '1px solid #ddd';
		cell.style.padding = "10px";
	}

	moneyData.playerMap.forEach((player, playerName) => {
		const tr = tbl.insertRow();
		var cell = tr.insertCell();
		cell.innerHTML = "<b>" + playerName + "</b>";
		cell.style.border = '1px solid #ddd';
		cell.style.padding = "10px";
		for (let j = 0; j < moneyData.allDates.length; j++) {
			const td = tr.insertCell();
			td.style.border = '1px solid #ddd';
			td.style.padding = "10px";
			var totalTdy = { incoming: 0, outgoing: 0 };
			if (player.has(moneyData.allDates[j])) {
				totalTdy = player.get(moneyData.allDates[j]);
			}
			var fontcolor = "";
			if (totalTdy.incoming > moneyMaxValue || totalTdy.outgoing > moneyMaxValue) {
				fontcolor = "rgb(255, 0, 0)";
			}
			td.innerHTML = "<a style='color: " + fontcolor + ";'>Incoming: $" + totalTdy.incoming + "<br> Outgoing: $" + totalTdy.outgoing + "</a>";
		}
	})
	var newWindow = window.open();
	newWindow.document.body.appendChild(tbl);
}

function submitSCResult(name, result) {
	if (name != null && name.length > 2) {
		var res = result ? "true" : "false";
		GM_setValue("sc_" + name, res)
	}
}

function ClearSCResult(name) {
	if (name.length != 0) {
		GM_deleteValue("sc_" + name);
	}
}

function getSCNameFromURL() {
	return window.location.pathname.split('/')[2];
}

function updateCheckboxState(cb, value, cbAdj, valueAdj, valueAdjValue) {
	cb.value = value;
	GM_setValue(cb.id + "_value", value ? "true" : "false");

	if (cbAdj != null && valueAdj != null && valueAdj) {
		if (valueAdjValue != null) {
			value = valueAdjValue;
		}
		GM_setValue(cbAdj.id + "_value", value ? "true" : "false");
		cbAdj.value = value;
		document.getElementById(cbAdj.id).checked = value;
	}
}

function initRSPage() {
	closeAfterProcess.value = location.search === closeAfterProcessLocationSearch;
	var txt = document.createElement("h4");
	txt.innerHTML = "\
	<div id='" + autoProcess.spoiler + "' style='display:none;'>\
	Social Club Legit? \
	<button type='button' id='sc_legit'>Yes</button> \
	<button type='button' id='sc_notlegit'>No</button> \
	<button type='button' id='sc_clear'>Clear</button><br>\
	</div>\
	<input type='checkbox' id=" + colorMatch.id + "> \
	<label for=" + colorMatch.id + "> Color Name Match</label> \
	<input type='checkbox' id=" + showSCID.id + "> \
	<label for=" + showSCID.id + "> Show Match SCID</label> \
	<input type='checkbox' id=" + showAllSCID.id + "> \
	<label for=" + showAllSCID.id + "> Show SCID for All Accounts</label> \
	<input type='checkbox' id=" + autoProcess.id + "> \
	<label for=" + autoProcess.id + "> Automatically process searched SC</label> \
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
	var sc_autoProcess = document.getElementById(autoProcess.id);

	sc_colorMatches.checked = colorMatch.value;
	sc_showSCID.checked = showSCID.value;
	sc_showAllSCID.checked = showAllSCID.value;
	sc_autoProcess.checked = autoProcess.value;

	if (!autoProcess.value) {
		document.getElementById(autoProcess.spoiler).style.display = '';
	} else {
		document.getElementById(autoProcess.spoiler).style.display = 'none';
	}

	(function () {
		if (sc_legitbutton != null) {
			sc_legitbutton.addEventListener("click", function () {
				submitSCResult(getSCNameFromURL(), true);
			}, false);
		}
		if (sc_unlegitbutton != null) {
			sc_unlegitbutton.addEventListener("click", function () {
				submitSCResult(getSCNameFromURL(), false);
			}, false);
		}
		if (sc_clearbutton != null) {
			sc_clearbutton.addEventListener("click", function () {
				ClearSCResult(getSCNameFromURL());
			}, false);
		}
		if (sc_colorMatches != null) {
			sc_colorMatches.addEventListener("click", function () {
				updateCheckboxState(colorMatch, sc_colorMatches.checked);
				waitForRSPlayerCards();
			}, false);
		}
		if (sc_showSCID != null) {
			sc_showSCID.addEventListener("click", function () {
				updateCheckboxState(showSCID, sc_showSCID.checked, showAllSCID, !sc_showSCID.checked);
				waitForRSPlayerCards();
			}, false);
		}
		if (sc_showAllSCID != null) {
			sc_showAllSCID.addEventListener("click", function () {
				updateCheckboxState(showAllSCID, sc_showAllSCID.checked, showSCID, sc_showAllSCID.checked);
				waitForRSPlayerCards();
			}, false);
		}
		if (sc_autoProcess != null) {
			sc_autoProcess.addEventListener("click", function () {
				updateCheckboxState(autoProcess, sc_autoProcess.checked);
				if (!autoProcess.value) {
					document.getElementById(autoProcess.spoiler).style.display = '';
				} else {
					document.getElementById(autoProcess.spoiler).style.display = 'none';
				}
			}, false);
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

	var checkExist = setInterval(function () {
		playerCards = document.getElementsByClassName('UI__PlayerCard__text');
		var newCount = playerCards.length;
		var name = getSCNameFromURL();
		if (name != null && name.length > 2) {
			var noMemberMessage = document.getElementsByClassName('UI__Alert__content')[0];
			if (noMemberMessage != null) {
				var messageIcon = noMemberMessage.getElementsByClassName('UI__Alert__icon')[0];
				if (messageIcon != null) {
					if (messageIcon.dataset.uiName === 'alert_icon') {
						// no SC Found
						if (autoProcess.value) {
							submitSCResult(name, false);
							if (closeAfterProcess.value) {
								window.parent.close();
							}
						}
						clearInterval(checkExist);
					}
				}
			}
		}

		if (playerCards != null && playerCardsSize != newCount) {
			playerCardsSize = newCount;
			processRSPlayerCards(playerCards);
			clearInterval(checkExist);
		}
	}, 500); // check every 500ms

	// Observer to update Playercards on new search input. For the lack of a better check, observe the URL.
	var oldName = getSCNameFromURL();
	var checkUpdated = setInterval(function () {
		var newName = getSCNameFromURL();
		if (oldName !== newName) {
			oldName = newName;
			waitForRSPlayerCards();
			clearInterval(checkUpdated);
		}
	}, 500); // check every 500ms
}

function processRSPlayerCards(playerCards) {
	var searched_acc = { name: getSCNameFromURL(), exists: false };
	if (searched_acc.name == null) {
		// something is wrong
		return
	}
	for (var i = 0; i < playerCards.length; i++) {

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

			if (searched_acc.name === username) {
				searched_acc.exists = true;
				var uNameCardText = uNameCard.getElementsByClassName('UI__MarkText__mark');
				var colorstyle = colorMatch.value ? "color:green" : "";
				if (uNameCardText != null) {
					uNameCardText[0].style = colorstyle;
				}
				playercardTextField.style = colorstyle;
			}

			if (showSCID.value && (searched_acc.name === username || showAllSCID.value)) {
				$.ajax({
					method: 'GET',
					url: 'https://scapi.rockstargames.com/profile/getprofile?nickname=' + username + '&maxFriends=3',
					beforeSend: function (request) {
						request.setRequestHeader('Authorization', 'Bearer ' + getCookie('BearerToken'));
						request.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
					}
				})
					.done(function (data) {
						var scid = data.accounts[0].rockstarAccount.rockstarId;
						var uname = data.accounts[0].rockstarAccount.name;
						document.getElementById("rid_" + uname).innerHTML = "RID: " + scid;
					});
			} else {
				playercardTextField.remove();
			}
		}
	}
	if (autoProcess.value) {
		submitSCResult(searched_acc.name, searched_acc.exists);
		if (closeAfterProcess.value) {
			window.parent.close();
		}
	}
}

window.addEventListener('load', function () {

	if (location.hostname === hostnameACP) {
		if (pathPlayerSearch.test(location.pathname)) {
			initSearchButton(playerSearchSelectors, true);
		}
		if (pathAuthLogs.test(location.pathname)) {
			initSearchButton(authLogSelectors, false);
		}
		if (pathMoneyLogs.test(location.pathname)) {
			initSearchButton(moneyLogSelectors, false);
		}
	}

	if (location.hostname === hostnameRS) {
		initRSPage();
		waitForRSPlayerCards();
	}

}, false);
