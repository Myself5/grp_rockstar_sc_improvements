// ==UserScript==
// @name		GrandRP/Rockstar Social Club improvements
// @namespace	https://myself5.de
// @version		8.0.0
// @description	Improve all kinds of ACP and SocialClub features
// @author		Myself5
// @updateURL	https://g.m5.cx/GRSI.user.js
// @downloadURL	https://g.m5.cx/GRSI.user.js
// @match		https://gta5grand.com/admin_*
// @match		https://gta5grand.com/acptable
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
	funmodeActive: false,
};

const gmStorageMaps = {
	colorOptions: {
		id: 'colorOptions',
		map: getMapFromStorage('colorOptions'),
	},
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
	pccheck: 'pccheck',
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
var originalTitle = "";
const SCbaseURL = "https://socialclub.rockstargames.com";
const SCbaseURLMembers = SCbaseURL + "/members/";
const hostnameACP = 'gta5grand.com';
const websiteACP = 'https://' + hostnameACP;
const acpTable = 'acptable';
const acpTableDummy = websiteACP + '/' + acpTable;
const playerURLBase = websiteACP + "/" + location.pathname.split('/')[1] + '/account/info/'; // + ID
const authorizationLogsBase = websiteACP + "/" + location.pathname.split('/')[1] + '/logs/authorization?'; // + Search
const pathAuthLogs = new RegExp('/admin_.*\/logs\/authorization');
const pathMoneyLogs = new RegExp('/admin_.*\/logs\/money');
const pathInventoryLogs = new RegExp('/admin_.*\/logs\/inventory');
const pathFractionLogs = new RegExp('/admin_.*\/logs\/fraction');
const pathPlayerSearch = new RegExp('/admin_.*\/account\/search');
const punishmentSearch = new RegExp('/admin_.*\/punishmen\/');
const moneyMaxValue = 5000000;

const _selectorTypes = {
	socialclub: 0,
	money: 1,
	fraction: 2,
};

const authLogValues = {
	count: 'body > div.app-layout-canvas > div > main > div > div.row > div',
	header: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > thead > tr > th:nth-child(4)',
	table: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(4)',
	type: _selectorTypes.socialclub,
	tblSelectors: {
		nick: 0,
		id: 1,
		ip: 2,
		sc: 3,
		date: 4,
		page: 5,
	},
	isAuthLog: true,
	initialSearchPage: 1,
	tblGMPrefix: 'ACPAuthLogFilterPrefix_',
	paginationLastPage: '#DataTables_Table_0_paginate ul li a.pagination-link',
	active: 'authLogSearchActive',
	levelSelector: '#header-navbar-collapse > ul > li.dropdown.dropdown-profile > a > span',
	minimalIPLevel: 5,
	initAuthHref: true,
	mainTable: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div.card-block > table',
	searchParams: {
		default: 'skip',
		nick: 'nick',
		id: 'accid',
		ip: 'ip',
		sc: 'socialclub',
		page: 'page',
	},
	ipLookup: 'https://www.ipqualityscore.com/free-ip-lookup-proxy-vpn-test/lookup/',
	iptable: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(3)',
};

const moneyLogSelectors = {
	active: 'moneySearchActive',
	count: 'body > div.app-layout-canvas > div > main > div > div.row > div',
	header: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > thead > tr > th:nth-child(4)',
	nametable: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(1) > a',
	datetable: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(2)',
	qttytable: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(4)',
	type: _selectorTypes.money,
	searchDefault: 'skip',
	headerBlock: 'logsmoney_post',
	buttonBlock: '#logsmoney_post > div.form-group.m-b-0',
	inputPage: 'moneySearchEndPage',
	oppositeBase: websiteACP + "/" + location.pathname.split('/')[1] + '/logs/inventory?', // + Search
	searchParams: {
		nick: 'nick',
		itemID: 'id_item',
		id: 'accid',
		action: 'action',
		ip: 'ip',
		desc: 'description',
		page: 'page',
		endpage: 'endpage',
		default: 'skip',
	},
	inputFieldIDs: {
		nick: 'nick',
		id: 'number-account',
		ip: 'ip',
		desc: 'description',
	},
	isMoneyLog: true,
};

const inventoryLogSelectors = {
	datetable: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(8)',
	searchDefault: 'skip',
	oppositeBase: websiteACP + "/" + location.pathname.split('/')[1] + '/logs/money?', // + Search
	searchParams: {
		nick: 'nick',
		id: 'accid',
		ip: 'ip',
		description: 'description',
	},
	inputFieldIDs: {
		nick: 'nick',
		id: 'accid',
		ip: 'ip',
	},
}

const playerSearchSelectors = {
	count: '#result_count',
	header: '#result-players-list div:nth-child(2) table tr th:nth-child(6)',
	table: '#result-players-list div:nth-child(2) table tr td:nth-child(6)',
	type: _selectorTypes.socialclub,
};

const fractionSearchValues = {
	headerBlock: 'logsmoney_post',
	inputID: 'fractionSearchID',
	page: 'page',
	inputPage: 'fractionSearchEndPage',
	inputQTTY: 'fractionSearchQTTY',
	active: 'fractionSearchActive',
	mainTable: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div.card-block > table',
	reverse: 'fractionSearchReverse',
	tblSelectors: {
		nick: 0,
		id: 1,
		action: 2,
		qtty: 3,
		additionalInfo: 4,
		rank: 5,
		date: 6,
	},
	tblDefault: '[[],[],[],[],[],[],[]]',
	tblGMPrefix: 'ACPFractionFilterPrefix_',
};

const punishmentLogs = {
	column: 'body > div.app-layout-canvas > div > main > div > div.card > div > table > tbody > tr > td:nth-child(2)',
};

var showSCID = {
	id: 'showSCID',
	value: gmStorageMaps.configOptions.map.has('showSCID') ? gmStorageMaps.configOptions.map.get('showSCID') : optionsDefaultValues.showSCID,
	desc: "Show SocialClub ID",
};
var autoProcess = {
	id: 'autoProcess',
	value: gmStorageMaps.configOptions.map.has('autoProcess') ? gmStorageMaps.configOptions.map.get('autoProcess') : optionsDefaultValues.autoProcess,
	spoiler: 'autoProcessOptions',
	desc: 'Automatically process SC',
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
	desc: 'Show Button to process SC in Background',
};
var hideButtonOnProcessedNames = {
	id: 'hideButtonOnProcessedNames',
	value: gmStorageMaps.configOptions.map.has('hideButtonOnProcessedNames') ? gmStorageMaps.configOptions.map.get('hideButtonOnProcessedNames') : optionsDefaultValues.hideButtonOnProcessedNames,
	spoiler: 'hideButtonOnProcessedNamesSpoiler',
	desc: 'Hide Button on previously processed SCs',
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
const pccheckTag = '⌊PC CHECK⌋' + zeroWidthWhitespace;

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
	},
};

