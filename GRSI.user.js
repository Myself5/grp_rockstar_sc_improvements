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
};

const scValueTypes = {
	valid: 'valid',
	cheater: 'cheater',
	pccheck: 'pccheck',
	scid: 'scid',
}

var binarySearchValues = {
	page: 'page',
	active: 'binarySearch_Active',
	search: 'binarySearch_Search',
	initialSteps: 1000,
	firstPageFound: false,
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
const punishmentSearch = new RegExp('/admin_.*\/punishmen\/ban');
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
	paginationLastPage: '#DataTables_Table_0_paginate ul li a.pagination-link',
	active: 'authLogSearchActive',
	levelSelector: '#header-navbar-collapse > ul > li.dropdown.dropdown-profile > a > span',
	minimalIPLevel: 5,
	initAuthHref: true,
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
	lastPageSearch: 1000000,
};

const moneyLogSelectors = {
	count: 'body > div.app-layout-canvas > div > main > div > div.row > div',
	header: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > thead > tr > th:nth-child(4)',
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
		default: 'skip',
	},
	inputFieldIDs: {
		nick: 'nick',
		id: 'number-account',
		ip: 'ip',
		desc: 'description',
	},
	tblFields: {
		nick: 0,
		date: 1,
		ip: 2,
		qtty: 3,
		cash: 4,
		bank: 5,
		desc: 6,
	},
	isMoneyLog: true,
};

const inventoryLogSelectors = {
	datetable: 'body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(8)',
	searchDefault: 'skip',
	oppositeBase: websiteACP + "/" + location.pathname.split('/')[1] + '/logs/money?', // + Search
	searchParams: {
		page: 'page',
		nick: 'nick',
		id: 'accid',
		ip: 'ip',
		action: 'action',
		item: 'id_item',
	},
	inputFieldIDs: {
		nick: 'nick',
		id: 'accid',
		ip: 'ip',
		item: 'item_info',
		action: 'action',
		param: 'parameter',
	},
	tblSelectors: {
		nick: 0,
		id: 1,
		item: 2,
		qtty: 3,
		parameter: 4,
		action: 5,
		ip: 6,
		date: 7,
		page: 8,
	},
	initDateClickable: true,
	headerBlock: 'logsinventory_post',
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
	inputQTTY: 'fractionSearchQTTY',
	tblSelectors: {
		nick: 0,
		id: 1,
		action: 2,
		qtty: 3,
		additionalInfo: 4,
		rank: 5,
		date: 6,
	},
};

var punishmentLogs = {
	column: 'body > div.app-layout-canvas > div > main > div > div.card > div > table > tbody > tr > td:nth-child(2)',
	header: 'body > div.app-layout-canvas > div > main > div > div.card > div > table > thead > tr > th:nth-child(4)',
	tblSelectors: {
		nick: 0,
		id: 1,
		admin: 2,
		days_left: 3,
		reason: 4,
		date: 5,
	},
	deleteXButtonRow: 6,
	punishmentUndoID: [],
	punishmentUndoEntry: [],
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
			rowData.push(cell);
		}
		rowData.push({ textContent: page });
		data.push(rowData);
	}
	return data;
}

async function getLastTablePage(urlsearch) {
	let parser = new DOMParser();
	urlsearch.set(authLogValues.searchParams.page, authLogValues.lastPageSearch);
	let url = location.origin + location.pathname + '?' + urlsearch.toString();
	let response = await fetch(url);
	let text = await response.text();
	let doc = parser.parseFromString(text, "text/html");
	let pagination = doc.querySelectorAll(authLogValues.paginationLastPage);

	return pagination.length > 0 ? pagination[pagination.length - 1].text : '1';
}

