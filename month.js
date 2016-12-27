'use strict'

var request = require('request'),
  cheerio = require('cheerio'),
  lite = require('iconv-lite'),
  fs = require('fs');
var filename = Math.random();
var mo = new Date();
var month = process.argv[2] || (mo.getMonth() + 1);
var year = mo.getFullYear();
var csv = new Array();
var rushCount = 0;
var count = 1;

if (month < 10) {
  month = "0" + month;
}

function pageNo(number) {
  return new Promise(function (resolve, reject) {
    resolve({
      "page": count,
      "month": month
    });
  });
}

var timer = setInterval(function () {
  pageNo()
    .then(function (value) {
      fuga(value.page, value.month);
    })
    .catch(function (error) { });
}, 1500);

function fuga(i, mon) {
  request({
    url: "http://jvndb.jvn.jp/search/index.php",
    encoding: null,
    qs: {
      mode: "_vulnerability_search_IA_VulnSearch",
      lang: "ja",
      keyword: "",
      dateLastPublishedFromYear: year,
      dateLastPublishedFromMonth: mon,
      datePublicFromYear: year,
      datePublicFromMonth: mon,
      dateLastPublishedFromYear: year,
      dateLastPublishedFromMonth: mon,
      dateLastPublishedToYear: year,
      dateLastPublishedToMonth: mon,
      useSynonym: 1,
      vendor: "",
      product: "",
      severity: "",
      cwe: "",
      searchProductId: "",
      skey: "d5",
      pageNo: i,
    },
    headers: {
      "accept-language": "ja"
    }
  }, function (error, response, body) {
    console.log("page" + i + " loaded");
    csv.push("page" + i);
    let $ = cheerio.load(lite.decode(body, "Shift_JIS"));

    $(".result_class")
      .children("tr")
      .each(function () {
        if ($(this)
          .children("td")
          .children("a")
          .text()) {
          if (Math.floor($(this)
            .children("td")
            .eq(2)
            .text()) >= 5) {
            var aaa = $(this)
              .children("td")
              .children("a")
              .text();
            aaa = aaa.replace(/\(..*\)/, "");
            csv.push(aaa);
          }
        }
      });

    if ($(".pager_index_class")
      .eq(0)
      .children()
      .eq($(".pager_index_class")
        .eq(0)
        .children()
        .length - 1)
      .attr("title") === "next page") {
      count++;
    } else {
      console.log($(".pager_index_class")
        .eq(0)
        .children()
        .eq($(".pager_index_class")
          .eq(0)
          .children()
          .length - 1));
      clearInterval(timer);
      csv.forEach(function (element, index, array) {
        console.log(element);
      });
      timer = setInterval(function () {
        hoge(rushCount);
        rushCount++;
      }, 1500);
    }
  });
}

function hoge(j) {
  if (j >= csv.length - 1) {
    clearInterval(timer);
  }
  request({
    url: "http://jvndb.jvn.jp/ja/contents/" + csv[j].slice(6, 10) + "/" + csv[j] + ".html",
    encoding: null,
    headers: {
      "accept-language": "ja"
    }
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      body = lite.decode(body, "Shift_JIS");
      var $ = cheerio.load(body);
      var obj = {
        id: csv[j],
        product: "",
        ver: '"' + $(".vuln_table_clase_td_header")
          .eq(2)
          .parent()
          .next()
          .next()
          .text()
          .replace(/\n\n/g, "")
          .replace(/^\n/g, "")
          .replace(/\n$/g, "")
          .replace(/\u00a0/g, " ")
          .replace(/\t/g, "") + '"',
        problem: '"' + $(".vuln_table_clase_td_header")
          .eq(0)
          .parent()
          .next()
          .text()
          .replace(/\n\n/g, "")
          .replace(/^\n/g, "")
          .replace(/\n$/g, "")
          .replace(/\u00a0/g, "")
          .replace(/\t/g, "")
          .replace(/\r/g, "")
          .replace(/\"/g, "") + '"',
        ignore: "起票無",
        reason: "製品と直接的な関係が無いと思われる",
        url: "http://jvndb.jvn.jp/ja/contents/" + $("#header")
          .children(".modifytxt")
          .eq(0)
          .text()
          .substring(6, 10) + "/" + csv[j] + ".html",
        modifyDate: $("#header")
          .children(".modifytxt")
          .eq(0)
          .text()
          .substring(6, this.length)
      };
      fs.appendFileSync(year + "-" + month + '.csv', obj.id + "," + obj.product + "," + obj.ver + "," + obj.problem + "," + obj.ignore + "," + obj.reason + "," + obj.url + "," + obj.modifyDate + ",\n");
    } else {
      console.log("error! " + csv[j]);
    }
  });
}
