// ==UserScript==
// @name		GrandRP/Rockstar Social Club improvements
// @namespace	https://myself5.de
// @version		5.0.0
// @description	Improve all kinds of ACP and SocialClub features
// @author		Myself5
// @updateURL	https://g.m5.cx/GRSI.user.js
// @downloadURL	https://g.m5.cx/GRSI.user.js
// @match		https://gta5grand.com/admin_*
// @match		https://socialclub.rockstargames.com/members*
// @grant		GM_getValue
// @grant		GM_setValue
// @grant		GM_deleteValue
// @require		https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.1/jquery.min.js
// ==/UserScript==

// Basevalues, don't touch
// Common
const closeAfterProcessLocationSearch = "?closeAfterProcess";

const optionsDefaultValues = {
	autoProcess: true,
	closeAfterProcess: false,
	backgroundProcessButton: true,
	hideButtonOnProcessedNames: true,
	colorMatch: true,
	showSCID: true,
	showAllSCID: false,
};

const gmStorageMaps = {
	configOptions: {
		id: 'configOptions',
		map: getMapFromStorage('configOptions'),
	},
	playerMapPagesSum: {
		id: 'playerMapPagesSum',
		map: getMapFromStorage('playerMapPagesSum'),
	},
};

// Old Data format
const retiredGMStorageMaps = {
	socialClubVerification: {
		id: 'socialClubVerification',
		map: getMapFromStorage('socialClubVerification'),
	}
}

const scValueTypes = {
	valid: 'valid',
	cheater: 'cheater',
	scid: 'scid',
}

const binarySearchValues = {
	initialRangeFound: 'binarySearch_initialRangeFound',
	l: 'binarySearch_Left',
	r: 'binarySearch_Right',
	page: 'page',
	active: 'binarySearch_Active',
	search: 'binarySearch_Search',
	initialSteps: 1000
}

// ACP Variables
var acpTableCount = "";
const baseURL = "https://socialclub.rockstargames.com/members/";
const hostnameACP = 'gta5grand.com';
const acpTableDummy = 'https://gta5grand.com/acptable';
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

var showSCID = {
	id: 'showSCID',
	value: gmStorageMaps.configOptions.map.has('showSCID') ? gmStorageMaps.configOptions.map.get('showSCID') : optionsDefaultValues.showSCID,
	desc: "Show SocialClub ID"
};
var autoProcess = {
	id: 'autoProcess',
	value: gmStorageMaps.configOptions.map.has('autoProcess') ? gmStorageMaps.configOptions.map.get('autoProcess') : optionsDefaultValues.autoProcess,
	spoiler: 'autoProcessOptions',
	desc: 'Automatically process SC'
};
var closeAfterProcess = {
	id: 'closeAfterProcess',
	value: gmStorageMaps.configOptions.map.has('closeAfterProcess') ? gmStorageMaps.configOptions.map.get('closeAfterProcess') : optionsDefaultValues.closeAfterProcess,
	desc: 'Automatically close after processing SC',
	activeTab: false,
};
var backgroundProcessButton = {
	id: 'backgroundProcessButton',
	value: gmStorageMaps.configOptions.map.has('backgroundProcessButton') ? gmStorageMaps.configOptions.map.get('backgroundProcessButton') : optionsDefaultValues.backgroundProcessButton,
	desc: 'Show Button to process SC in Background'
};
var hideButtonOnProcessedNames = {
	id: 'hideButtonOnProcessedNames',
	value: gmStorageMaps.configOptions.map.has('hideButtonOnProcessedNames') ? gmStorageMaps.configOptions.map.get('hideButtonOnProcessedNames') : optionsDefaultValues.hideButtonOnProcessedNames,
	spoiler: 'hideButtonOnProcessedNamesSpoiler',
	desc: 'Hide Button on previously processed SCs'
};

