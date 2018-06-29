// ==UserScript==
// @name         Waze Forum links
// @namespace    https://github.com/WazeDev/
// @version      1.1b1
// @description  Add profile and beta links in Waze forum
// @author       WazeDev
// @contributor  crazycaveman
// @match        https://www.waze.com/forum/
// @include      /^https:\/\/.*\.waze\.com\/forum\/(?!ucp\.php(?!\?i=(pm|166))).*/
// @grant        none
// @noframes
// ==/UserScript==

/* eslint-env browser, greasemonkey, jquery*/

(function() {
    'use strict';

    var settings = {};
    var settingsKey = "WFL_settings";
    var cl = {
        "e": 1,
        "error": 1,
        "w": 2,
        "warn": 2,
        "i": 3,
        "info": 3,
        "d": 4,
        "debug": 4,
        "l": 0,
        "log": 0
    };

    function log(message, level = 0) {
        switch(level) {
            case 1:
            case "error":
                console.error("WFL: " + message);
                break;
            case 2:
            case "warn":
                console.warn("WFL: " + message);
                break;
            case 3:
            case "info":
                console.info("WFL: " + message);
                break;
            case 4:
            case "debug":
                console.debug("WFL: " + message);
                break;
            default:
                console.log("WFL: " + message);
        }
    }

    function saveSettings() {
        if (!localStorage)
            return;
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    }

    function loadSettings() {
        if (!localStorage)
            return;
        if (localStorage.hasOwnProperty(settingsKey)) {
            settings = JSON.parse(localStorage.getItem(settingsKey));
        } else {
            settings.beta = {value: false, updated: 0};
        }
    }

    function betaLinks() {
        log("Adding beta links",cl.i);
        let links = $("div.content a[href*='/editor']").filter(function() {
            return $(this).attr("href").match(/^https:\/\/www\.waze\.com\/(?!user\/)(.{2,6}\/)?editor/);
        });
        links.each(function() {
            let url = $(this).attr("href");
            let WMEbURL = url.replace("www.","beta.");
            let WMEbAnchor = ` (<a target="_blank" class="postlink" href="${WMEbURL}">&beta;</a>)`;
            $(this).after(WMEbAnchor);
        });
    }

    function checkBetaUser() {
        let betaUser = false;
        let d = new Date();
        if (settings.beta.value) {
            betaLinks();
        }
        else if (parseInt(settings.beta.updated) + 7 < parseInt(d.getFullYear() + ("0" + d.getMonth()).slice(-2) + ("0" + d.getDate()).slice(-2))) {
            let ifrm = $("<iframe>").attr("id","WUP_frame").hide();
            ifrm.load(function() { // What to do once the iframe has loaded
                log("iframe loaded", cl.d);
                let memberships = $(this).contents().find("form#ucp div.inner:first ul.cplist a.forumtitle");
                memberships.each(function() {
                    let group = $(this).text();
                    log(group, cl.d);
                    if (group === "WME beta testers") {
                        betaUser = true;
                        betaLinks();
                        return false; //Force end of each callback
                    }
                });
                log(`isBetaUser: ${betaUser}`,cl.d);
                settings.beta = {value: betaUser, updated: d.getFullYear() + ("0" + d.getMonth()).slice(-2) + ("0" + d.getDate()).slice(-2)};
                //$(this).remove(); //Remove frame
                saveSettings();
            });
            ifrm.attr("src", "ucp.php?i=groups");
            $("body").append(ifrm);
        }
    }

    function WMEProfiles() {
        log("Adding editor profile links",cl.i);
        let links = $("dl.postprofile dt a[href*='memberlist.php']"); //Post authors
        if (links.length === 0) {
            links = $("li.row a[href*='memberlist.php']"); //Topic lists
        }
        if (links.length === 0) {
            links = $("table.table1 a[href*='memberlist.php']"); //Group member lists
        }
        if (links.length === 0) {
            links = $("dl.details dd:first span"); //Single user forum profile
        }
        links.each(function() {
            let username = $(this).text();
            let profileURL = ` (<a target="_blank" href="https://www.waze.com/user/editor/${username}">profile</a>)`;
            $(this).after(profileURL);
        });
    }

    function main() {
        if (!( $ && document.readyState === "complete")) {
            log("Document not ready, waiting",cl.d);
            setTimeout(main,500);
            return;
        }
        console.group("WMEFL");
        log("Loading",cl.i);
        loadSettings();
        WMEProfiles();
        checkBetaUser();
        log("Done",cl.i);
        console.groupEnd("WMEFL");
    }

    setTimeout(main,500);
})();