async function getFullTable(urlsearch, endpage, progressText, startpage) {
	let fullTableData = [];
	let parser = new DOMParser();
	let page = 0;
	const progressEndPage = (endpage - startpage + 1);
	if (progressText) {
		progressText.innerHTML = 'Page: ' + page + '/' + progressEndPage;
	}
	document.title = '[' + page + '/' + progressEndPage + '] ' + originalTitle;

	let promises = [];
	for (let i = startpage; i <= endpage; i++) {
		promises.push(new Promise(async (resolve, reject) => {
			urlsearch.set(authLogValues.searchParams.page, i);
			let url = location.origin + location.pathname + '?' + urlsearch.toString();
			let response = await fetch(url);
			let text = await response.text();
			let doc = parser.parseFromString(text, "text/html");
			let table = doc.querySelector('.card-block table');
			page++;
			if (progressText) {
				progressText.innerHTML = 'Page: ' + page + '/' + progressEndPage;
			}
			document.title = '[' + page + '/' + progressEndPage + '] ' + originalTitle;
			resolve(tableTo2DArray(table, i, i !== startpage));
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
			fullTableData.push(element.length > 1 ? element[1][authLogValues.tblSelectors.sc].textContent : '');
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
	var endpage = await getLastTablePage(urlsearch);
	progressText = document.getElementById('currentpage');
	var fullTable = await getFullTable(urlsearch, endpage, progressText, 1);

	var objectTable = [];

	for (let i = (fullTable.length - 1); i > 0; i--) {
		var entry = {};
		entry.nick = fullTable[i][authLogValues.tblSelectors.nick].textContent;
		entry.id = fullTable[i][authLogValues.tblSelectors.id].textContent;
		entry.ip = fullTable[i][authLogValues.tblSelectors.ip].textContent;
		entry.sc = fullTable[i][authLogValues.tblSelectors.sc].textContent;
		entry.date = fullTable[i][authLogValues.tblSelectors.date].textContent;
		entry.firstpage = fullTable[i][authLogValues.tblSelectors.page].textContent;
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
	filterTable[authLogValues.tblSelectors.nick].push(fullTable[0][authLogValues.tblSelectors.nick].textContent);
	filterTable[authLogValues.tblSelectors.id].push(fullTable[0][authLogValues.tblSelectors.id].textContent);
	filterTable[authLogValues.tblSelectors.ip].push(fullTable[0][authLogValues.tblSelectors.ip].textContent);
	filterTable[authLogValues.tblSelectors.sc].push(fullTable[0][authLogValues.tblSelectors.sc].textContent);
	filterTable[authLogValues.tblSelectors.date].push(fullTable[0][authLogValues.tblSelectors.date].textContent);

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
	openFilterTable(filterTable, authLogValues, true, title, closeAfterProcess);
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
		searchAllButton.after(optionsbutton);
	} else if (pathSelectors.isMoneyLog) {
		// we use the Optionsbutton to place other buttons, but it's unused for moneylogs, so hide it
		optionsbutton.style.display = 'none';

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

	var loading = document.createElement('img');
	loading.src = 'https://i.gifer.com/ZKZg.gif';
	loading.height = 38;
	loading.id = 'loading';
	loading.style.display = 'none';

	loading.style.padding = '0px 5px';

	var progress = document.createElement('a');
	progress.id = 'currentpage';
	progress.style.color = 'initial';

	optionsbutton.after(optionsspoiler);
	optionsspoiler.after(loading);
	loading.after(progress);

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

	var loading = document.createElement('img');
	loading.src = 'https://i.gifer.com/ZKZg.gif';
	loading.height = 38;
	loading.id = 'loading';
	loading.style.display = 'none';

	loading.style.padding = '0px 5px';

	var progress = document.createElement('a');
	progress.id = 'currentpage';
	progress.style.color = 'initial';

	filterButton.after(loading);
	loading.after(progress);

	formBlock.appendChild(filterFormGroup);
}

function initInventoryParameterSearch() {
	var actionField = document.getElementById(inventoryLogSelectors.inputFieldIDs.action);

	var search_button;
	// Search Button on Auto an money logs is not labled, search by class and type
	// search_button = document.getElementById('search-but');
	var buttons = document.getElementsByClassName('btn btn-default');

	for (var i = 0; i < buttons.length; i++) {
		if (buttons[i].type === 'submit') {
			search_button = buttons[i];
		}
	}

	var paramInput = document.createElement('input');
	paramInput.className = 'form-control small-margin-left';
	paramInput.type = 'number';
	paramInput.name = inventoryLogSelectors.inputFieldIDs.param;
	paramInput.id = inventoryLogSelectors.inputFieldIDs.param;
	paramInput.placeholder = 'Parameter';
	paramInput.addEventListener("keyup", (event) => {
		if (event.key === "Enter") {
			handleInventoryParameterSearch();
		}
	});
	actionField.after(paramInput);

	var paramButton = document.createElement('button');
	paramButton.title = "Click to search the results by their parameter"
	paramButton.innerHTML = "Search with Parameter";
	paramButton.type = "button";
	paramButton.className = "btn btn-default small-margin-left";
	paramButton.onclick = function () {
		handleInventoryParameterSearch();
	}

	search_button.after(paramButton);

	var loading = document.createElement('img');
	loading.src = 'https://i.gifer.com/ZKZg.gif';
	loading.height = 38;
	loading.id = 'loading';
	loading.style.display = 'none';

	loading.style.padding = '0px 5px';

	var progress = document.createElement('a');
	progress.id = 'currentpage';
	progress.style.color = 'initial';

	paramButton.after(loading);
	loading.after(progress);
}

async function handleInventoryParameterSearch() {
	var page = 1;
	var itemID;

	var urlsearch = new URLSearchParams(location.search);
	for (const [key, entry] of Object.entries(inventoryLogSelectors.searchParams)) {
		urlsearch.set(entry, inventoryLogSelectors.searchDefault);
	}

	const nickFieldValue = document.getElementById(inventoryLogSelectors.inputFieldIDs.nick).value;
	const idFieldValue = document.getElementById(inventoryLogSelectors.inputFieldIDs.id).value;
	const ipFieldValue = document.getElementById(inventoryLogSelectors.inputFieldIDs.ip).value;
	const itemFieldValue = document.getElementById(inventoryLogSelectors.inputFieldIDs.item).value;
	const actionFieldValue = document.getElementById(inventoryLogSelectors.inputFieldIDs.action).value;
	const parameterFieldValue = document.getElementById(inventoryLogSelectors.inputFieldIDs.param).value;
	const parameter = parseInt(parameterFieldValue);

	if (nickFieldValue) {
		urlsearch.set(inventoryLogSelectors.searchParams.nick, nickFieldValue);
	}
	if (idFieldValue) {
		urlsearch.set(inventoryLogSelectors.searchParams.id, idFieldValue);
	}
	if (ipFieldValue) {
		urlsearch.set(inventoryLogSelectors.searchParams.ip, ipFieldValue);
	}
	if (actionFieldValue) {
		urlsearch.set(inventoryLogSelectors.searchParams.action, actionFieldValue);
	}
	if (itemFieldValue) {
		// This is a huge hack, but works better than the original ACP... as always.
		// The Item ID is the number between the last braces in the item Name
		itemID = parseInt(itemFieldValue.split('(').slice(-1)[0].split(')')[0]);
		urlsearch.set(inventoryLogSelectors.searchParams.item, itemID);
	}
	if (isNaN(itemID)) {
		window.alert("Incorrect Item specified!");
		return;
	}
	if (isNaN(parameter)) {
		window.alert("No Parameter specified!");
		return;
	}

	var endpagestring = window.prompt("Please specify an Endpage for the Parameter Search!\n"
		+ "All Pages from 1 to Endpage will be checked for the specified Parameter.");

	var endpage = parseInt(endpagestring);

	if (isNaN(endpage)) {
		window.alert("Incorrect Endpage specified!");
		return;
	}

	document.getElementById('loading').style.display = '';
	let progressText = document.getElementById('currentpage');
	progressText.innerHTML = 'Page: 0/' + endpage;
	document.title = '[0/' + endpage + '] ' + originalTitle;


	let maxEndPage = await getLastTablePage(urlsearch);
	let maxEndPageInt = parseInt(maxEndPage);
	if (endpage > maxEndPageInt) {
		endpage = maxEndPageInt;
		progressText.innerHTML = 'Page: 0/' + endpage;
		document.title = '[0/' + endpage + '] ' + originalTitle;
	}

	var filterTable = [[], [], [], [], [], [], [], [], []];
	var fullTable = await getFullTable(urlsearch, endpage, progressText, page);

	addToTable(filterTable, fullTable, inventoryLogSelectors.tblSelectors, 0);

	for (let i = 1; i < fullTable.length; i++) {
		var param = parseInt(fullTable[i][inventoryLogSelectors.tblSelectors.parameter].textContent);
		if (parameter == param) {
			fullTable[i][inventoryLogSelectors.tblSelectors.item].textContent = itemFieldValue;
			addToTable(filterTable, fullTable, inventoryLogSelectors.tblSelectors, i);
		}
	}

	var title = '';
	if (idFieldValue) {
		title = title + "ID: " + idFieldValue + " ";
	}
	if (nickFieldValue) {
		title = title + "Nick: " + nickFieldValue + " ";
	}
	if (ipFieldValue) {
		title = title + "IP: " + ipFieldValue + " ";
	}
	if (actionFieldValue) {
		title = title + "Action: " + actionFieldValue + " ";
	}
	title = title + "Item: " + itemID + " ";
	title = title + "Param: " + parameter + " ";
	title = title + "- ACP Inventory Summary";

	openFilterTable(filterTable, inventoryLogSelectors, false, title, false, urlsearch);

	document.getElementById('loading').style.display = 'none';
	document.title = '[Done] ' + originalTitle;
	progressText.innerHTML = '';
}

function addToTable(arr, tbl, selectors, index) {
	for (const [key, selectorValue] of Object.entries(selectors)) {
		arr[selectorValue].push(tbl[index][selectorValue].textContent);
	}
}

async function handleFractionSearchEntry() {
	var playerID, endpage, qtty;
	playerID = parseInt(document.getElementById(fractionSearchValues.inputID).value);
	endpage = parseInt(document.getElementById(fractionSearchValues.inputPage).value);
	qtty = parseInt(document.getElementById(fractionSearchValues.inputQTTY).value);
	var urlsearch = new URLSearchParams(location.search);

	if ((isNaN(playerID) && isNaN(qtty)) || isNaN(endpage)) {
		window.alert("Please specify PlayerID as well as the last page to check (starting from current)");
	} else {
		document.getElementById('loading').style.display = '';
		let progressText = document.getElementById('currentpage');
		progressText.innerHTML = 'Page: 0/' + endpage;
		document.title = '[0/' + endpage + '] ' + originalTitle;
		var page = parseInt(urlsearch.get(fractionSearchValues.page));
		if (isNaN(page)) {
			page = 1;
			urlsearch.set(fractionSearchValues.page, page);
		}

		if (endpage > 100) {
			let maxEndPage = await getLastTablePage(urlsearch);
			let maxEndPageInt = parseInt(maxEndPage);
			if (endpage > maxEndPageInt) {
				endpage = maxEndPageInt;
			}
		}

		if (page > endpage) {
			var tmp = page;
			page = endpage;
			endpage = tmp;
		}
		var filterTable = [[], [], [], [], [], [], []];

		var fullTable = await getFullTable(urlsearch, endpage, progressText, page);

		addToTable(filterTable, fullTable, fractionSearchValues.tblSelectors, 0);

		for (let i = 1; i < fullTable.length; i++) {
			var tblID = parseInt(fullTable[i][fractionSearchValues.tblSelectors.id].textContent);
			var tblQTTY = parseInt(fullTable[i][fractionSearchValues.tblSelectors.qtty].textContent);
			if (tblID == playerID || tblQTTY == qtty) {
				addToTable(filterTable, fullTable, fractionSearchValues.tblSelectors, i);
			}
		}

		var title = '';
		if (!isNaN(playerID)) {
			title = title + "ID: " + playerID + " ";
		}
		if (!isNaN(qtty)) {
			title = title + "QTTY: " + qtty + " ";
		}
		title = title + "- ACP Orga Summary";

		openFilterTable(filterTable, fractionSearchValues, false, title, false);

		document.getElementById('loading').style.display = 'none';
		document.title = '[Done] ' + originalTitle;
		progressText.innerHTML = '';
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

function openFilterTable(filterTable, values, textsummary, title, closeAfterProcess, urlsearch) {
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

	for (let i = 0; i < filterTable.length - (values.initDateClickable ? 1 : 0); i++) {
		cell = headerRow.insertCell();
		if (values.deleteXButtonRow && i == values.deleteXButtonRow) {
			cell.width = '10%';
			cell.innerHTML = '<b>Delete Entry</b> <button id="undoRemove" style="display: none;" class="btn btn-default" type="button">Undo</button>'
		} else {
			cell.innerHTML = "<b>" + filterTable[i][0] + "</b>";
		}
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

		for (let j = 0; j < filterTable.length - (values.initDateClickable ? 1 : 0); j++) {
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
				} else if (values.initDateClickable && j == values.tblSelectors.date) {
					var a = document.createElement('a');
					a.innerHTML = filterTable[j][i];
					a.style.color = colors.blue;

					urlsearch.set(values.searchParams.page, filterTable[values.tblSelectors.page][i]);
					urlsearch.set(binarySearchValues.search, filterTable[j][i]);
					a.href = location.origin + location.pathname + '?' + urlsearch.toString();

					cell.appendChild(a);
				} else if (values.deleteXButtonRow && j == values.deleteXButtonRow) {
					cell.innerHTML = '<button class="btn btn-default" type="button">&#x2716; Delete</button>'
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
			var undoRemove = document.getElementById('undoRemove');
			for (let i = 0; i < hdrs.length; i++) {
				hdrs[i].onclick = function () {
					sortTable(table, i);
					if (undoRemove) {
						initDeleteButtons(table);
					}
				}
			}
			if (undoRemove) {
				initDeleteButtons(table);

				undoRemove.onclick = function () {
					var id = punishmentLogs.punishmentUndoID.pop();
					var entry = punishmentLogs.punishmentUndoEntry.pop();
					var newRow = table.insertRow(id);
					var count = entry.children.length;
					for (var i = 0; i < count; i++) {
						newRow.appendChild(entry.children[0]);
					}
					if (punishmentLogs.punishmentUndoID.length < 1) {
						undoRemove.style.display = 'none';
					}
					initDeleteButtons(table);
				}

				var accIDField = document.querySelector("#acptable > thead > tr:nth-child(1) > td:nth-child(2)");
				var banDateField = document.querySelector("#acptable > thead > tr:nth-child(1) > td:nth-child(6)");

				accIDField.innerHTML = accIDField.innerHTML + ' <button id="copyAccID" class="btn btn-default" type="button">Copy</button>';
				banDateField.innerHTML = banDateField.innerHTML + ' <button id="copyBanDate" class="btn btn-default" type="button">Copy</button>';

				var copyAccID = document.getElementById('copyAccID');
				var copyBanDate = document.getElementById('copyBanDate');

				copyAccID.onclick = function (event) {
					var ids = "";
					for (i = 1; i < table.rows.length; i++) {
						ids += table.rows[i].children[punishmentLogs.tblSelectors.id].textContent + '\r\n';
					}
					navigator.clipboard.writeText(ids);
					event.stopPropagation();
				}

				copyBanDate = document.getElementById('copyBanDate');
				copyBanDate.onclick = function (event) {
					var dates = "";
					for (i = 1; i < table.rows.length; i++) {
						var date = new Date(table.rows[i].children[punishmentLogs.tblSelectors.date].textContent);
						dates += date.getDate() + "." + (date.getMonth() + 1) + "." + date.getFullYear() + '\r\n';
					}
					navigator.clipboard.writeText(dates);
					event.stopPropagation();
				}
			}
			clearInterval(checkExist);
		}
	}, 200); // check every 200ms
}

function initDeleteButtons(table) {
	var removeButtons = [];
	for (let i = 1; i < table.rows.length; i++) {
		var queryRow = i + 1;
		removeButtons[i - 1] = document.querySelector("#acptable > thead > tr:nth-child(" + queryRow + ") > td:nth-child(7)");
		removeButtons[i - 1].onclick = function () {
			punishmentLogs.punishmentUndoID.push(i);
			punishmentLogs.punishmentUndoEntry.push(table.rows[i]);
			table.deleteRow(i);
			undoRemove.style.display = '';
			initDeleteButtons(table);
		}
	}
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

function getMoneyTable(fullTable) {
	var objTables = {
		nameField: [],
		playerID: [],
		dateText: [],
		qttyText: [],
		qttyValue: [],
	}

	for (i = 1; i < fullTable.length; i++) {
		objTables.nameField.push(fullTable[i][moneyLogSelectors.tblFields.nick].textContent);
		var hrefSplit = fullTable[i][moneyLogSelectors.tblFields.nick].children[0].href.split('/');
		objTables.playerID.push(hrefSplit[hrefSplit.length - 1]);
		objTables.dateText.push(fullTable[i][moneyLogSelectors.tblFields.date].textContent);
		objTables.qttyText.push(fullTable[i][moneyLogSelectors.tblFields.qtty].textContent);

		objTables.qttyValue.push({ value: parseInt(fullTable[i][moneyLogSelectors.tblFields.qtty].textContent.replace(/^\D+/g, '')), outgoing: fullTable[i][moneyLogSelectors.tblFields.qtty].textContent.startsWith('-') });
	}
	return objTables;
}

async function handleMoneySearchAll() {
	var nickname, id, ip, desc, endpage;
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
			document.getElementById('loading').style.display = '';
			let progressText = document.getElementById('currentpage');
			progressText.innerHTML = 'Page: 0/' + endpage;
			document.title = '[0/' + endpage + '] ' + originalTitle;

			var urlsearch = new URLSearchParams(location.search);
			urlsearch.set(moneyLogSelectors.searchParams.nick, nickname);
			urlsearch.set(moneyLogSelectors.searchParams.id, id);
			urlsearch.set(moneyLogSelectors.searchParams.ip, ip);
			urlsearch.set(moneyLogSelectors.searchParams.desc, desc);

			var page = parseInt(urlsearch.get(moneyLogSelectors.searchParams.page));
			if (isNaN(page)) {
				page = 1;
			}

			let maxEndPage = await getLastTablePage(urlsearch);
			let maxEndPageInt = parseInt(maxEndPage);
			if (endpage > maxEndPageInt) {
				endpage = maxEndPageInt;
			}

			if (page > endpage) {
				var tmp = page;
				page = endpage;
				endpage = tmp;
			}

			urlsearch.set(moneyLogSelectors.searchParams.page, page);

			var fullTable = await getFullTable(urlsearch, endpage, progressText, page);

			var dailySumTable = addToDailySumMap(getMoneyTable(fullTable));

			var title = '';
			if (nickset) {
				title = title + "Nick: " + nickname + " ";
			}
			if (idset) {
				title = title + "ID: " + id + " ";
			}
			if (nickset) {
				title = title + "IP: " + ip + " ";
			}
			if (nickset) {
				title = title + "Desc: " + desc + " ";
			}
			title = title + "- ACP Money Summary";

			openDailyTotalTable(getTrimmedDatePlayerData(dailySumTable.sum), dailySumTable.names, title);

			document.getElementById('loading').style.display = 'none';
			document.title = '[Done] ' + originalTitle;
			progressText.innerHTML = '';
		}
	} else {
		window.alert("Search Parameters or End Page not specified!");
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
	var playerMapPagesSum = new Map();
	var playerIDNameMap = new Map();
	for (var i = 0; i < tables.nameField.length; i++) {
		var playerID = tables.playerID[i];
		playerIDNameMap.set(playerID, tables.nameField[i]);
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
	return { sum: playerMapPagesSum, names: playerIDNameMap };
}

function openDailyTotalTable(moneyData, playerIDNameMap, title) {
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

	moneyData.playerMap.forEach((player, playerID) => {
		const tr = tbl.insertRow();
		var cell = tr.insertCell();
		cell.innerHTML = "<b>" + playerIDNameMap.get(playerID) + " (" + playerID + ")</b>";
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
		newWindow.document.title = title;
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

	if (first.getHours() != 0 || first.getMinutes() != 0 || first.getSeconds() != 0) {
		sameDay = sameDay && first.getHours() === second.getHours();
		if (first.getMinutes() != 0 || first.getSeconds() != 0) {
			sameDay = sameDay && first.getMinutes() === second.getMinutes();
			if (first.getSeconds() != 0) {
				sameDay = sameDay && first.getSeconds() === second.getSeconds();
			}
		}
	}
	return sameDay;
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
				if (window.confirm("Do you really want to search for this date: " + datechooser.value + "?")) {
					var urlsearch = new URLSearchParams(location.search);
					urlsearch.set(binarySearchValues.search, datechooser.value);
					binarySearchValues.firstPageFound = false;
					binarySearch(urlsearch);
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

	document.querySelector(punishmentLogs.header).innerHTML = "Days left until unban <button type='button' id='filterBans'>Filter</button>";

	var filterbutton = document.getElementById('filterBans');
	filterbutton.onclick = async function () {
		var bandurationstring = window.prompt("Please specify the minimum original Ban duration you want to filter for.");

		var banduration = parseInt(bandurationstring);

		if (isNaN(banduration)) {
			window.alert("Incorrect Duration specified!");
			return;
		}

		var endpagestring = window.prompt("Please specify an Endpage for the Duration Search!\n"
			+ "All Pages from 1 to Endpage will be checked for the specified Duration.");

		var endpage = parseInt(endpagestring);

		if (isNaN(endpage)) {
			window.alert("Incorrect Endpage specified!");
			return;
		}

		var loadingOverlay = document.getElementById('processingOverlay');
		var loadingDesc = document.getElementById('processingOverlayDescription');
		var loadingProgress = document.getElementById('processingOverlayProgress');
		document.title = "[0/" + endpage + "] " + originalTitle;

		loadingDesc.innerHTML = "Filtering Tables...";
		loadingProgress.innerHTML = "Page: 0/" + endpage;
		loadingOverlay.style.display = 'block';

		var filterTable = [[], [], [], [], [], [], []];
		var fullTable = await getFullTable(new URLSearchParams(), endpage, loadingProgress, 1);

		addToTable(filterTable, fullTable, punishmentLogs.tblSelectors, 0);

		var now = new Date();
		var today = new Date(now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate());

		for (i = 1; i < fullTable.length; i++) {
			var testdate = new Date(fullTable[i][punishmentLogs.tblSelectors.date].textContent);
			var diff = datediff(testdate, today);
			var duration = parseInt(fullTable[i][punishmentLogs.tblSelectors.days_left].textContent) + diff;

			if (banduration <= duration) {
				addToTable(filterTable, fullTable, punishmentLogs.tblSelectors, i);
			}
		}

		var title = "Min. Ban: " + banduration + "d - ACP Ban Summary";

		openFilterTable(filterTable, punishmentLogs, false, title, false, urlsearch);

		loadingOverlay.style.display = 'none';
		document.title = "[Done] " + originalTitle;
	}
}

/**
 * Take the difference between the dates and divide by milliseconds per day.
 * Round to nearest whole number to deal with DST.
 */
function datediff(first, second) {
	return Math.round((second - first) / (1000 * 60 * 60 * 24));
}

function initClickableDate(selectors) {
	// Somehow get the date column and init hrefs
	binarySearchValues.firstPageFound = false;
	const dateColumn = $(selectors.datetable);
	const dateColumnText = getTableValues(dateColumn);
	const searchDate = new Date(new URLSearchParams(location.search).get(binarySearchValues.search));
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
		urlsearch.set(binarySearchValues.page, 1);
		urlsearch.set(binarySearchValues.active, 'true');
		var href = selectors.oppositeBase + urlsearch.toString();
		var datecolor = colors.blue;
		var compareDate = new Date(dateColumnText[i]);
		if (isSameDate(searchDate, compareDate)) {
			datecolor = colors.green;
			binarySearchValues.firstPageFound = true;
			dateColumn[i].scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
		dateColumn[i].innerHTML = "<a style='color: " + datecolor + ";' href='" + href + "'>" + dateColumnText[i] + "</a>";
	}
}

async function binarySearch(urlsearch) {
	urlsearch.delete(binarySearchValues.active);

	if (binarySearchValues.firstPageFound) {
		return;
	}

	var loadingOverlay = document.getElementById('processingOverlay');
	var loadingDesc = document.getElementById('processingOverlayDescription');
	var loadingProgress = document.getElementById('processingOverlayProgress');
	var loadingSpinner = document.getElementById('processingOverlaySpinner');

	loadingDesc.innerHTML = "Searching Date: " + urlsearch.get(binarySearchValues.search) + " ...";
	loadingOverlay.style.display = 'block';

	loadingProgress.innerHTML = "Looking for Search Range...";


	var l, r, mid, initialSearchLoop, binarySearchLoop;
	var x = new Date(urlsearch.get(binarySearchValues.search));

	l = 1;
	r = binarySearchValues.initialSteps;
	initialSearchLoop = true;
	binarySearchLoop = true;

	var maxpage = await getLastTablePage(urlsearch);
	var maxpageInt = parseInt(maxpage);

	if (maxpageInt < r) {
		r = maxpageInt;
		initialSearchLoop = false;
	}

	loadingProgress.innerHTML = "Got initial Range, looking for date...";

	while (initialSearchLoop) {
		var rTable = await getFullTable(urlsearch, r, false, r);
		loadingProgress.innerHTML = "Current Page: " + r;
		switch (processDatesFromTable(rTable, x)) {
			case 0:
				// Found the Page
				urlsearch.set(binarySearchValues.page, r);
				initialSearchLoop = false;
				binarySearchLoop = false;
				break;
			case 1:
				initialSearchLoop = false;
				break;
			case -1:
				l += binarySearchValues.initialSteps;
				r += binarySearchValues.initialSteps;
				break;
		}
	}

	mid = l + Math.floor((r - l) / 2);

	while (binarySearchLoop) {
		if (r >= l) {
			var midTable = await getFullTable(urlsearch, mid, false, mid);
			loadingProgress.innerHTML = "Current Page: " + mid;
			switch (processDatesFromTable(midTable, x)) {
				case 0:
					// Found the Page
					urlsearch.set(binarySearchValues.page, mid);
					binarySearchLoop = false;
					break;
				case 1:
					r = mid - 1;
					break;
				case -1:
					l = mid + 1;
					break;
			}
			mid = l + Math.floor((r - l) / 2);
		} else {
			binarySearchLoop = false;
			urlsearch.set(binarySearchValues.page, l);
		}
	}

	loadingSpinner.style.display = 'none';
	loadingProgress.innerHTML = 'Page Found, Reloading!';
	openPaginationPage(urlsearch);
}

function processDatesFromTable(tbl, date) {
	var dateNewerThanPage = false;
	var dateOlderThanPage = false;
	var dateColumn;

	for (i = 0; i < tbl[0].length; i++) {
		if (tbl[0][i].textContent == "Date") {
			dateColumn = i;
			break;
		} else if (tbl[0][i].textContent == "Ban date") {
			dateColumn = i;
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
		}
	}

	for (i = 1; i < tbl.length; i++) {
		var compareDate = new Date(tbl[i][dateColumn].textContent);
		if (isSameDate(date, compareDate)) {
			dateNewerThanPage = true;
			dateOlderThanPage = true;
			break;
		}
		if (date > compareDate) {
			dateNewerThanPage = true;
		}
		if (date < compareDate) {
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

window.addEventListener('load', function () {

	if (location.hostname === hostnameACP) {
		originalTitle = document.title;

		if (this.location.pathname === '/' + acpTable) {
			InitACPTableSortable();
			return;
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

		var searchparams = new URLSearchParams(location.search);
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
			if (searchparams.get(binarySearchValues.active) == 'true') {
				binarySearch(searchparams);
			}
		}
		if (pathInventoryLogs.test(location.pathname)) {
			initClickableDate(inventoryLogSelectors);
			initInventoryParameterSearch();
			if (searchparams.get(binarySearchValues.active) == 'true') {
				binarySearch(searchparams);
			}
		}
		if (pathFractionLogs.test(location.pathname)) {
			initFractionPage();
		}
		if (punishmentSearch.test(location.pathname)) {
			initPunishmentLogs();
		}
	}

	if (location.hostname === hostnameRS) {
		initRSPage();
		waitForRSPlayerCards();
	}
}, false);