const scOptionsSpoiler = "<br>\
<input type='checkbox' id=" + showSCID.id + ">\
<label for=" + showSCID.id + "> " + showSCID.desc + "</label><br>\
<input type='checkbox' id=" + autoProcess.id + ">\
<label for=" + autoProcess.id + "> " + autoProcess.desc + "</label><br>\
<div id='" + autoProcess.spoiler + "' style='display:none;'>\
<input type='checkbox' id=" + closeAfterProcess.id + ">\
<label for=" + closeAfterProcess.id + "> " + closeAfterProcess.desc + "</label><br>\
<input type='checkbox' id=" + backgroundProcessButton.id + ">\
<label for=" + backgroundProcessButton.id + "> " + backgroundProcessButton.desc + "</label><br>\
<div id='" + hideButtonOnProcessedNames.spoiler + "' style='display:none;'>\
<input type='checkbox' id=" + hideButtonOnProcessedNames.id + ">\
<label for=" + hideButtonOnProcessedNames.id + "> " + hideButtonOnProcessedNames.desc + "</label><br>\
</div>\
</div>\
";

const moneyOptionsSpoiler = "Currently Empty";

const optionSpoilerTypes = [scOptionsSpoiler, moneyOptionsSpoiler];

const zeroWidthWhitespace = '​'; // U+200b, used to split the cheater tag from the SC name when mouse-select-copying
const cheaterTag = '⌊CHEATER⌋' + zeroWidthWhitespace;

const scStorageIdentifier = "SCStoragePrefix_";

const scContextMenu = {
	check: {
		id: "scContextMenuCheck",
		desc: "Check",
	},
	update: {
		id: "scContextMenuUpdate",
		desc: "Update",
	},
	markCheater: {
		id: "scContextMenuMarkCheater",
		desc: "Mark Cheater",
	},
	unMarkCheater: {
		id: "scContextMenuUnMarkCheater",
		desc: "Unmark Cheater",
	},
	copySC: {
		id: "scContextMenuCopySC",
		desc: "Copy SocialClub",
	},
	copySCID: {
		id: "scContextMenuCopySCID",
		desc: "Copy SocialClub ID",
	},
	resetSC: {
		id: "scContextMenuResetSC",
		desc: "Reset SocialClub Validation",
	}
};

var scContextCSSArray =
	[
		"#context-menu { \
	position: fixed;\
	z-index: 10000;\
	width: 150px;\
	background: #1b1a1a;\
	border-radius: 5px;\
	transform: scale(0);\
	transform-origin: top left;\
  }",
		"#context-menu.visible {\
	transform: scale(1);\
	transition: transform 200ms ease-in-out;\
  }",
		"#context-menu .item {\
	padding: 8px 10px;\
	font-size: 15px;\
	color: #eee;\
	cursor: pointer;\
	border-radius: inherit;\
}",
		"#context-menu .item:hover {\
	background: #343434;\
}"
	];

// RS Variables
const hostnameRS = 'socialclub.rockstargames.com';

var colorMatch = {
	id: 'colorMatch',
	value: gmStorageMaps.configOptions.map.has('colorMatch') ? gmStorageMaps.configOptions.map.get('colorMatch') : optionsDefaultValues.colorMatch,
};
var showAllSCID = {
	id: 'showAllSCID',
	value: gmStorageMaps.configOptions.map.has('showAllSCID') ? gmStorageMaps.configOptions.map.get('showAllSCID') : optionsDefaultValues.showAllSCID,
};

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

function getMapFromStorage(mapname) {
	var str = GM_getValue(mapname, '{"dataType":"Map","value":[]}');
	var map;
	try {
		map = JSON.parse(str, JSONMapReviver);
	} catch (e) {
		map = new Map();
	}
	return map;
}

function saveMapToStorage(map) {
	try {
		var str = JSON.stringify(map.map, JSONMapReplacer);
		GM_setValue(map.id, str);
	} catch (e) {
		// Invalid Map, reset values
		map.map = new Map();
	}
	return map;
}

function deleteMapIDFromStorage(mapid) {
	GM_deleteValue(mapid);
	return new Map();
}

