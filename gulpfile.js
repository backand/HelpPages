var gulp = require('gulp');
var modify = require('gulp-modify');
var util = require('util')
var path = require('path');
var foreach = require('gulp-foreach');
var file = require('gulp-file');
var fs = require('fs');
var isWin = /^win/.test(process.platform);

var baseUrl = ""
var pages = new Array();
var srcPattern = 'source/docs/{,*/}{,*/}*.md';
var mkdocsPath = 'source/mkdocs.yml';

function extracteIntrestingPart(file) {
    var fileKey = file.path.substr(file.path.lastIndexOf('\\docs\\') + ('\\docs\\'.length )).toLowerCase();
    return fileKey;
}
gulp.task('default', function () {

    pages = readPagesFromConfig(mkdocsPath);
    gulp.src(srcPattern)
        .pipe(modify({
            fileModifier: function (file, contents) {
                console.log( "modifying: " +file.path);
                // #1 add title to every page
                interestinPathPart = extracteIntrestingPart(file);
                pagesDetail = pages[interestinPathPart];
                //console.log(pagesDetail);
                if (pagesDetail !== undefined) {
                   
                    title = pagesDetail.title;
                    header = "---\n" + "title: " + title + "\n---\n"
                    //console.log(file);

                    // #2 change links from .md to .html
                    contents = contents.replace(/\w+.md/g, function (a) {
                        // console.log(a);
                        a = a.replace(".md", "");

                        return '../' + a + '/index.html';
                    })

                    // #3 replace tab by four spaces
                    contents = contents.replace(/\t/g, '    ')

                    // #4 replace '\' with two '\\'
                    contents = contents.replace(/\\/g, '\\\\')

                    return header + contents;
                }
                else {
                    console.log("can't find " + interestinPathPart);
                    return "none";
                }
            }
        }))
        .pipe(gulp.dest('en/latest'));
});

var finalFileContent = '';
var menu = new Array();
var viewFiles = [];
var pageOrder = new Array();
gulp.task('concat sidebar', function (cb) {
    pages = readPagesFromConfig(mkdocsPath);

    //var knownEntries = [''];
    return gulp.src(srcPattern)
        .pipe(foreach(function (stream, file) {
                if (viewFiles.indexOf(file.path) == -1) {
                    viewFiles.push(file.path);
                    interestinPathPart = extracteIntrestingPart(file);

                    pagesDetail = pages[interestinPathPart];

                    if (pagesDetail !== undefined) {
                        // first time this title appear
                        tempFileContent = "";

                        if (menu[pagesDetail.parentMenu] === undefined) {

                            // add title
                            tempFileContent = addLine(tempFileContent, 0, "");
                            tempFileContent = addLine(tempFileContent, 1, "- title: " + pagesDetail.parentMenu);
                            tempFileContent = addLine(tempFileContent, 1, "  audience: writers, designers");
                            tempFileContent = addLine(tempFileContent, 1, "  platform: all");
                            tempFileContent = addLine(tempFileContent, 1, "  product: all");
                            tempFileContent = addLine(tempFileContent, 1, "  version: all");
                            tempFileContent = addLine(tempFileContent, 1, "  output: web");
                            tempFileContent = addLine(tempFileContent, 1, "  items:");

                            // tempFileContent will be added in the end of function
                            menu[pagesDetail.parentMenu] = new Array();
                        }

                        // add second part
                        //console.log(pagesDetail.url, "\t", pagesDetail.title, "\t", file.path);
                        tempFileContent = addLine(tempFileContent, 2, "- title: " + pagesDetail.title);
                        tempFileContent = addLine(tempFileContent, 2, "  url: " + pagesDetail.url);
                        tempFileContent = addLine(tempFileContent, 2, "  audience: writers, designers");
                        tempFileContent = addLine(tempFileContent, 2, "  platform: all");
                        tempFileContent = addLine(tempFileContent, 2, "  product: all");
                        tempFileContent = addLine(tempFileContent, 2, "  version: all");
                        tempFileContent = addLine(tempFileContent, 2, "  output: web");
                        tempFileContent = addLine(tempFileContent, 2, "  type: frontmatter");

                        menu[pagesDetail.parentMenu][pagesDetail.title] = tempFileContent;
                    }
                    else {
                        console.log("can't find page for " + interestinPathPart)
                    }
                }
                return gulp.src(srcPattern)
            }
        ));
});

