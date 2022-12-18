// ==UserScript==
// @name		GrandRP/Rockstar Social Club improvements
// @namespace	https://myself5.de
// @version		4.1.9
// @description	Improve all kinds of ACP and SocialClub features
// @author		Myself5
// @updateURL	https://g.m5.cx/GRSI.user.js
// @downloadURL	https://g.m5.cx/GRSI.user.js
// @match		https://gta5grand.com/admin_*/account/search
// @match		https://socialclub.rockstargames.com/members*
// @match		https://gta5grand.com/admin_*/logs/authorization*
// @match		https://gta5grand.com/admin_*/logs/money*
// @grant		GM_getValue
// @grant		GM_setValue
// @grant		GM_deleteValue
// ==/UserScript==

// Compatibility Patch, remove at some point
const socialClubVerificationMap = {
	id: 'socialClubVerification',
	map: getMapFromStorage('socialClubVerification'),
};

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


function submitSCResult(name, result) {
	if (name != null && name.length > 2) {
		if (socialClubVerificationMap.map.has(name)) {
			socialClubVerificationMap.map.get(name).valid = result;
		} else {
			socialClubVerificationMap.map.set(name, { valid: result });
		}
		saveMapToStorage(socialClubVerificationMap);
	}
}

function convertAllSCNamesToNewFormat(names) {
	for (let i = 0; i < names.length; i++) {
		if (names[i].startsWith('sc_')) {
			const oldValue = GM_getValue(names[i], null);
			if (oldValue != null) {
				GM_deleteValue(names[i]);
				submitSCResult(names[i].replace(/^(sc_)/, ""), oldValue === "true");
			}
		}
	}
	GM_deleteValue('autoProcess_value');
	GM_deleteValue('backgroundProcessButton_value');
	GM_deleteValue('closeAfterProcess_value');
	GM_deleteValue('colorMatch_value');
	GM_deleteValue('hideButtonOnProcessedNames_value');
	GM_deleteValue('showAllSCID_value');
	GM_deleteValue('showSCID_value');
}

window.alert("GRSI: Updating Datastructure. Please wait...\n(This message can be closed. A new message will show once done)");
convertAllSCNamesToNewFormat(await GM.listValues());
window.alert("Conversion to new Datastructure done. Please update GRSI.");
console.log("Conversion Done");