function addCSSStyle(css) {
	const style = document.getElementById("cssAddedByGRSI") || (function () {
		const style = document.createElement('style');
		style.type = 'text/css';
		style.id = "cssAddedByGRSI";
		document.head.appendChild(style);
		return style;
	})();
	const sheet = style.sheet;
	sheet.insertRule(css, (sheet.rules || sheet.cssRules || []).length);
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

		// Add a copy-listener to remove the cheater-tag from SC Names on copy
		document.addEventListener('copy', (event) => {
			// There's a zero width Whitespace between the cheater-tag and the name. Use that to split and remove the tag
			// that way we can determine there's a tag in front even if not the whole tag has been copied
			var copiedText = document.getSelection().toString();
			if (copiedText !== '') {
				var splitText = copiedText.split(zeroWidthWhitespace);
				splitText = splitText[splitText.length - 1];
				event.clipboardData.setData('text/plain', splitText);
				event.preventDefault();
			}
		});

		for (let i = 0; i < scContextCSSArray.length; i++) {
			addCSSStyle(scContextCSSArray[i]);
		}
		const contextMenu = document.getElementById("context-menu") || (function () {
			const contextMenu = document.createElement('div');
			contextMenu.id = "context-menu";
			for (const [key, entry] of Object.entries(scContextMenu)) {
				const entryDiv = document.createElement('div');
				entryDiv.className = 'item';
				entryDiv.id = entry.id;
				entryDiv.textContent = entry.desc;
				contextMenu.appendChild(entryDiv);
			}
			document.body.appendChild(contextMenu);
			return contextMenu;
		})();

		document.body.addEventListener("click", (e) => {
			// ? close the menu if the user clicks outside of it
			if (e.target.offsetParent != contextMenu) {
				contextMenu.classList.remove("visible");
			}
		});

	} else if (pathSelectors.type == _selectorTypes.money) {
		initMoneyOptionsBoxes();
	}

	if (!button_listener) {
		waitForInit(pathSelectors);
	}
}

function initSCOptionsBoxes() {
	var showSCIDCB = document.getElementById(showSCID.id);
	showSCIDCB.checked = showSCID.value;

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
		initACPOptions(showSCIDCB, autoProcessCB, closeAfterProcessCB, backgroundProcessButtonCB, hideButtonOnProcessedNamesCB);
	}());
}

function initMoneyOptionsBoxes() {
	// do nothing for now
}

function initACPOptions(showSCIDCB, autoProcessCB, closeAfterProcessCB, backgroundProcessButtonCB, hideButtonOnProcessedNamesCB, sc_fields, sc_names) {
	if (showSCIDCB != null) {
		showSCIDCB.addEventListener("click", function () {
			updateCheckboxState(showSCID, showSCIDCB.checked);
			if (sc_fields != null && sc_names != null) {
				redrawSCButtons(sc_fields, sc_names);
			}
		}, false);
	}
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
	var win = window.open(url, sc_name, "width= 640, height= 480, left=0, top=0, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no").blur();
	window.focus();
}

function redrawSCButtons(sc_fields, sc_names) {
	var sc_buttons = [];
	for (var i = 0; i < sc_fields.length; i++) {
		if (sc_names[i].length != 0) {
			var fontcolor = "rgb(85, 160, 200)";
			var scObj = getSCObj(sc_names[i]);
			var knownCheater = scObj.cheater;
			var scID = scObj.scid;
			const scValid = scObj.valid;
			var scValidityChecked = scValid != undefined;
			if (scValidityChecked) {
				fontcolor = scValid ? "rgb(0, 255, 0)" : "rgb(255, 0, 0)";
			}
			sc_fields[i].innerHTML = "<a style='color: rgb(255,255,0);'>"
				+ (knownCheater ? cheaterTag : "")
				+ "</a><a style='color: " + fontcolor + ";' href='" + baseURL + sc_names[i] + "/" + ((autoProcess.value && closeAfterProcess.value) ? closeAfterProcessLocationSearch : "") + "' target='_blank'>"
				+ sc_names[i]
				+ "</a><a style='color: " + fontcolor + ";'>"
				+ ((showSCID.value && scID) ? (" (" + scID + ")") : "")
				+ "</a>"
				+ ((scValidityChecked && hideButtonOnProcessedNames.value) ? "" : ((autoProcess.value && backgroundProcessButton.value) ? "<button type='button' id='bgcheckButton_" + i + "'>Check</button>" : ""));

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
			registerContextMenu(sc_fields, sc_names, i);
		}
	}
}