gulp.task('save menu', ['concat sidebar'], function () {
    finalFileContent = addHeader();

    // iterate over keys to keep original order
    for (var k in pageOrder) {
        currentKey = pageOrder[k];
        currentParent = currentKey.parentMenu;
        currentTitle = currentKey.title;
        console.log("KEY", currentKey);

        finalFileContent += menu[currentParent][currentTitle];
    }


})

gulp.task('sidebar', ['save menu'], function () {
    return file('mydoc_sidebar.yml', finalFileContent, {src: true}).pipe(gulp.dest("_data/mydoc/"));
});


var addLine = function (string, tabIndex, content) {
    tempLine = ""
    for (v = 0; v < tabIndex; v++) {
        tempLine += "  ";
    }

    tempLine += content;
    tempLine += "\n";

    string += tempLine;
    //console.log(string.length);
    return string;
}

var arrangeTitle = function (filename) {
    var res = [];
    nextUpper = false;
    for (i = 0; i < filename.length; i++) {

        current = filename[i];

        if (i == 0) {
            res.push(current.toUpperCase());
            continue;
        }

        if (nextUpper) {
            res.push(current.toUpperCase());
            continue;
        }

        if (current == '_') {
            res.push(' ');
            nextUpper = true;
            continue;
        }

        res.push(current);
    }

    return res.join('');
}

var addHeader = function () {

    var str =
            "# This is your sidebar TOC. The sidebar code loops through sections here and provides the appropriate formatting.\n" +
            "\n" +
            "# Sidebar\n" +
            "entries:\n" +
            "- title: Sidebar\n" +
            "  subcategories:\n" +
            "  - title:\n" +
            "    audience: writers, designers\n" +
            "    platform: all\n" +
            "    product: all\n" +
            "    version: all\n" +
            "    output: pdf\n" +
            "    type: frontmatter\n" +
            "    items:\n" +
            "    - title:\n" +
            "      url: /titlepage.html\n" +
            "      audience: writers, designers\n" +
            "      platform: all\n" +
            "      product: all\n" +
            "      version: all\n" +
            "      output: pdf\n" +
            "      type: frontmatter\n" +
            "    - title:\n" +
            "      url: /tocpage.html\n" +
            "      audience: writers, designers\n" +
            "      platform: all\n" +
            "      product: all\n" +
            "      version: all\n" +
            "      output: pdf\n" +
            "      type: frontmatter\n"

        ;

    return str;
}

var findTitlesInMarkdownFile = function (filename) {
    var titles = [];
    var array = fs.readFileSync(filename).toString().split("\n");
    for (line in array) {
        if (line.indexOf('#') == 0) { // mean startWith
            titles.push(line.slice(1));
        }
    }

    return titles;
}

var readPagesFromConfig = function (filename) {
    var text = fs.readFileSync(filename).toString();

    if (isWin) {
        console.log("isWin");
        text = text.replace(/\//g, '\\');
    }

    array = text.split("\n");
    pagesTagFound = false;

    pages = new Array();
    for (i in array) {
        line = array[i];
        if (line.indexOf('pages:') == 0) { // mean startWith
            pagesTagFound = true;
            continue;
        }

        if (pagesTagFound) {
            // pages line example: 3 parts - ['getting_started/index.md', 'Getting Started', 'Introduction']
            //                     2 parts - ['index.md', 'Backand Documentation']

            // clean line
            l1 = line.replace(/('|]|-|\[)/g, '')
            l1 = l1.split(',');

            if (l1.length == 2) { // two parts
                pages[l1[0].trim().toLowerCase()] = {'parentMenu': '', 'title': l1[1].replace(' ', ''), 'url': '/'}; // remove first space char
                pageOrder.push({'parentMenu': '', 'title': l1[1].replace(' ', '')});

            }
            else if (l1.length == 3) {

                var key = l1[1].replace(' ', '');
                console.log("insert", l1[0].trim().toLowerCase());

                pages[l1[0].trim().toLowerCase()] = {
                    'parentMenu': key,
                    'title': l1[2].trimLeft(),
                    'url': baseUrl + "/en/latest/" + l1[0].trim().toLowerCase().replace(".md", ".html")

                };

                pageOrder.push({
                    'parentMenu': key,
                    'title': l1[2].trimLeft()
                });
            }
        }
    }

    // console.log(pages);
    return pages;
}