var scContextCSSArray = [
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

const overlayCSSArray = [
	"#processingOverlay { \
	position: fixed;\
	display: none;\
	width: 100%;\
	height: 100%;\
	top: 0;\
	left: 0;\
	right: 0;\
	bottom: 0;\
	background-color: rgba(0,0,0,0.5);\
	z-index: 2;\
	cursor: pointer;\
    }",
	"#processingOverlayContent{\
	position: absolute;\
	top: 50%;\
	left: 50%;\
	font-size: 50px;\
	color: white;\
	text-align: center; \
	transform: translate(-50%,-50%);\
	-ms-transform: translate(-50%,-50%);\
    }",
	"#processingOverlayButton{\
    font-size: 35px;\
	border-radius: 15px;\
    }",
]

const customMarginArray = [
	".small-margin-left { \
	margin-left: 5px;\
    }",
	".small-margin-right { \
	margin-right: 5px;\
	}",
]

const default_colors = {
	blue: "rgb(85, 160, 200)",
	green: "rgb(0, 255, 0)",
	red: "rgb(255, 0, 0)",
	yellow: "rgb(255,255,0)",
}

const colorstorage = {
	green:
	{
		value: gmStorageMaps.colorOptions.map.has('green') ? gmStorageMaps.colorOptions.map.get('green') : default_colors.green,
		desc: "the green color, used for valid Social Clubs"
	},
	red:
	{
		value: gmStorageMaps.colorOptions.map.has('red') ? gmStorageMaps.colorOptions.map.get('red') : default_colors.red,
		desc: "the red color, used for invalid Social Clubs"
	},
	yellow:
	{
		value: gmStorageMaps.colorOptions.map.has('yellow') ? gmStorageMaps.colorOptions.map.get('yellow') : default_colors.yellow,
		desc: "the yellow color, used in Cheater and PC Check Target Tags"
	},
}

const colors = {
	blue: default_colors.blue,
	green: colorstorage.green.value,
	red: colorstorage.red.value,
	yellow: colorstorage.yellow.value,
}

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
				if (pathSelectors.iptable) {
					var iptable = $(pathSelectors.iptable);
					for (var i = 0; i < iptable.length; i++) {
						var ip = iptable[i].textContent;
						if (ip != "hidden") {
							var a = document.createElement('a');
							a.innerHTML = ip;
							a.style.color = colors.blue;

							a.href = authLogValues.ipLookup + ip;

							iptable[i].innerHTML = "";
							iptable[i].appendChild(a);
						}
					}
				}
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

function tableTo2DArray(table, page, skipHeader = false) {
	let data = [];
	for (let i = skipHeader ? 1 : 0; i < table.rows.length; i++) {
		let row = table.rows[i];
		let rowData = [];
		for (let cell of row.cells) {
			rowData.push(cell.textContent);
		}
		rowData.push(page.toString());
		data.push(rowData);
	}
	return data;
}

async function getLastAuthPage(urlsearch) {
	let parser = new DOMParser();
	urlsearch.set(authLogValues.searchParams.page, 1000000);
	let url = location.origin + location.pathname + '?' + urlsearch.toString();
	let response = await fetch(url);
	let text = await response.text();
	let doc = parser.parseFromString(text, "text/html");
	let pagination = doc.querySelectorAll(authLogValues.paginationLastPage);

	return pagination.length > 0 ? pagination[pagination.length - 1].text : '1';
}

async function getFullTable(urlsearch, endpage, progressText) {
	let fullTableData = [];
	let parser = new DOMParser();
	let page = 0;
	if (progressText) {
		progressText.innerHTML = 'Page: ' + page + '/' + endpage;
	}
	document.title = '[' + page + '/' + endpage + '] ' + originalTitle;

	var promises = [];
	for (let i = 1; i <= endpage; i++) {
		promises.push(new Promise(async (resolve, reject) => {
			urlsearch.set(authLogValues.searchParams.page, i);
			let url = location.origin + location.pathname + '?' + urlsearch.toString();
			let response = await fetch(url);
			let text = await response.text();
			let doc = parser.parseFromString(text, "text/html");
			let table = doc.querySelector('.card-block table');
			page++;
			if (progressText) {
				progressText.innerHTML = 'Page: ' + page + '/' + endpage;
			}
			document.title = '[' + page + '/' + endpage + '] ' + originalTitle;
			resolve(tableTo2DArray(table, i, i > 1));
		}));
	}

	await Promise.all(promises).then((results) => {
		results.forEach((element) => fullTableData.push(...element));
	});

	return fullTableData;
}

async function getSCforIDTable(ids, progressText) {
	let fullTableData = [];
	let parser = new DOMParser();
	let progress = 0;

	if (progressText) {
		progressText.innerHTML = 'Progress: ' + progress + '/' + ids.length;
	}
	document.title = '[' + progress + '/' + ids.length + '] ' + originalTitle;

	var urlsearch = new URLSearchParams();
	urlsearch.set(authLogValues.searchParams.nick, authLogValues.searchParams.default);
	urlsearch.set(authLogValues.searchParams.page, '1');
	urlsearch.set(authLogValues.searchParams.ip, authLogValues.searchParams.default);
	urlsearch.set(authLogValues.searchParams.sc, authLogValues.searchParams.default);

	var promises = [];
	for (let i = 0; i < ids.length; i++) {
		promises.push(new Promise(async (resolve, reject) => {
			urlsearch.set(authLogValues.searchParams.id, ids[i]);
			let url = authorizationLogsBase + urlsearch.toString();
			let response = await fetch(url);
			let text = await response.text();
			let doc = parser.parseFromString(text, "text/html");
			let table = doc.querySelector('.card-block table');
			progress++;
			if (progressText) {
				progressText.innerHTML = 'Progress: ' + progress + '/' + ids.length;
			}
			document.title = '[' + progress + '/' + ids.length + '] ' + originalTitle;

			resolve(tableTo2DArray(table, 1, false));
		}));
	}

	await Promise.all(promises).then((results) => {
		results.forEach((element) => {
			fullTableData.push(element.length > 1 ? element[1][authLogValues.tblSelectors.sc] : '');
		})
	});

	return fullTableData;
}

function initAuthLogSearchAll() {
	var searchAllButton = document.createElement('button');
	searchAllButton.title = "Click to search and summarize all pages";
	searchAllButton.type = "button";
	searchAllButton.className = "btn btn-default small-margin-left";
	searchAllButton.onclick = async function () {
		var nickset = false;
		var idset = false;
		var ipset = false;
		var scset = false;
		var nickname = document.getElementById(authLogValues.searchParams.nick).value;
		if (nickname.length == 0) {
			nickname = authLogValues.searchParams.default;
		} else {
			nickset = true;
		}
		var playerID = document.getElementById(authLogValues.searchParams.id).value;
		if (playerID.length == 0) {
			playerID = authLogValues.searchParams.default;
		} else {
			idset = true;
		}
		var ip = document.getElementById(authLogValues.searchParams.ip).value;
		if (ip.length == 0) {
			ip = authLogValues.searchParams.default;
		} else {
			ipset = true;
		}
		var socialclub = document.getElementById(authLogValues.searchParams.sc).value;
		if (socialclub.length == 0) {
			socialclub = authLogValues.searchParams.default;
		} else {
			scset = true;
		}

		var compareIP = false;
		if (!ipset) {
			var levelInt = parseInt($(authLogValues.levelSelector)[0].textContent.split('(')[1].replace(/\D/g, ""));
			if (levelInt > authLogValues.minimalIPLevel) {
				compareIP = window.confirm("Do you want to check for IP Changes?");
			}
		}

		if (nickset || idset || ipset || scset) {
			if (window.confirm(
				"Do you want to summarize all pages with the following parameters?\n"
				+ (nickset ? ("Nickname: " + nickname + "\n") : "")
				+ (idset ? ("ID: " + playerID + "\n") : "")
				+ (ipset ? ("IP: " + ip + "\n") : "")
				+ (scset ? ("SocialClub: " + socialclub + "\n") : "")
			)) {
				document.getElementById('loading').style.display = '';
				progressText = document.getElementById('currentpage');
				progressText.innerHTML = 'Page: 0/?';
				document.title = '[0/?] ' + originalTitle;

				var urlsearch = new URLSearchParams();
				urlsearch.set(authLogValues.searchParams.nick, nickname);
				urlsearch.set(authLogValues.searchParams.id, playerID);
				urlsearch.set(authLogValues.searchParams.ip, ip);
				urlsearch.set(authLogValues.searchParams.sc, socialclub);
				urlsearch.set(authLogValues.searchParams.page, authLogValues.initialSearchPage);

				await fetchAndProcessAuthData(urlsearch, compareIP, false);

				document.getElementById('loading').style.display = 'none';
				document.title = '[Done] ' + originalTitle;
				progressText.innerHTML = '';

			}
		} else {
			window.alert("No Search parameters defined. Search All no possible.");
		}
	}
	searchAllButton.innerHTML = "Search All";

	return searchAllButton;
}

async function fetchAndProcessAuthData(urlsearch, compareIP, closeAfterProcess) {
	var endpage = await getLastAuthPage(urlsearch);
	progressText = document.getElementById('currentpage');
	var fullTable = await getFullTable(urlsearch, endpage, progressText);

	var objectTable = [];

	for (let i = (fullTable.length - 1); i > 0; i--) {
		var entry = {};
		entry.nick = fullTable[i][authLogValues.tblSelectors.nick];
		entry.id = fullTable[i][authLogValues.tblSelectors.id];
		entry.ip = fullTable[i][authLogValues.tblSelectors.ip];
		entry.sc = fullTable[i][authLogValues.tblSelectors.sc];
		entry.date = fullTable[i][authLogValues.tblSelectors.date];
		entry.firstpage = fullTable[i][authLogValues.tblSelectors.page];
		entry.loginAmount = 1;

		const tblContent = GetFromobjTable(objectTable, entry, compareIP);
		if (tblContent) {
			tblContent.loginAmount += 1;
		} else {
			objectTable.push(entry);
		}
	}

	// Convert objectTable to filterTable
	var filterTable = [[], [], [], [], []];
	filterTable[authLogValues.tblSelectors.nick].push(fullTable[0][authLogValues.tblSelectors.nick]);
	filterTable[authLogValues.tblSelectors.id].push(fullTable[0][authLogValues.tblSelectors.id]);
	filterTable[authLogValues.tblSelectors.ip].push(fullTable[0][authLogValues.tblSelectors.ip]);
	filterTable[authLogValues.tblSelectors.sc].push(fullTable[0][authLogValues.tblSelectors.sc]);
	filterTable[authLogValues.tblSelectors.date].push(fullTable[0][authLogValues.tblSelectors.date]);

	for (var i = 0; i < objectTable.length; i++) {
		filterTable[authLogValues.tblSelectors.nick].push(objectTable[i].nick);
		filterTable[authLogValues.tblSelectors.id].push(objectTable[i].id);
		filterTable[authLogValues.tblSelectors.ip].push(objectTable[i].ip);
		filterTable[authLogValues.tblSelectors.sc].push(objectTable[i].sc);
		filterTable[authLogValues.tblSelectors.date].push(
			objectTable[i].date
			+ " (First Login Page: " + objectTable[i].firstpage + " Total Logins: " + objectTable[i].loginAmount + ")");
	}

	var title = '';
	if (urlsearch.get(authLogValues.searchParams.nick) != authLogValues.searchParams.default) {
		title = title + "Nick: " + urlsearch.get(authLogValues.searchParams.nick) + " ";
	}
	if (urlsearch.get(authLogValues.searchParams.id) != authLogValues.searchParams.default) {
		title = title + "ID: " + urlsearch.get(authLogValues.searchParams.id) + " ";
	}
	if (urlsearch.get(authLogValues.searchParams.ip) != authLogValues.searchParams.default) {
		title = title + "IP: " + urlsearch.get(authLogValues.searchParams.ip) + " ";
	}
	if (urlsearch.get(authLogValues.searchParams.sc) != authLogValues.searchParams.default) {
		title = title + "SC: " + urlsearch.get(authLogValues.searchParams.sc) + " ";
	}
	title = title + "- ACP Auth Summary";
	openFilterTable(filterTable, urlsearch, authLogValues, true, title, closeAfterProcess);
}

async function autoFetchAndProcessAuthData(urlsearch) {
	urlsearch.delete(authLogValues.active);
	document.getElementById('loading').style.display = '';
	document.title = '[0/?] ' + originalTitle;
	await fetchAndProcessAuthData(urlsearch, false, true);
	document.getElementById('loading').style.display = 'none';
	document.title = '[Done] ' + originalTitle;
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
	optionsbutton.className = "btn btn-default small-margin-left";
	optionsbutton.onclick = function () {
		if (document.getElementById('optionsspoiler').style.display == 'none') {
			document.getElementById('optionsspoiler').style.display = '';
		} else {
			document.getElementById('optionsspoiler').style.display = 'none';
		}
	}
	optionsbutton.innerHTML = "Options";

	if (pathSelectors.isAuthLog) {
		var searchAllButton = initAuthLogSearchAll();
		search_button.after(searchAllButton);

		var loading = document.createElement('img');
		loading.src = 'https://i.gifer.com/ZKZg.gif';
		loading.height = 38;
		loading.id = 'loading';
		loading.style.display = 'none';

		loading.style.padding = '0px 5px';

		var progress = document.createElement('a');
		progress.id = 'currentpage';
		progress.style.color = 'initial';

		searchAllButton.after(optionsbutton);
		optionsbutton.after(loading);
		loading.after(progress);
	} else if (pathSelectors.isMoneyLog) {
		var formBlock = document.getElementById(moneyLogSelectors.headerBlock);
		var buttonBlock = document.querySelector(moneyLogSelectors.buttonBlock);
		var pageFormGroup = document.createElement('div');
		pageFormGroup.className = 'form-group';
		var pageLabel = document.createElement('label');
		pageLabel.className = 'sr-only';
		pageFormGroup.appendChild(pageLabel);
		var pageInput = document.createElement('input');
		pageInput.className = 'form-control small-margin-right';
		pageInput.type = 'number';
		pageInput.name = moneyLogSelectors.inputPage;
		pageInput.id = moneyLogSelectors.inputPage;
		pageInput.placeholder = 'End Page';
		pageInput.addEventListener("keyup", (event) => {
			if (event.key === "Enter") {
				handleMoneySearchAll();
			}
		});
		pageFormGroup.appendChild(pageInput);
		formBlock.appendChild(pageFormGroup);
		pageFormGroup.after(buttonBlock);

		var searchAllButton = document.createElement('button');
		searchAllButton.title = "Click to search and summarize all pages";
		searchAllButton.type = "button";
		searchAllButton.className = "btn btn-default small-margin-left";
		searchAllButton.onclick = function () {
			handleMoneySearchAll();
		};
		searchAllButton.innerHTML = "Search All";
		searchAllButton.id = "search_all_button";
		buttonBlock.appendChild(searchAllButton);

		search_button.after(searchAllButton);
		searchAllButton.after(optionsbutton);
	} else {
		search_button.after(optionsbutton);
	}

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

function initFractionPage() {
	var formBlock = document.getElementById(fractionSearchValues.headerBlock);

	var selectFormGroup = document.createElement('div');
	selectFormGroup.className = 'form-group';
	var selectLabel = document.createElement('label');
	selectLabel.className = 'sr-only';
	selectLabel.htmlFor = 'params_bankmoney';
	selectFormGroup.appendChild(selectLabel);
	selectFormGroup.appendChild(document.getElementById('fraction-list'));
	formBlock.appendChild(selectFormGroup);

	var idFormGroup = document.createElement('div');
	idFormGroup.className = 'form-group';
	var idLabel = document.createElement('label');
	idLabel.className = 'sr-only';
	idLabel.htmlFor = fractionSearchValues.inputID;
	idFormGroup.appendChild(idLabel);
	var idInput = document.createElement('input');
	idInput.className = 'form-control small-margin-left';
	idInput.type = 'number';
	idInput.name = fractionSearchValues.inputID;
	idInput.id = fractionSearchValues.inputID;
	idInput.placeholder = 'Player ID';
	idInput.addEventListener("keyup", (event) => {
		if (event.key === "Enter") {
			handleFractionSearchEntry();
		}
	});
	idFormGroup.appendChild(idInput);
	formBlock.appendChild(idFormGroup);

	var pageFormGroup = document.createElement('div');
	pageFormGroup.className = 'form-group';
	var pageLabel = document.createElement('label');
	pageLabel.className = 'sr-only';
	pageLabel.htmlFor = fractionSearchValues.inputID;
	pageFormGroup.appendChild(pageLabel);
	var pageInput = document.createElement('input');
	pageInput.className = 'form-control small-margin-left';
	pageInput.type = 'number';
	pageInput.name = fractionSearchValues.inputPage;
	pageInput.id = fractionSearchValues.inputPage;
	pageInput.placeholder = 'End Page';
	pageInput.addEventListener("keyup", (event) => {
		if (event.key === "Enter") {
			handleFractionSearchEntry();
		}
	});
	pageFormGroup.appendChild(pageInput);
	formBlock.appendChild(pageFormGroup);

	var qttyFormGroup = document.createElement('div');
	qttyFormGroup.className = 'form-group';
	var qttyLabel = document.createElement('label');
	qttyLabel.className = 'sr-only';
	qttyLabel.htmlFor = fractionSearchValues.inputQTTY;
	qttyFormGroup.appendChild(qttyLabel);
	var QTTYInput = document.createElement('input');
	QTTYInput.className = 'form-control small-margin-left';
	QTTYInput.type = 'number';
	QTTYInput.name = fractionSearchValues.inputQTTY;
	QTTYInput.id = fractionSearchValues.inputQTTY;
	QTTYInput.placeholder = 'Quantity (Optional)';
	QTTYInput.addEventListener("keyup", (event) => {
		if (event.key === "Enter") {
			handleFractionSearchEntry();
		}
	});
	qttyFormGroup.appendChild(QTTYInput);
	formBlock.appendChild(qttyFormGroup);

	var filterFormGroup = document.createElement('div');
	filterFormGroup.className = 'form-group m-b-0';
	var filterButton = document.createElement('button');
	filterButton.title = "Click to filter content by PlayerID and/or Quantity"
	filterButton.innerHTML = "Filter";
	filterButton.type = "button";
	filterButton.className = "btn btn-default small-margin-left";
	filterButton.onclick = function () {
		handleFractionSearchEntry();
	}
	filterFormGroup.appendChild(filterButton);
	formBlock.appendChild(filterFormGroup);
}

function addToTable(arr, tbl, selectors, index) {
	for (const [key, selectorValue] of Object.entries(selectors)) {
		arr[selectorValue].push(tbl.rows.item(index).cells.item(selectorValue).textContent);
	}
}

function checkAndAddtoFractionsTable(table, filterTable, playerID, qtty, index) {
	var tblID = parseInt(table.rows.item(index).cells.item(fractionSearchValues.tblSelectors.id).textContent);
	var tblQTTY = parseInt(table.rows.item(index).cells.item(fractionSearchValues.tblSelectors.qtty).textContent);
	if (tblID == playerID || tblQTTY == qtty) {
		addToTable(filterTable, table, fractionSearchValues.tblSelectors, index);
	}
}

function handleFractionSearchEntry(urlsearch) {
	var playerID, endPage, qtty;
	if (urlsearch == null) {
		urlsearch = new URLSearchParams(location.search);
		playerID = parseInt(document.getElementById(fractionSearchValues.inputID).value);
		endPage = parseInt(document.getElementById(fractionSearchValues.inputPage).value);
		qtty = parseInt(document.getElementById(fractionSearchValues.inputQTTY).value);
		urlsearch.set(fractionSearchValues.inputID, playerID);
		urlsearch.set(fractionSearchValues.inputPage, endPage);
		urlsearch.set(fractionSearchValues.inputQTTY, qtty);
		GM_deleteValue(fractionSearchValues.tblGMPrefix + playerID + "_" + qtty);
	} else {
		playerID = parseInt(urlsearch.get(fractionSearchValues.inputID));
		endPage = parseInt(urlsearch.get(fractionSearchValues.inputPage));
		qtty = parseInt(urlsearch.get(fractionSearchValues.inputQTTY));
	}

	if ((isNaN(playerID) && isNaN(qtty)) || isNaN(endPage)) {
		window.alert("Please specify PlayerID as well as the last page to check (starting from current)");
	} else {
		urlsearch.set(fractionSearchValues.active, "true");
		var page = parseInt(urlsearch.get(fractionSearchValues.page));
		if (isNaN(page)) {
			page = 1;
		}
		if (page < endPage) {
			urlsearch.set(fractionSearchValues.page, page + 1);
			urlsearch.delete(fractionSearchValues.reverse);
		} else if (page > endPage) {
			urlsearch.set(fractionSearchValues.page, page - 1);
			urlsearch.set(fractionSearchValues.reverse, "true");
		}
		var filterTable = JSON.parse(GM_getValue(fractionSearchValues.tblGMPrefix + playerID + "_" + qtty, fractionSearchValues.tblDefault));
		var table = $(fractionSearchValues.mainTable)[0];
		if (filterTable[0].length == 0 && table.rows.length > 0) {
			// Add Headlines once
			addToTable(filterTable, table, fractionSearchValues.tblSelectors, 0);
		}
		if (urlsearch.get(fractionSearchValues.reverse) === "true") {
			for (let i = (table.rows.length - 1); i > 0; i--) {
				checkAndAddtoFractionsTable(table, filterTable, playerID, qtty, i);
			}
		} else {
			for (let i = 1; i < table.rows.length; i++) {
				checkAndAddtoFractionsTable(table, filterTable, playerID, qtty, i);
			}
		}

		if (page == endPage) {
			urlsearch.delete(fractionSearchValues.active);
			openFilterTable(filterTable, urlsearch, fractionSearchValues);
			GM_deleteValue(fractionSearchValues.tblGMPrefix + playerID + "_" + qtty);
			return;
		}
		GM_setValue(fractionSearchValues.tblGMPrefix + playerID + "_" + qtty, JSON.stringify(filterTable));
		openPaginationPage(urlsearch);
	}
}

function GetFromobjTable(objTable, entry, compareIP) {
	for (var i = 0; i < objTable.length; i++) {
		if (objTable[i].id === entry.id
			&& (!compareIP || (compareIP && objTable[i].ip === entry.ip))
			&& objTable[i].sc === entry.sc) {
			return objTable[i];
		}
	}
	return false;
}

function getAuthCellContent(filterTable, selector, j, i) {
	var content = filterTable[j][i];
	var a = document.createElement('a');
	a.innerHTML = content;
	a.style.color = colors.blue;

	// Start Processing by going to oldest Page
	var urlsearch = new URLSearchParams(location.search);
	urlsearch.set(authLogValues.searchParams.nick, authLogValues.searchParams.default);
	urlsearch.set(authLogValues.searchParams.ip, authLogValues.searchParams.default);
	urlsearch.set(authLogValues.searchParams.page, authLogValues.initialSearchPage);
	urlsearch.set(authLogValues.active, "true");

	if (selector == authLogValues.tblSelectors.id) {
		urlsearch.set(authLogValues.searchParams.id, content);
		urlsearch.set(authLogValues.searchParams.sc, authLogValues.searchParams.default);
	} else if (selector == authLogValues.tblSelectors.sc) {
		urlsearch.set(authLogValues.searchParams.id, authLogValues.searchParams.default);
		urlsearch.set(authLogValues.searchParams.sc, content);
	}

	a.href = authorizationLogsBase + urlsearch.toString();

	return a;
}

function openFilterTable(filterTable, urlsearch, values, textsummary, title, closeAfterProcess = false) {
	var tbl = document.createElement('table'),
		header = tbl.createTHead();
	tbl.width = "90%";
	tbl.align = "center";
	tbl.style.textAlign = "center";
	tbl.style.border = '1px solid #ddd';
	tbl.style.borderCollapse = "collapse";
	tbl.style.fontFamily = "Roboto,sans-serif";
	tbl.id = acpTable;

	var headerRow = header.insertRow();

	for (let i = 0; i < filterTable.length; i++) {
		cell = headerRow.insertCell();
		cell.innerHTML = "<b>" + filterTable[i][0] + "</b>";
		cell.style.border = '1px solid #ddd';
		cell.style.padding = "10px";
	}

	var idMap = new Map();
	var scMap = new Map();
	const rowDatePageRegex = /Page: \d*/g;

	for (let i = 1; i < filterTable[0].length; i++) {
		const tr = tbl.insertRow();
		const rowID = filterTable[values.tblSelectors.id][i];

		if (textsummary) {
			const rowSC = filterTable[values.tblSelectors.sc][i];
			const rowDate = filterTable[values.tblSelectors.date][i];
			const rowDatePage = rowDate.match(rowDatePageRegex);
			if (idMap.has(rowID)) {
				idMap.get(rowID).push(rowSC + " [" + rowDatePage + "]");
			} else {
				idMap.set(rowID, [rowSC + " [" + rowDatePage + "]"]);
			}

			if (scMap.has(rowSC)) {
				scMap.get(rowSC).push(rowID + " [" + rowDatePage + "]");
			} else {
				scMap.set(rowSC, [rowID + " [" + rowDatePage + "]"]);
			}
		}

		for (let j = 0; j < filterTable.length; j++) {
			var cell = tr.insertCell();
			if (j == values.tblSelectors.nick) {
				var a = document.createElement('a');
				a.href = playerURLBase + rowID;
				a.innerHTML = filterTable[j][i];
				a.style.color = colors.blue;
				cell.appendChild(a);
			} else {
				if (values.initAuthHref && j == values.tblSelectors.id) {
					cell.appendChild(getAuthCellContent(filterTable, values.tblSelectors.id, j, i));
				} else if (values.initAuthHref && j == values.tblSelectors.sc) {
					cell.appendChild(getAuthCellContent(filterTable, values.tblSelectors.sc, j, i));
				} else if (values.initAuthHref && j == values.tblSelectors.ip) {
					var ip = filterTable[j][i];
					if (ip == "hidden") {
						cell.innerHTML = filterTable[j][i];
					} else {
						var a = document.createElement('a');
						a.innerHTML = ip;
						a.style.color = colors.blue;

						a.href = authLogValues.ipLookup + ip;

						cell.appendChild(a);
					}
				} else {
					cell.innerHTML = filterTable[j][i];
				}
			}
			cell.style.border = '1px solid #ddd';
			cell.style.padding = "10px";
		}
	}

	if (textsummary) {
		var summaryText = document.createElement('p');
		summaryText.style.textAlign = 'center';
		summaryText.style.fontFamily = "Roboto,sans-serif";
		var text = "<b>IDs:</b><br><br>";
		idMap.forEach((scs, id) => {
			text = text + "ID: " + id + " - " + scs[0];
			if (scs.length > 1) {
				text = text + " (additional:";
				for (let i = 1; i < scs.length; i++) {
					text = text + " " + scs[i];
				}
				text = text + ")";
			}
			text = text + "<br>";
		});
		text = text + "<br><b>SocialClubs:</b><br><br>";
		scMap.forEach((ids, sc) => {
			text = text + "SC: " + sc + " - " + ids[0];
			if (ids.length > 1) {
				text = text + " (additional:";
				for (let i = 1; i < ids.length; i++) {
					text = text + " " + ids[i];
				}
				text = text + ")";
			}
			text = text + "<br>";
		});
		summaryText.innerHTML = text;
	}

	var newWindow = window.open(acpTableDummy);
	newWindow.addEventListener('load', function () {
		newWindow.document.head.innerHTML =
			'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Roboto&display=swap" rel="stylesheet">\
			<style> @import url("https://fonts.googleapis.com/css2?family=Roboto&display=swap"); </style>'
		var bdy = document.createElement('body');
		bdy.appendChild(tbl);
		if (textsummary) {
			bdy.appendChild(summaryText);
		}
		newWindow.document.body = bdy;
		newWindow.document.title = title;
		if (closeAfterProcess) {
			newWindow.opener.close();
		}
	}, false);
}

function InitACPTableSortable() {
	var checkExist = setInterval(function () {
		var table = document.getElementById(acpTable);
		var hdrs = table.rows[0].cells;
		if (hdrs != null) {
			for (let i = 0; i < hdrs.length; i++) {
				hdrs[i].onclick = function () {
					sortTable(table, i);
				}
			}
			clearInterval(checkExist);
		}
	}, 200); // check every 200ms
}

// Source: https://www.w3schools.com/howto/howto_js_sort_table.asp
function sortTable(table, n) {
	var rows, switching, i, x, y, shouldSwitch, dir, switchcount = 0;
	switching = true;
	// Set the sorting direction to ascending:
	dir = "asc";
	/* Make a loop that will continue until
	no switching has been done: */
	while (switching) {
		// Start by saying: no switching is done:
		switching = false;
		rows = table.rows;
		/* Loop through all table rows (except the
		first, which contains table headers): */
		for (i = 1; i < (rows.length - 1); i++) {
			// Start by saying there should be no switching:
			shouldSwitch = false;
			/* Get the two elements you want to compare,
			one from current row and one from the next: */
			x = rows[i].getElementsByTagName("TD")[n];
			y = rows[i + 1].getElementsByTagName("TD")[n];
			/* Check if the two rows should switch place,
			based on the direction, asc or desc: */
			if (dir == "asc") {
				if (x.textContent.toLowerCase() > y.textContent.toLowerCase()) {
					// If so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			} else if (dir == "desc") {
				if (x.textContent.toLowerCase() < y.textContent.toLowerCase()) {
					// If so, mark as a switch and break the loop:
					shouldSwitch = true;
					break;
				}
			}
		}
		if (shouldSwitch) {
			/* If a switch has been marked, make the switch
			and mark that a switch has been done: */
			rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
			switching = true;
			// Each time a switch is done, increase this count by 1:
			switchcount++;
		} else {
			/* If no switching has been done AND the direction is "asc",
			set the direction to "desc" and run the while loop again. */
			if (switchcount == 0 && dir == "asc") {
				dir = "desc";
				switching = true;
			}
		}
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
	var url = SCbaseURLMembers + sc_name + "/" + closeAfterProcessLocationSearch;
	var win = window.open(url, sc_name, "width= 640, height= 480, left=0, top=0, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=no, copyhistory=no");
	win.blur();
	window.focus();
}

function bgCheckSCInTab(sc_name) {
	var url = SCbaseURLMembers + sc_name + "/" + closeAfterProcessLocationSearch;
	var win = window.open(url, sc_name);
	window.focus();
}

function redrawSCButtons(sc_fields, sc_names) {
	var sc_buttons = [];
	for (var i = 0; i < sc_fields.length; i++) {
		if (sc_names[i].length != 0) {
			var fontcolor = colors.blue;
			var scObj = getSCObj(sc_names[i]);
			var pcCheckTarget = scObj.pccheck;
			var knownCheater = scObj.cheater;
			var scID = scObj.scid;
			const scValid = scObj.valid;
			var scValidityChecked = scValid != undefined;
			if (scValidityChecked) {
				fontcolor = scValid ? colors.green : colors.red;
			}
			sc_fields[i].innerHTML = "<a style='color: " + colors.yellow + ";'>"
				+ (pcCheckTarget ? pccheckTag : "")
				+ (knownCheater ? cheaterTag : "")
				+ "</a><a style='color: " + fontcolor + ";' href='" + SCbaseURLMembers + sc_names[i] + "/" + ((autoProcess.value && closeAfterProcess.value) ? closeAfterProcessLocationSearch : "") + "' target='_blank'>"
				+ sc_names[i]
				+ "</a><a style='color: " + fontcolor + ";'>"
				+ ((showSCID.value && scID) ? (" (" + scID + ")") : "")
				+ "</a>"
				+ ((scValidityChecked && hideButtonOnProcessedNames.value) ? "" : ((autoProcess.value && backgroundProcessButton.value) ? "<button type='button' class='small-margin-left' id='bgcheckButton_" + i + "'>Check</button>" : ""));

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
			fontcolor = colors.red;
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

	window.addEventListener("message", (event) => {
		if (event.origin !== SCbaseURL)
			return;
		redrawSCButtons(sc_fields, sc_names);
	}, false);

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

function getMoneyTable() {
	var tables = {};
	tables.nameField = $(moneyLogSelectors.nametable);
	tables.dateText = getTableValues($(moneyLogSelectors.datetable));
	tables.qtty = $(moneyLogSelectors.qttytable);

	tables.qttyText = getTableValues(tables.qtty);
	tables.qttyValue = [];

	for (var i = 0; i < tables.qttyText.length; i++) {
		tables.qttyValue[i] = { value: parseInt(tables.qttyText[i].replace(/^\D+/g, '')), outgoing: tables.qttyText[i].startsWith('-') };
	}

	return tables;
}

function handleMoneySearchAll(urlsearch) {
	var nickname, id, ip, desc, endpage;
	if (urlsearch == null) {
		urlsearch = new URLSearchParams(location.search);
		var nickset = false;
		var idset = false;
		var ipset = false;
		var descset = false;
		nickname = document.getElementById(moneyLogSelectors.inputFieldIDs.nick).value;
		if (nickname.length == 0) {
			nickname = moneyLogSelectors.searchParams.default;
		} else {
			nickset = true;
		}

		var id = document.getElementById(moneyLogSelectors.inputFieldIDs.id).value;
		if (id.length == 0) {
			id = moneyLogSelectors.searchParams.default;
		} else {
			idset = true;
		}

		var ip = document.getElementById(moneyLogSelectors.inputFieldIDs.ip).value;
		if (ip.length == 0) {
			ip = moneyLogSelectors.searchParams.default;
		} else {
			ipset = true;
		}

		var desc = document.getElementById(moneyLogSelectors.inputFieldIDs.desc).value;
		if (desc.length == 0) {
			desc = moneyLogSelectors.searchParams.default;
		} else {
			descset = true;
		}

		var endpage = parseInt(document.getElementById(moneyLogSelectors.inputPage).value);
		if ((nickset || idset || ipset || descset) && !isNaN(endpage)) {
			if (window.confirm(
				"Do you want to summarize all pages with the following parameters?\n"
				+ (nickset ? ("Nickname: " + nickname + "\n") : "")
				+ (idset ? ("Account ID: " + id + "\n") : "")
				+ (ipset ? ("IP: " + ip + "\n") : "")
				+ (descset ? ("To/From whom: " + desc + "\n") : "")
				+ ("Endpage: " + endpage + "\n")
			)) {
				gmStorageMaps.playerMapPagesSum.map = deleteMapIDFromStorage(gmStorageMaps.playerMapPagesSum.id);

				var urlsearch = new URLSearchParams(location.search);
				urlsearch.set(moneyLogSelectors.searchParams.nick, nickname);
				urlsearch.set(moneyLogSelectors.searchParams.id, id);
				urlsearch.set(moneyLogSelectors.searchParams.ip, ip);
				urlsearch.set(moneyLogSelectors.searchParams.desc, desc);
				urlsearch.set(moneyLogSelectors.searchParams.endpage, endpage);

				var page = parseInt(urlsearch.get(moneyLogSelectors.searchParams.page));
				if (isNaN(page)) {
					page = 1;
				}

				urlsearch.set(moneyLogSelectors.searchParams.page, page);

				if (page == endpage) {
					window.alert("Startpage is equal to Endpage!");
					return;
				}
				urlsearch.set(moneyLogSelectors.active, "true");

				openPaginationPage(urlsearch);
			}
		} else {
			window.alert("Search Parameters or End Page specified!");
		}
	} else {
		if (urlsearch.get(moneyLogSelectors.active) == 'true') {
			var page = parseInt(urlsearch.get(moneyLogSelectors.searchParams.page));
			var endpage = parseInt(urlsearch.get(moneyLogSelectors.searchParams.endpage));
			if (page < endpage) {
				urlsearch.set(moneyLogSelectors.searchParams.page, page + 1);
			} else if (page > endpage) {
				urlsearch.set(moneyLogSelectors.searchParams.page, page - 1);
			} else {
				// Open Window, return, reload
				openDailyTotalTable(getTrimmedDatePlayerData(addToDailySumMap(getMoneyTable()).map));

				urlsearch.delete(moneyLogSelectors.active);

				openPaginationPage(urlsearch);
			}

			addToDailySumMap(getMoneyTable());

			openPaginationPage(urlsearch);
		} else {
			window.alert("Something went wrong");
		}
	}

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
			if (confirm(("Really reset summary?"))) {
				gmStorageMaps.playerMapPagesSum.map = deleteMapIDFromStorage(gmStorageMaps.playerMapPagesSum.id);
				addToSumMoneyButton.style.visibility = 'visible';
			}
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
				fontcolor = colors.red;
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
				if (!value) {
					if (!nameObj.scid) {
						nameObj.scid = "N/A";
					}
				}
				break;
			case scValueTypes.cheater:
				nameObj.cheater = value;
				break;
			case scValueTypes.pccheck:
				nameObj.pccheck = value;
				break;
			case scValueTypes.scid:
				nameObj.scid = value;
				break;
		}
		GM_setValue(scStorageIdentifier + name, JSON.stringify(nameObj));
		if (window.opener != null) {
			window.opener.postMessage("SC Value updated!", websiteACP);
		}
	}
}

function ClearSCResult(name) {
	if (name.length != 0) {
		GM_deleteValue(scStorageIdentifier + name);
	}
}

function getSCNameFromURL() {
	return window.location.pathname.split('/')[2].replaceAll("%20", " ");
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
									window.close();
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
								window.close();
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
		// Invalid Account: Close Tab. Valid Account: Close Tab after processing scid
		if (closeAfterProcess.activeTab && !searched_acc.exists) {
			window.close();
		}
	}
}

function injectDropDown() {
	const li = $('#header-navbar-collapse > ul > li.dropdown.dropdown-profile > ul > li')[0];
	const cheaterentry = document.createElement('a');
	cheaterentry.innerHTML = "Enter Cheaters";
	cheaterentry.id = "cheater_prompt";
	cheaterentry.onclick = function () {
		var namestring = window.prompt("Enter Cheater List\n"
			+ "(Make sure they are from a table and each name is on a new line)");
		var namesnl = namestring.split('\r\n');
		var namesspace = namestring.split(' ');
		var names = (namesnl.length > namesspace.length) ? namesnl : namesspace;
		for (var i = 0; i < names.length; i++) {
			if (names[i].length > 0) {
				submitSCResult(names[i], scValueTypes.cheater, true);
			}
		}
		window.alert("All Cheaters imported successfully");
	}
	const clearcheaters = document.createElement('a');
	clearcheaters.innerHTML = "Clear Cheater List";
	clearcheaters.id = "clear_cheater_prompt";
	clearcheaters.onclick = async function () {
		if (confirm(("Do you really want to clear your local Cheater list?\n"
			+ "This will remove the cheater tag, but keep other information (valid, scid etc) untouched\n"
			+ "Press OK to continue."))) {
			var scToBeUpdatedEntries = await GM.listValues();
			for (let i = 0; i < scToBeUpdatedEntries.length; i++) {
				if (scToBeUpdatedEntries[i].startsWith(scStorageIdentifier)) {
					var nameObj = JSON.parse(GM_getValue(scToBeUpdatedEntries[i], "{}"));
					delete nameObj.cheater;
					GM_setValue(scToBeUpdatedEntries[i], JSON.stringify(nameObj));
				}
			}
			window.alert("All Cheaters cleared successfully");
		}
	}
	const pccheckentry = document.createElement('a');
	pccheckentry.innerHTML = "Enter PC Check Targets";
	pccheckentry.id = "cheater_prompt";
	pccheckentry.onclick = async function () {
		var namestring = window.prompt("Enter PC Check List\n"
			+ "(Make sure they are from a table and each name is on a new line)");
		var namesnl = namestring.split('\r\n');
		var namesspace = namestring.split(' ');
		var names = (namesnl.length > namesspace.length) ? namesnl : namesspace;
		var scToBeUpdatedEntries = await GM.listValues();
		for (let i = 0; i < scToBeUpdatedEntries.length; i++) {
			if (scToBeUpdatedEntries[i].startsWith(scStorageIdentifier)) {
				var nameObj = JSON.parse(GM_getValue(scToBeUpdatedEntries[i], "{}"));
				delete nameObj.pccheck;
				GM_setValue(scToBeUpdatedEntries[i], JSON.stringify(nameObj));
			}
		}
		for (var i = 0; i < names.length; i++) {
			if (names[i].length > 0) {
				submitSCResult(names[i], scValueTypes.pccheck, true);
			}
		}
		window.alert("All PC Check Targets set successfully");
	}
	const colorpicker = document.createElement('a');
	colorpicker.innerHTML = "Choose Highlighting Colors";
	colorpicker.id = "color_prompt";
	colorpicker.onclick = async function () {
		for (const [color, content] of Object.entries(colorstorage)) {

			var newColor = window.prompt("Enter new Color Tag for\n"
				+ content.desc + "\n"
				+ "Default: " + default_colors[color] + " Current: " + colors[color]);
			if (newColor == '' || newColor === null) {
				newColor = default_colors[color];
			}
			gmStorageMaps.colorOptions.map.set(color, newColor);
			colors[color] = newColor;
		}
		saveMapToStorage(gmStorageMaps.colorOptions);
		window.alert("All Colors set successfully");
	}
	const version = document.createElement('a');
	version.innerHTML = "GRSI Version: " + GM_info.script.version;
	version.id = "grsi_version";
	const cheaterscid = document.createElement('a');
	cheaterscid.innerHTML = "Fetch Cheater SCIDs";
	cheaterscid.id = "cheater_scid";
	cheaterscid.onclick = async function () {
		var scToBeUpdatedEntries = await GM.listValues();
		var totalChecks = 0;
		for (let i = 0; i < scToBeUpdatedEntries.length; i++) {
			if (scToBeUpdatedEntries[i].startsWith(scStorageIdentifier)) {
				var nameObj = JSON.parse(GM_getValue(scToBeUpdatedEntries[i], "{}"));
				if (!nameObj.scid && nameObj.cheater) {
					bgCheckSCInTab(scToBeUpdatedEntries[i].replace(scStorageIdentifier, ""));
					await new Promise(resolve => setTimeout(resolve, 5000));
					if (++totalChecks > 100) {
						break;
					}
				}
			}
		}
	}
	const getscids = document.createElement('a');
	getscids.innerHTML = "Get SCID List";
	getscids.id = "return_scid";
	getscids.onclick = async function () {
		var namestring = window.prompt("Enter SocialClub Name List\n"
			+ "(Make sure they are from a table and each name is on a new line)");
		var namesnl = namestring.split('\r\n');
		var namesspace = namestring.split(' ');
		var names = (namesnl.length > namesspace.length) ? namesnl : namesspace;
		var scIDs = "";
		for (var i = 0; i < names.length; i++) {
			var nameObj = getSCObj(names[i]);
			scIDs += (nameObj.scid ? nameObj.scid : "") + '\r\n';
		}
		await new Promise(resolve => setTimeout(resolve, 500));
		await navigator.clipboard.writeText(scIDs);
		await new Promise(resolve => setTimeout(resolve, 500));
		window.alert("All SCIDs copied to clipboard successfully");
	}
	const importaccandidlist = document.createElement('a');
	importaccandidlist.innerHTML = "Import Social Club ID List";
	importaccandidlist.id = "import_scid"; importaccandidlist.onclick = async function () {
		var namestring = window.prompt("Enter SocialClub Name and SCID List\n"
			+ "(Make sure they are from a table and each | Name | ID | entry is on a new line)");
		var namesnl = namestring.split('\r\n');
		var namesspace = namestring.split(' ');
		var names = (namesnl.length > namesspace.length) ? namesnl : namesspace;
		var scIDs = "";
		for (var i = 0; i < names.length; i++) {
			var row = names[i].split('\t');
			var name = row[0];
			var scid = row[1];
			if (name) {
				if (isNaN(row[1])) {
					if (row[1] === "N/A") {
						submitSCResult(name, scValueTypes.valid, false);
					}
				} else {
					submitSCResult(name, scValueTypes.valid, true);
					submitSCResult(name, scValueTypes.scid, scid);
				}
			}
		}
		window.alert("All SCIDs imported successfully");
	}
	const getsocialclubforid = document.createElement('a');
	getsocialclubforid.innerHTML = "Get SocialClub for IDs";
	getsocialclubforid.id = "get_scid4id";
	getsocialclubforid.onclick = async function () {
		var idstring = window.prompt("Enter ID List\n"
			+ "(Make sure they are from a table and each entry is on a new line)");
		var idsnl = idstring.split('\r\n');
		var idsspace = idstring.split(' ');
		var ids = (idsnl.length > idsspace.length) ? idsnl : idsspace;

		var loadingOverlay = document.getElementById('processingOverlay');
		var loadingDesc = document.getElementById('processingOverlayDescription');
		var loadingButton = document.getElementById('processingOverlayButton');
		var loadingProgress = document.getElementById('processingOverlayProgress');
		var loadingSpinner = document.getElementById('processingOverlaySpinner');

		loadingDesc.innerHTML = "Getting SocialClub for IDs...";
		loadingOverlay.style.display = 'block';

		var scs = await getSCforIDTable(ids, loadingProgress);
		var scstring = "";

		for (var i = 0; i < scs.length; i++) {
			var scObj = { name: "" };
			if (scs[i]) {
				scObj = getSCObj(scs[i]);
				scObj.name = scs[i];
			}
			scstring += scObj.name + '\t' + (scObj.scid ? scObj.scid : "") + '\r\n';
		}

		loadingButton.style.display = '';
		loadingSpinner.style.display = 'none';
		loadingProgress.innerHTML = 'Progress: Done!';
		loadingButton.onclick = async function () {
			await navigator.clipboard.writeText(scstring);
			loadingOverlay.style.display = 'none';
			loadingButton.style.display = 'none';
			loadingSpinner.style.display = '';
			document.title = originalTitle;
		}
	}

	li.appendChild(cheaterentry);
	li.appendChild(clearcheaters);
	li.appendChild(pccheckentry);
	li.appendChild(colorpicker);
	li.appendChild(cheaterscid);
	li.appendChild(getscids);
	li.appendChild(importaccandidlist);
	li.appendChild(getsocialclubforid);
	li.appendChild(version);
}

function injectLoadingOverlay() {
	for (let i = 0; i < overlayCSSArray.length; i++) {
		addCSSStyle(overlayCSSArray[i]);
	}

	let overlay = document.createElement('div');
	overlay.id = 'processingOverlay';
	overlay.style.display = 'none';

	let content = document.createElement('div');
	content.id = 'processingOverlayContent';

	var spinner = document.createElement('img');
	spinner.src = 'https://i.gifer.com/ZKZg.gif';
	spinner.height = 150;
	spinner.id = 'processingOverlaySpinner';

	let desc = document.createElement('div');
	desc.id = 'processingOverlayDescription';
	desc.innerHTML = '';

	let text = document.createElement('div');
	text.id = 'processingOverlayProgress';
	text.innerHTML = '';

	let copyButton = document.createElement('button');
	copyButton.id = 'processingOverlayButton';
	copyButton.title = 'Click to Copy to Clipboard';
	copyButton.type = 'button';
	copyButton.className = 'btn btn-default';
	copyButton.style.display = 'none';
	copyButton.innerHTML = 'Copy to Clipboard';


	content.appendChild(spinner);
	content.appendChild(desc);
	content.appendChild(text);
	content.appendChild(copyButton);

	overlay.appendChild(content);

	document.body.appendChild(overlay);
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

function getInitialRangeSearch(urlsearch) {
	if (urlsearch == null) {
		urlsearch = new URLSearchParams(location.search);
	}
	urlsearch.set(binarySearchValues.active, "true");
	var initialRangeFound = urlsearch.get(binarySearchValues.initialRangeFound) === "true";
	var l = parseInt(urlsearch.get(binarySearchValues.l));
	var r = parseInt(urlsearch.get(binarySearchValues.r));
	if (isNaN(l) || isNaN(r)) {
		l = 1;
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
				var mid = l + Math.floor((r - l) / 2);
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
	return urlsearch;
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
		datechooser.value = today.getFullYear() + "-" + ("0" + (today.getMonth() + 1)).slice(-2) + "-" + ("0" + today.getDate()).slice(-2) + "T00:00"
		datechooser.style.padding = "4px"
		datechooser.style.height = "30px"
		liDate.appendChild(datechooser);
		pagination[0].appendChild(liDate);
		var liA = document.createElement("li");
		var a = document.createElement("a");
		a.href = "javascript:void(0)";
		a.innerHTML = "Go";
		a.onclick = (function () {
			if (textbox.value.length > 0) {
				openPaginationPageInt(textbox.value);
			} else {
				if (window.confirm("Do you really want to search for this date: " + datechooser.value + "?"
					+ "\n(The Tab will continue to reload until the search is done)")) {
					var urlsearch = new URLSearchParams(location.search);
					urlsearch.set(binarySearchValues.search, datechooser.value);
					urlsearch.delete(binarySearchValues.l);
					urlsearch.delete(binarySearchValues.r);
					urlsearch.delete(binarySearchValues.active);
					urlsearch.delete(binarySearchValues.initialRangeFound);
					openPaginationPage(getInitialRangeSearch(urlsearch));
				}
			}
		});
		liA.appendChild(a);
		pagination[0].appendChild(liA);
	}
}

function initPunishmentLogs() {
	var idTbl = getTableValues($(punishmentLogs.column));
	var idtdTbl = $(punishmentLogs.column);
	for (var i = 0; i < idTbl.length; i++) {
		var urlsearch = new URLSearchParams();
		urlsearch.set(authLogValues.searchParams.nick, authLogValues.searchParams.default);
		urlsearch.set(authLogValues.searchParams.id, idTbl[i]);
		urlsearch.set(authLogValues.searchParams.ip, authLogValues.searchParams.default);
		urlsearch.set(authLogValues.searchParams.sc, authLogValues.searchParams.default);
		var url = authorizationLogsBase + urlsearch.toString();
		idtdTbl[i].innerHTML = "<a style='color: " + colors.blue + "' href=" + url + " target='_blank'>" + idTbl[i] + "</a>";
	}
}

function initClickableDate(selectors) {
	// Somehow get the date column and init hrefs
	const dateColumn = $(selectors.datetable);
	const dateColumnText = getTableValues(dateColumn);
	const searchDate = new URLSearchParams(location.search).get(binarySearchValues.search);
	for (var i = 0; i < dateColumn.length; i++) {
		var urlsearch = new URLSearchParams();
		const nickFieldValue = document.getElementById(selectors.inputFieldIDs.nick).value;
		const idFieldValue = document.getElementById(selectors.inputFieldIDs.id).value;
		const ipFieldValue = document.getElementById(selectors.inputFieldIDs.ip).value;
		for (const [key, entry] of Object.entries(selectors.searchParams)) {
			urlsearch.set(entry, selectors.searchDefault);
		}
		if (nickFieldValue) {
			urlsearch.set(selectors.searchParams.nick, nickFieldValue);
		}
		if (idFieldValue) {
			urlsearch.set(selectors.searchParams.id, idFieldValue);
		}
		if (ipFieldValue) {
			urlsearch.set(selectors.searchParams.ip, ipFieldValue);
		}
		urlsearch.set(binarySearchValues.search, dateColumnText[i]);
		var href = selectors.oppositeBase + getInitialRangeSearch(urlsearch).toString();
		var datecolor = colors.blue;
		if (dateColumnText[i] == searchDate) {
			datecolor = colors.green;
			dateColumn[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
		dateColumn[i].innerHTML = "<a style='color: " + datecolor + ";' href='" + href + "' target='_blank'>"
			+ dateColumnText[i] + "</a>";
	}
}

window.addEventListener('load', function () {

	if (location.hostname === hostnameACP) {
		originalTitle = document.title;
		if (this.location.pathname === '/' + acpTable) {
			InitACPTableSortable();
			return;
		}
		var searchparams = new URLSearchParams(location.search);
		if (searchparams.get(binarySearchValues.active) == 'true') {
			openPaginationPage(getInitialRangeSearch());
			return;
		}
		if (searchparams.get(fractionSearchValues.active) == 'true') {
			handleFractionSearchEntry(searchparams);
			return;
		}
		if (searchparams.get(moneyLogSelectors.active) == 'true') {
			handleMoneySearchAll(searchparams);
			return;
		}
		if (pathPlayerSearch.test(location.pathname)) {
			initSearchButton(playerSearchSelectors, true);
		}
		if (pathAuthLogs.test(location.pathname)) {
			initSearchButton(authLogValues, false);
			if (searchparams.get(authLogValues.active) == 'true') {
				autoFetchAndProcessAuthData(searchparams);
			}
		}
		if (pathMoneyLogs.test(location.pathname)) {
			initClickableDate(moneyLogSelectors);
			initSearchButton(moneyLogSelectors, false);
		}
		if (pathInventoryLogs.test(location.pathname)) {
			initClickableDate(inventoryLogSelectors);
		}
		if (pathFractionLogs.test(location.pathname)) {
			initFractionPage();
		}
		if (punishmentSearch.test(location.pathname)) {
			initPunishmentLogs();
		}

		injectLoadingOverlay();

		// Inject Version to account menu
		injectDropDown();

		injectScrollToTop();

		// Add a textbox + Go button to paginated tools
		injectPageChooser();

		for (let i = 0; i < customMarginArray.length; i++) {
			addCSSStyle(customMarginArray[i]);
		}
	}

	if (location.hostname === hostnameRS) {
		initRSPage();
		waitForRSPlayerCards();
	}
}, false);