// Loosely based on https://github.com/GeorgianStan/context-menu-poc/blob/master/index.html
function registerContextMenu(sc_fields, sc_names, count) {
	const scope = sc_fields[count];
	const sc_name = sc_names[count];
	const contextMenu = document.getElementById("context-menu");

	const normalizePozition = (mouseX, mouseY) => {
		// compute the mouse position relative to the document body (body)
		let {
			left: bodyOffsetX,
			top: bodyOffsetY,
		} = document.body.getBoundingClientRect();

		bodyOffsetX = bodyOffsetX < 0 ? 0 : bodyOffsetX;
		bodyOffsetY = bodyOffsetY < 0 ? 0 : bodyOffsetY;

		const bodyX = mouseX - bodyOffsetX;
		const bodyY = mouseY - bodyOffsetY;

		// ? check if the element will go out of bounds
		const outOfBoundsOnX =
			bodyX + contextMenu.clientWidth > document.body.clientWidth;

		const outOfBoundsOnY =
			bodyY + contextMenu.clientHeight > document.body.clientHeight;

		let normalizedX = mouseX;
		let normalizedY = mouseY;

		// ? normalize on X
		if (outOfBoundsOnX) {
			normalizedX =
				bodyOffsetX + document.body.clientWidth - contextMenu.clientWidth;
		}

		// ? normalize on Y
		if (outOfBoundsOnY) {
			normalizedY =
				bodyOffsetY + document.body.clientHeight - contextMenu.clientHeight;
		}

		return { normalizedX, normalizedY };
	};

	scope.addEventListener("contextmenu", (event) => {
		event.preventDefault();

		const { clientX: mouseX, clientY: mouseY } = event;

		const { normalizedX, normalizedY } = normalizePozition(mouseX, mouseY);

		contextMenu.classList.remove("visible");

		contextMenu.style.top = `${normalizedY}px`;
		contextMenu.style.left = `${normalizedX}px`;

		setTimeout(() => {
			contextMenu.classList.add("visible");

			var checkSCDiv = document.getElementById(scContextMenu.check.id);
			if (checkSCDiv != null) {
				checkSCDiv.onclick = function () {
					bgCheckSC(sc_name);
					contextMenu.classList.remove("visible");
				}
			}

			var updateTblDiv = document.getElementById(scContextMenu.update.id);
			if (updateTblDiv != null) {
				updateTblDiv.onclick = function () {
					redrawSCButtons(sc_fields, sc_names);
					contextMenu.classList.remove("visible");
				}
			}

			var markCheaterDiv = document.getElementById(scContextMenu.markCheater.id);
			if (markCheaterDiv != null) {
				markCheaterDiv.onclick = function () {
					submitSCResult(sc_name, scValueTypes.cheater, true);
					contextMenu.classList.remove("visible");
					redrawSCButtons(sc_fields, sc_names);
				}
			}

			var unMarkCheaterDiv = document.getElementById(scContextMenu.unMarkCheater.id);
			if (unMarkCheaterDiv != null) {
				unMarkCheaterDiv.onclick = function () {
					submitSCResult(sc_name, scValueTypes.cheater, false);
					contextMenu.classList.remove("visible");
					redrawSCButtons(sc_fields, sc_names);
				}
			}

			var copySCDiv = document.getElementById(scContextMenu.copySC.id);
			if (copySCDiv != null) {
				copySCDiv.onclick = function () {
					navigator.clipboard.writeText(sc_name);
					contextMenu.classList.remove("visible");
				}
			}

			var copySCIDDiv = document.getElementById(scContextMenu.copySCID.id);
			if (copySCIDDiv != null) {
				copySCIDDiv.onclick = function () {
					var scObj = getSCObj(sc_name);
					if (scObj.scid) {
						navigator.clipboard.writeText(scObj.scid);
					}
					contextMenu.classList.remove("visible");
				}
			}

			var resetSCValidationDiv = document.getElementById(scContextMenu.resetSC.id);
			if (resetSCValidationDiv != null) {
				resetSCValidationDiv.onclick = function () {
					ClearSCResult(sc_name);
					contextMenu.classList.remove("visible");
					redrawSCButtons(sc_fields, sc_names);
				}
			}
		});
	});
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

	var showSCIDCB = document.getElementById(showSCID.id);
	var autoProcessCB = document.getElementById(autoProcess.id);
	var closeAfterProcessCB = document.getElementById(closeAfterProcess.id);
	var backgroundProcessButtonCB = document.getElementById(backgroundProcessButton.id);
	var hideButtonOnProcessedNamesCB = document.getElementById(hideButtonOnProcessedNames.id);

	initACPOptions(showSCIDCB, autoProcessCB, closeAfterProcessCB, backgroundProcessButtonCB, hideButtonOnProcessedNamesCB, sc_fields, sc_names);

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
			gmStorageMaps.playerMapPagesSum.map = deleteMapIDFromStorage(gmStorageMaps.playerMapPagesSum.id);
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
			openDailyTotalTable(getTrimmedDatePlayerData(addToDailySumMap(tables).map));
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
		if (gmStorageMaps.playerMapPagesSum.map.has(playerID)) {
			playerDateMap = gmStorageMaps.playerMapPagesSum.map.get(playerID);
			if (playerDateMap.has(date)) {
				// Assume that there's only one transfer per Second per Player
				// Overwrite whatever value is there already (which should always be zero)
				todayBal = playerDateMap.get(date);
				isOutgoing ? todayBal.outgoing = qtty : todayBal.incoming = qtty;
			}
		}
		playerDateMap.set(date, todayBal);
		gmStorageMaps.playerMapPagesSum.map.set(playerID, playerDateMap);
	}
	return saveMapToStorage(gmStorageMaps.playerMapPagesSum);
}

