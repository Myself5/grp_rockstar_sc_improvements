function getTableValues(table) {
    var tableinternal = [];
    for (var i = 0; i < table.length; i++) {
        tableinternal[i] = table[i].textContent;
    }
    return tableinternal;
}

var dates;
var hdrs = $('body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > thead > tr')[0].children;
for (let i = 0; i < hdrs.length; i++) {
    if (hdrs[i].textContent === "Date") {
        dates = getTableValues($('body > div.app-layout-canvas > div > main > div > div:nth-child(2) > div > table > tbody > tr > td:nth-child(' + (i + 1) + ')'));
    }
}