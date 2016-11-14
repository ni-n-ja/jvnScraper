var request = require('request'),
	cheerio = require('cheerio'),
	lite=require('iconv-lite'), //https://www.npmjs.com/package/iconv-lite
	fs = require('fs');
var filename = Math.random();
console.log(filename);
var csv = new Array();
var async = require("async");
var bar;

(function() {
	async.waterfall([
		function(callback) {
			hoge(callback);
		},
		function(callback) {
			fuga(1, callback);
		},
		function(callback) {
			fuga(2, callback);
		},
		function(callback) {
			fuga(3, callback);
		},
		function(callback) {
			fuga(4, callback);
		},
		function(callback) {
			fuga(5, callback);
		},
		function(callback) {
			fuga(6, callback);
		},
		function(callback) {
			var buf = csv;
			csv = buf.filter(function(element, index, self) {
				return self.indexOf(element) === index;
			});
			csv.forEach(function(element, index, array) {
				console.log(element);
			});
			var j = 0;
			bar = setInterval(function() {
				foo(j, callback);
				j++;
			}, 1500);
		}
	]);
}());

function hoge(callback) {
	request({
		url: "http://jvndb.jvn.jp",
		encoding: null,
		headers: {
			"accept-language": "ja"
		}
	}, function(error, response, body) {
		if (!error && response.statusCode == 200) {
			body = lite.decode(body,"Shift_JIS");
			var $ = cheerio.load(body);
			$(".newlist_id_class").each(function() {
				if (Math.floor($(this).next().children().text().replace(/\（..*\）/, "")) >= 5) {
					var aaa = $(this).children("a").text();
					aaa = aaa.replace(/\(..*\)/, "");
					csv.push(aaa);
				}
			});
			console.log("page0 loaded");
			setTimeout(callback, 1000);
		}
	});
}

function fuga(i, callback) {
	var mo = new Date();
	request({
		url: "http://jvndb.jvn.jp/search/index.php",
		encoding: null,
		qs: {
			mode: "_vulnerability_search_IA_VulnSearch",
			lang: "ja",
			keyword: "",
			dateLastPublishedFromYear: mo.getFullYear(),
			dateLastPublishedFromMonth: ("0" + mo.getMonth()).slice(-2),
			datePublicFromYear: mo.getFullYear(),
			datePublicFromMonth: ("0" + mo.getMonth()).slice(-2),
			skey: "d5",
			pageNo: i,
		},
		headers: {
			"accept-language": "ja"
		}
	}, function(error, response, body) {
		console.log("page" + i + " loaded");
		csv.push("page" + i);
		if (!error && response.statusCode == 200) {
			body = lite.decode(body,"Shift_JIS");
			var $ = cheerio.load(body);
			$(".result_class").children("tr").each(function() {
				if ($(this).children("td").children("a").text()) {
					if (Math.floor($(this).children("td").eq(2).text()) >= 5) {
						var aaa = $(this).children("td").children("a").text();
						aaa = aaa.replace(/\(..*\)/, "");
						csv.push(aaa);
					}
				}
			});
		}
		else {
			console.log("error! 404");
			return;
		}
		setTimeout(callback, 1000);
	});
}

function foo(j, callback) {
	if (j >= csv.length - 1) {
		clearInterval(bar);
		callback();
	}
	request({
		url: "http://jvndb.jvn.jp/ja/contents/" + csv[j].slice(6, 10) + "/" + csv[j] + ".html",
		encoding: null,
		headers: {
			"accept-language": "ja"
		}
	}, function(error, response, body) {
		var mo = new Date();
		if (!error && response.statusCode == 200) {
			body = lite.decode(body,"Shift_JIS");
			var $ = cheerio.load(body);
			var obj = {
				id: csv[j],
				product: "",
				ver: '"' + $(".vuln_table_clase_td_header").eq(2).parent().next().next().text().replace(/\n\n/g, "").replace(/^\n/g, "").replace(/\n$/g, "").replace(/\u00a0/g, " ").replace(/\t/g, "") + '"',
				problem: '"' + $(".vuln_table_clase_td_header").eq(0).parent().next().text().replace(/\n\n/g, "").replace(/^\n/g, "").replace(/\n$/g, "").replace(/\u00a0/g, "").replace(/\t/g, "").replace(/\r/g, "") + '"',
				ignore: "起票無",
				reason: "製品と直接的な関係が無いと思われる",
				url: "http://jvndb.jvn.jp/ja/contents/"+$("#header").children(".modifytxt").eq(0).text().substring(6, 10)+"/" + csv[j] + ".html",
				modifyDate: $("#header").children(".modifytxt").eq(0).text().substring(6, this.length)
			};
			fs.appendFileSync('test' + filename + '.csv', obj.id + "," + obj.product + "," + obj.ver + "," + obj.problem + "," + obj.ignore + "," + obj.reason + "," + obj.url + "," + obj.modifyDate + ",\n");
		}
		else {
			console.log("error! " + csv[j]);
		}
	});
}