function openDailyTotalTable(moneyData) {
	var tbl = document.createElement('table'),
		header = tbl.createTHead();
	tbl.width = "90%";
	tbl.align = "center";
	tbl.style.textAlign = "center";
	tbl.style.border = '1px solid #ddd';
	tbl.style.borderCollapse = "collapse";
	tbl.style.fontFamily = "Roboto,sans-serif";

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
	var newWindow = window.open(acpTableDummy);
	newWindow.addEventListener('load', function () {
		newWindow.document.head.innerHTML =
			'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">\
			<style> @import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap"); </style>'
		var bdy = document.createElement('body');
		bdy.appendChild(tbl);
		newWindow.document.body = bdy;
	}, false);
}

function getSCObj(name) {
	var nameObj = JSON.parse(GM_getValue(scStorageIdentifier + name, "{}"));
	if (!nameObj) {
		// Something is wrong with the stored value, create a new and empty object
		nameObj = {};
	}
	return nameObj;
}

function submitSCResult(name, type, value) {
	if (name != null && name.length > 2) {
		var nameObj = getSCObj(name);
		switch (type) {
			case scValueTypes.valid:
				nameObj.valid = value;
				break;
			case scValueTypes.cheater:
				nameObj.cheater = value;
				break;
			case scValueTypes.scid:
				nameObj.scid = value;
				break;
		}
		GM_setValue(scStorageIdentifier + name, JSON.stringify(nameObj));
	}
}

function ClearSCResult(name) {
	if (name.length != 0) {
		GM_deleteValue(scStorageIdentifier + name);
	}
}

