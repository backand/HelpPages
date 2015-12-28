var gulp = require('gulp');
var modify = require('gulp-modify');
var util = require('util')
var path = require('path');
var foreach = require('gulp-foreach');
var file = require('gulp-file');
var fs = require('fs');

var baseUrl = "/HelpPages"
var pages = new Array();
gulp.task('default', function () {
    pages = readPagesFromConfig('origin/mkdocs.yml');
    gulp.src('origin/docs/{,*/}*.md')
        .pipe(modify({
            fileModifier: function (file, contents) {
                // #1 add title to every page
                interestinPathPart = file.path.substr(file.path.indexOf('origin/docs') + 12).toLowerCase();
                pagesDetail = pages[interestinPathPart];

                if (pagesDetail !== undefined) {

                    title = pagesDetail.title;
                    header = "---\n" + "title: " + title + "\n---\n"
                    //console.log(file);

                    // #2 change links from .md to .html
                    contents = contents.replace(/.md/g,'/index.html')

                    // #3 replace tab by four spaces
                    contents = contents.replace(/\t/g,'    ')

                    // #4 replace '\' with two '\\'
                    contents = contents.replace(/\\/g,'&#92;')

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

gulp.task('concat sidebar', function (cb) {
    pages = readPagesFromConfig('origin/mkdocs.yml');

    var knownEntries = [''];

    finalFileContent = addHeader();

    return gulp.src('origin/docs/{,*/}*.md')
        .pipe(foreach(function (stream, file) {
                interestinPathPart = file.path.substr(file.path.indexOf('origin/docs') + 12).toLowerCase();
                pagesDetail = pages[interestinPathPart];

                if (pagesDetail !== undefined) {
                    // first time this title appear
                    if (knownEntries.indexOf(pagesDetail.parentMenu) == -1) {
                        knownEntries.push(pagesDetail.parentMenu);

                        console.log(pagesDetail.parentMenu);
                        // add title
                        finalFileContent = addLine(finalFileContent, 0, "");
                        finalFileContent = addLine(finalFileContent, 1, "- title: " + pagesDetail.parentMenu);
                        finalFileContent = addLine(finalFileContent, 1, "  audience: writers, designers");
                        finalFileContent = addLine(finalFileContent, 1, "  platform: all");
                        finalFileContent = addLine(finalFileContent, 1, "  product: all");
                        finalFileContent = addLine(finalFileContent, 1, "  version: all");
                        finalFileContent = addLine(finalFileContent, 1, "  output: web");
                        finalFileContent = addLine(finalFileContent, 1, "  items:");
                    }

                    // var titles =


                     // add second part

                     finalFileContent = addLine(finalFileContent, 2, "- title: " + pagesDetail.title);
                     finalFileContent = addLine(finalFileContent, 2, "  url: " + pagesDetail.url);
                     finalFileContent = addLine(finalFileContent, 2, "  audience: writers, designers");
                     finalFileContent = addLine(finalFileContent, 2, "  platform: all");
                     finalFileContent = addLine(finalFileContent, 2, "  product: all");
                     finalFileContent = addLine(finalFileContent, 2, "  version: all");
                     finalFileContent = addLine(finalFileContent, 2, "  output: web");
                     finalFileContent = addLine(finalFileContent, 2, "  type: frontmatter");
                     //contents.files is an array

                }
                return gulp.src('origin/docs/{,*/}*.md')

            }
        ))


    //.pipe(gulp.dest('dist'));
});

gulp.task('sidebar', ['concat sidebar'], function () {
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
    var array = fs.readFileSync(filename).toString().split("\n");
    pagesTagFound = false;

    pages = new Array();
    for (i in array) {
        line = array[i];
        console.log(line);
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
                pages[l1[0].trim().toLowerCase()] = {'parentMenu' : '' , 'title': l1[1].replace(' ', '')}; // remove first space char

            }
            else if (l1.length == 3) {
                pages[l1[0].trim().toLowerCase()] = {'parentMenu': l1[1].replace(' ', ''), 'title': l1[2].trimLeft(), 'url': baseUrl + "/en/latest/" + l1[0].trim().toLowerCase().replace(".md", ".html") };
            }
        }
    }

    return pages;
}