function getSCNameFromURL() {
	return window.location.pathname.split('/')[2];
}

function updateCheckboxState(cb, value, cbAdj, valueAdj, valueAdjValue) {
	cb.value = value;
	gmStorageMaps.configOptions.map.set(cb.id, value);

	if (cbAdj != null && valueAdj != null && valueAdj) {
		if (valueAdjValue != null) {
			value = valueAdjValue;
		}
		gmStorageMaps.configOptions.map.set(cbAdj.id, value);
		cbAdj.value = value;
		document.getElementById(cbAdj.id).checked = value;
	}
	saveMapToStorage(gmStorageMaps.configOptions);
}

function initRSPage() {
	closeAfterProcess.activeTab = location.search === closeAfterProcessLocationSearch;
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
	var sc_showAllSCID = document.getElementById(showAllSCID.id);
	var sc_autoProcess = document.getElementById(autoProcess.id);

	sc_colorMatches.checked = colorMatch.value;
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
				submitSCResult(getSCNameFromURL(), scValueTypes.valid, true);
			}, false);
		}
		if (sc_unlegitbutton != null) {
			sc_unlegitbutton.addEventListener("click", function () {
				submitSCResult(getSCNameFromURL(), scValueTypes.valid, false);
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
		if (sc_showAllSCID != null) {
			sc_showAllSCID.addEventListener("click", function () {
				updateCheckboxState(showAllSCID, sc_showAllSCID.checked);
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
						// Make sure we're logged in, otherwise show alert
						if (document.getElementsByClassName('Login__wrap__1cEoQ Login__background__n44LT').length > 0) {
							// Login prompt only shows when not logged in. Show alert
							window.alert("Not signed in. Please sign in to Rockstar services to continue.");
						} else {
							if (autoProcess.value) {
								submitSCResult(name, scValueTypes.valid, false);
								if (closeAfterProcess.activeTab) {
									window.parent.close();
								}
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

			if (searched_acc.name === username || showAllSCID.value) {
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
						if (searched_acc.name === uname) {
							submitSCResult(uname, scValueTypes.scid, scid);
							if (closeAfterProcess.activeTab) {
								console.log("processRSPlayerCards");
								window.parent.close();
							}
						}
						document.getElementById("rid_" + uname).innerHTML = "RID: " + scid;
					});
			} else {
				playercardTextField.remove();
			}
		}
	}
	if (autoProcess.value) {
		submitSCResult(searched_acc.name, scValueTypes.valid, searched_acc.exists);
	}
}

function injectVersion() {
	const li = $('#header-navbar-collapse > ul > li.dropdown.dropdown-profile > ul > li')[0];
	const version = document.createElement('a');
	version.innerHTML = "GRSI Version: " + GM_info.script.version;
	version.id = "grsi_version";
	version.onclick = async function () {
		var toBeProcessed = 0;
		var scToBeUpdatedEntries = await GM.listValues();
		for (let i = 0; i < scToBeUpdatedEntries.length; i++) {
			if (scToBeUpdatedEntries[i].startsWith(scStorageIdentifier)) {
				var nameObj = JSON.parse(GM_getValue(scToBeUpdatedEntries[i], "{}"));
				if (!nameObj.scid && nameObj.valid) {
					bgCheckSC(scToBeUpdatedEntries[i].replace(scStorageIdentifier, ""));
					await new Promise(resolve => setTimeout(resolve, 2500));
					if (++toBeProcessed > 15) {
						break;
					}
				}
			}
		}
	}
	li.appendChild(version);
}

function injectScrollToTop() {
	var header = document.getElementsByClassName('navbar-page-title');
	header[0].href = "javascript:void(0)";
	header[0].onclick = (function () { $('html, body').animate({ scrollTop: 0 }, 'fast'); });
}

function openPaginationPage(urlsearch) {
	location.search = urlsearch.toString();
}

function openPaginationPageInt(page) {
	var urlsearch = new URLSearchParams(location.search);
	urlsearch.set("page", page);
	openPaginationPage(urlsearch);
}

function isSameDate(first, second) {
	var sameDay = first.getFullYear() === second.getFullYear() &&
		first.getMonth() === second.getMonth() &&
		first.getDate() === second.getDate();

	if (first.getHours() != 0 || first.getMinutes() != 0) {
		sameDay = sameDay && first.getHours() === second.getHours();
		if (first.getMinutes() != 0) {
			sameDay = sameDay && first.getMinutes() === second.getMinutes();
		}
	}
	return sameDay;
}

function processDatesFromPage(x) {
	var dateNewerThanPage = false;
	var dateOlderThanPage = false;

	var dates;
	var hdrs = $('body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > thead > tr')[0].children;
	for (let i = 0; i < hdrs.length; i++) {
		if (hdrs[i].textContent === "Date") {
			dates = getTableValues($('body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(' + (i + 1) + ')'));
			break;
		}
	}

	for (let i = 0; i < dates.length; i++) {
		var compareDate = new Date(dates[i]);
		if (isSameDate(x, compareDate)) {
			dateNewerThanPage = true;
			dateOlderThanPage = true;
			break;
		}
		if (x > compareDate) {
			dateNewerThanPage = true;
		}
		if (x < compareDate) {
			dateOlderThanPage = true;
		}
	}

	if (dateNewerThanPage && dateOlderThanPage)
		return 0;
	if (dateOlderThanPage)
		return -1;

	// if the page is empty we can assume the date is newer
	// This should therefore be the default return
	return 1;
}

function findInitialRange(urlsearch) {
	if (urlsearch == null) {
		urlsearch = new URLSearchParams(location.search);
	}
	urlsearch.set(binarySearchValues.active, "true");
	var initialRangeFound = urlsearch.get(binarySearchValues.initialRangeFound) === "true";
	var l = parseInt(urlsearch.get(binarySearchValues.l));
	var r = parseInt(urlsearch.get(binarySearchValues.r));
	if (isNaN(l) || isNaN(r)) {
		l = 0;
		r = binarySearchValues.initialSteps;
		urlsearch.set(binarySearchValues.l, l);
		urlsearch.set(binarySearchValues.r, r);
	}
	var x = new Date(urlsearch.get(binarySearchValues.search));
	if (initialRangeFound) {
		binarySearch(urlsearch);
		return;
	}
	var currentPage = parseInt(urlsearch.get(binarySearchValues.page));
	if (isNaN(currentPage) || currentPage != r) {
		urlsearch.set(binarySearchValues.page, r);
	} else {
		switch (processDatesFromPage(x)) {
			case 0:
				// Found the Page
				urlsearch.delete(binarySearchValues.active);
				break;
			case 1:
				urlsearch.set(binarySearchValues.initialRangeFound, "true");
				let mid = l + Math.floor((r - l) / 2);
				urlsearch.set(binarySearchValues.page, mid);
				break;
			case -1:
				l += binarySearchValues.initialSteps;
				r += binarySearchValues.initialSteps;
				urlsearch.set(binarySearchValues.l, l);
				urlsearch.set(binarySearchValues.r, r);
				urlsearch.set(binarySearchValues.page, r);
				break;
		}
	}
	openPaginationPage(urlsearch);
}

function binarySearch(urlsearch) {
	var l = parseInt(urlsearch.get(binarySearchValues.l));
	var r = parseInt(urlsearch.get(binarySearchValues.r));
	var x = new Date(urlsearch.get(binarySearchValues.search));
	var currentPage = parseInt(urlsearch.get(binarySearchValues.page));

	if (r >= l) {
		switch (processDatesFromPage(x)) {
			case 0:
				urlsearch.delete(binarySearchValues.active);
				openPaginationPage(urlsearch);
				return;
			case 1:
				r = currentPage - 1;
				urlsearch.set(binarySearchValues.r, r);
				break;
			case -1:
				l = currentPage + 1;
				urlsearch.set(binarySearchValues.l, l);
				break;
		}

		let mid = l + Math.floor((r - l) / 2);
		urlsearch.set(binarySearchValues.page, mid);
		openPaginationPage(urlsearch);
		return;
	} else {
		urlsearch.set(binarySearchValues.page, l);
	}

	urlsearch.delete(binarySearchValues.active);
	openPaginationPage(urlsearch);
}

function injectPageChooser() {
	var pagination = $('#DataTables_Table_0_paginate > ul');
	if (pagination.length > 0) {
		var liTextbox = document.createElement("li");
		var textbox = document.createElement("input");
		textbox.type = 'number';
		textbox.placeholder = "Page";
		textbox.style.width = "4em";
		textbox.addEventListener("keyup", (event) => {
			if (event.key === "Enter") {
				if (textbox.value.length > 0) {
					openPaginationPageInt(textbox.value);
				}
			}
		});
		liTextbox.appendChild(textbox);
		pagination[0].appendChild(liTextbox);
		var liDate = document.createElement("li");
		var datechooser = document.createElement("input");
		var today = new Date();
		datechooser.type = 'datetime-local';
		datechooser.value = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + "T00:00"
		datechooser.style.padding = "4px"
		datechooser.style.height = "30px"
		liDate.appendChild(datechooser);
		pagination[0].appendChild(liDate);
		var liA = document.createElement("li");
		var a = document.createElement("a");
		a.className = 'pagination-link';
		a.href = "javascript:void(0)";
		a.innerHTML = "Go";
		a.onclick = (function () {
			if (textbox.value.length > 0) {
				openPaginationPageInt(textbox.value);
			} else {
				if (window.confirm("Do you really want to search for this date: " + datechooser.value + "?")) {
					urlsearch = new URLSearchParams(location.search);
					urlsearch.set(binarySearchValues.search, datechooser.value);
					urlsearch.delete(binarySearchValues.l);
					urlsearch.delete(binarySearchValues.r);
					urlsearch.delete(binarySearchValues.active);
					urlsearch.delete(binarySearchValues.initialRangeFound);
					findInitialRange(urlsearch);
				}
			}
		});
		liA.appendChild(a);
		pagination[0].appendChild(liA);
	}
}

// Data conversion, remove at some point
function tryConvertSCMap() {
	retiredGMStorageMaps.socialClubVerification.map = getMapFromStorage(retiredGMStorageMaps.socialClubVerification.id);
	if (retiredGMStorageMaps.socialClubVerification.map.size > 0) {
		window.alert("GRSI: Updating Datastructure. Please wait...\n(This message can be closed. A new message will show once done)");
		retiredGMStorageMaps.socialClubVerification.map.forEach((value, name) => {
			GM_setValue(scStorageIdentifier + name, JSON.stringify(value));
			retiredGMStorageMaps.socialClubVerification.map.delete(name);
		});
		saveMapToStorage(retiredGMStorageMaps.socialClubVerification);
		window.alert("Conversion to new Datastructure done.");
	}
}

window.addEventListener('load', function () {

	if (location.hostname === hostnameACP) {
		var searchparams = new URLSearchParams(location.search);
		if (searchparams.get(binarySearchValues.active) == 'true') {
			findInitialRange();
			return;
		}
		if (pathPlayerSearch.test(location.pathname)) {
			initSearchButton(playerSearchSelectors, true);
		}
		if (pathAuthLogs.test(location.pathname)) {
			initSearchButton(authLogSelectors, false);
		}
		if (pathMoneyLogs.test(location.pathname)) {
			initSearchButton(moneyLogSelectors, false);
		}

		// Inject Version to account menu
		injectVersion();

		injectScrollToTop();

		// Add a textbox + Go button to paginated tools
		injectPageChooser();

		// Convert Data
		tryConvertSCMap();
	}

	if (location.hostname === hostnameRS) {
		initRSPage();
		waitForRSPlayerCards();
	}
}, false);
