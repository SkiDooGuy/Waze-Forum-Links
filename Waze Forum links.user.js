// ==UserScript==
// @name            Waze Forum links
// @namespace       https://github.com/WazeDev/
// @version         2021.10.28.01
// @description     Add profile and beta links in Waze forum
// @author          WazeDev
// @contributor     crazycaveman
// @contributionURL https://github.com/WazeDev/Thank-The-Authors
// @include         https://www.waze.com/forum/
// @include         /^https:\/\/.*\.waze\.com\/forum\/*/
// @grant           none
// @require         https://code.jquery.com/jquery-2.2.4.min.js
// @noframes
// ==/UserScript==

/* global $ */

(function () {
    'use strict';

    var settings = {};
    const settingsKey = 'WFL_settings';
    const cl = {
        e: 1,
        error: 1,
        w: 2,
        warn: 2,
        i: 3,
        info: 3,
        d: 4,
        debug: 4,
        l: 0,
        log: 0,
    };

    function log(message, level = 0) {
        switch (level) {
        case 1:
        case 'error':
            console.error('WFL: ', message);
            break;
        case 2:
        case 'warn':
            console.warn('WFL: ', message);
            break;
        case 3:
        case 'info':
            console.info('WFL: ', message);
            break;
        case 4:
        case 'debug':
            console.debug('WFL: ', message);
            break;
        default:
            console.log('WFL: ', message);
        }
    }

    function saveSettings() {
        if (!localStorage) {
            return;
        }
        localStorage.setItem(settingsKey, JSON.stringify(settings));
    }

    function loadSettings() {
        let defaults = {
            beta: { value: false, updated: 0 },
            hash: ''
        };
        if (!localStorage) {
            return;
        }
        if (Object.prototype.hasOwnProperty.call(localStorage, settingsKey)) {
            settings = JSON.parse(localStorage.getItem(settingsKey));
        } else {
            settings = defaults;
        }
        Object.keys(defaults).forEach((prop) => {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)
            && !Object.prototype.hasOwnProperty.call(settings, prop)) {
                settings[prop] = defaults[prop];
            }
        });
    }

    function betaLinks() {
        log('Adding beta links', cl.i);
        let links = $("div.page-body a[href*='/editor']").filter(function(i, elem) {
            return $(this).attr('href').match(/^https:\/\/(www\.)?waze\.com\/(?!user\/)(.{2,6}\/)?editor/);
        });
        links.each((i, elem) => {
            let url = $(elem).attr('href');
            let WMEbURL = url.replace(/(www\.)?waze\.com/, 'beta.waze.com');
            let WMEbAnchor = ` (<a target="_blank" class="postlink" href="${WMEbURL}">&beta;</a>)`;
            $(elem).after(WMEbAnchor);
        });
    }

    function checkBetaUser() {
        let betaUser = false;
        let d = new Date();
        if (settings.beta.value) {
            log('Beta status stored', cl.d);
            betaLinks();
        } else if (parseInt(settings.beta.updated, 10) + 7
                < parseInt(d.getFullYear() + (`0${d.getMonth()}`).slice(-2) + (`0${d.getDate()}`).slice(-2), 10)) {
            let ifrm = $('<iframe>').attr('id', 'WUP_frame').hide();
            ifrm.load((event) => { // What to do once the iframe has loaded
                log('iframe loaded', cl.d);
                let memberships = $(event.currentTarget).contents().find('form#ucp section:first ul.cplist a.forumtitle').text();
                betaUser = memberships.indexOf('WME beta testers') >= 0;
                log(`isBetaUser: ${betaUser}`, cl.d);
                betaUser && betaLinks();
                settings.beta = {
                    value: betaUser,
                    updated: d.getFullYear() + (`0${d.getMonth()}`).slice(-2) + (`0${d.getDate()}`).slice(-2),
                };
                //$(this).remove(); //Remove frame
                saveSettings();
            });
            ifrm.attr('src', 'ucp.php?i=groups');
            $('body').append(ifrm);
        }
    }

    function WMEProfiles() {
        log('Adding editor profile links', cl.i);
        let links = $("div.author a[href*='memberlist.php'], dl.postprofile dt a[href*='memberlist.php']"); //Post authors
        if (links.length === 0) {
            links = $("li.row a[href*='memberlist.php']"); //Topic lists
        }
        if (links.length === 0) {
            links = $("table.table1 tbody a[href*='memberlist.php']"); //Group member lists
        }
        if (links.length === 0) {
            links = $('div.memberlist-title'); //Single user forum profile
        }
        links.each((i, elem) => {
            let username = $(elem).text();
            let profileURL = ` (<a target="_blank" href="https://www.waze.com/user/editor/${username}">P</a>)`;
            $(elem).after(profileURL);
        });
    }

    function SDGNewForumFixes() {
         /****** DISPLAY NOTIFICATIONS ICON/NUMBER IN PAGE HEADER ******/

        // Create wrapper in header
        const FLWrapper = `<div id='FL-Wrapper'></div>`;
        $('#control_bar_handler > div.header-waze-wrapper > wz-header > wz-header-user-panel').prepend(FLWrapper);

        // Create notification icon in header
        const numNotifications = $('#control_bar_handler > div.header-waze-wrapper > wz-header > wz-header-user-panel > wz-user-box > wz-menu-item:nth-child(4) > a > strong').text();
        if (parseInt(numNotifications) > 0) {
            $('#FL-Wrapper').prepend(
                `<span id='FL-Notifications'><a href='https://www.waze.com/forum/ucp.php?i=ucp_notifications' style='text-decoration:none;color:black;'>${numNotifications}</a></span>`
            );
            $('#FL-Notifications').css({
                'float': 'left',
                'margin-right': '80px',
                'padding': '0px 10px',
                'border': '2px solid black',
                'border-radius': '50%',
                'background-color': '#33ccff',
                'font-size': '18px'
            });
            $('#FL-Notifications > a').css({ 'color': 'white' });
        }

         /****** ADD/FIX ITEMS IN HEADER DROP DOWN ******/
        // Change My Posts link to display topics (same as View Your Posts in old forum)
        $('#control_bar_handler > div.header-waze-wrapper > wz-header > wz-header-user-panel > wz-user-box > wz-menu-item:nth-child(5) > a').attr('href', 'https://www.waze.com/forum/search.php?author_id=16831039&sr=topics');

        // Re-enable memberlist button in dropdown
        const $MemberList =
            `<wz-menu-item >
                <a class="no-blue-link" href="./memberlist.php" title="Members" role="menuitem">
                    <i class="icon fa-group fa-fw"></i><span>Members</span>
                </a>
            </wz-menu-item>`;
        $('#control_bar_handler > div.header-waze-wrapper > wz-header > wz-header-user-panel > wz-user-box > wz-menu-item:nth-child(6)').after($MemberList);
        $("#control_bar_handler > div.header-waze-wrapper > wz-header > wz-header-user-panel > wz-user-box > wz-menu-item:nth-child(8) > a").click(function() {
            window.location = './memberlist.php';
        });

        // Add link to usergroups page to dropdown
        const $UserGroups =
            `<wz-menu-item >
                <a class="no-blue-link" href="https://www.waze.com/forum/ucp.php?i=167" title="Usergroups" role="menuitem">
                    <i class="icon fa-group fa-fw"></i><span>Usergroups</span>
                </a>
            </wz-menu-item>`;
        $('#control_bar_handler > div.header-waze-wrapper > wz-header > wz-header-user-panel > wz-user-box > wz-menu-item:nth-child(6)').after($UserGroups);
        $("#control_bar_handler > div.header-waze-wrapper > wz-header > wz-header-user-panel > wz-user-box > wz-menu-item:nth-child(7) > a").click(function() {
            window.location = 'https://www.waze.com/forum/ucp.php?i=167';
        });

        /****** USER PROFILE PAGE ELEMENT FIXES AND ADDTITIONS ******/

        // Move link to PM a user to the top left of the user page
        let $newli = $('#page-body > main > aside > ul > li:nth-child(2)').clone();
        $($newli.children()[0]).prop('href', $('#viewprofile > section:nth-child(1) > div:nth-child(14) > div > div:nth-child(2) > span:nth-child(2) > a').prop('href'));
        $($newli.find('i')[0]).removeClass('w-icon w-icon-error ').addClass('w-icon w-icon-inbox');
        $($newli.find('span')[0]).text('Send PM');
        $($newli.find('span')[0]).css('padding-left', '5px');
        $('#page-body > main > aside > ul').prepend($newli);

        // Change the usergroup list to a select again...
        $('#members-groups-list').hide();
        $('#users-group-links').css('display', 'inline-block');
        $('#users-group-links > wz-select').css('display', 'inline-block');
        $('#users-group-links > button').css('display', 'inline-block');
        $('#users-group-links > button').text('Go');
        $('#users-group-links > wz-select').css('width', '250px')

        $('#viewprofile > section > div.bg2 > div > div > span:nth-child(2)').css('margin-right', '10px');
        $('.mx-1.d-inline-block').css('margin', '0 5px 0 5px');

        /****** UCP PRIVATE MESSAGES TAB FIXES ******/
        // Fix spacing in the inbox
        $('#viewfolder > section > div.waze-table-wrp > ul > li > dl > div > div').css('display', 'inline-block');
        $('#viewfolder > section > div.waze-table-wrp > ul > li > dl > div > div > a').css('padding', '0 5px');
        $('#viewfolder > section > div.waze-table-wrp > ul > li > dl > div.marked.ml-auto.mr-4.cursor-pointer.marked-msg-as-important-js').css('display', 'none');
        $('#viewfolder > section > div.waze-table-wrp > ul > li > dl').css('justify-content', 'space-between');

        // Fix spacing when reading a message
        $('#viewfolder > section > div.bg-gray-100.rounded.pa-4.mb-6.pm.has-profile > div').css('align-items', 'normal');
        $('#viewfolder > section > div.bg-gray-100.rounded.pa-4.mb-6.pm.has-profile > div > div.postbody > div.row-wrp > ul > li').css('padding', '0 2px');
        $('#viewfolder > section > div.bg-gray-100.rounded.pa-4.mb-6.pm.has-profile > div > div.postbody > div.content').css({
            'margin-top': '10px',
            'padding': '15px 0',
            'border-bottom': '1px solid #d5d7db'
        });
        $('#viewfolder > section > div.bg-gray-100.rounded.pa-4.mb-6.pm.has-profile > div > div.postbody > div.signature').css('margin-top', '0');
        $('#viewfolder > section > div.bg-gray-100.rounded.pa-4.mb-6.pm.has-profile > div > div.bl.ml-4.pl-4.border-gray-300.wz-forums-grey-800.caption').css('border', 'none');
        $('#viewfolder > section > div.bg-gray-100.rounded.pa-4.mb-6.pm.has-profile > div > div.bl.ml-4.pl-4.border-gray-300.wz-forums-grey-800.caption > div.has-profile-rank.no-avatar').css('margin-bottom', '5px');

        // Composing a PM
        $('#pmheader-postingbox > section > div.column2').css('display', 'none');
        $('#pmheader-postingbox > section > div.column1').css('width', '50%');
        $('#pmheader-postingbox > section > div:nth-child(2) > dl > dt').css({'width': '50%', 'display': 'inline-block', 'float': 'left'});
        $('#pmheader-postingbox > section > div:nth-child(2) > dl > dd').css({'flex-direction': 'column', 'padding': '25px 0 0 20px'});
        $('#pmheader-postingbox > section > div:nth-child(2) > dl > dd > div').css({'align-items': 'flex-start', 'flex-direction': 'column'});

        /****** UCP USERGROUP TAB FIXES ******/

        // Fix the select when managing groups
        const userSelect = $('#page-header > fieldset.display-actions > select').get();
        $(userSelect).append($('<option>', {
            value: 'default',
            text: 'Make group default for member'
        }));
        $(userSelect).append($('<option>', {
            value: 'approve',
            text: 'Approve member'
        }));
        $(userSelect).append($('<option>', {
            value: 'deleteusers',
            text: 'Remove member from group'
        }));

        // Adjust some spacing around the manage groups action area
        $('#page-header > fieldset.display-actions').css('margin-bottom', '10px');
        $('#page-header > fieldset.display-actions > select').css('margin-right', '20px');
        $('#page-header > fieldset.display-actions > div').css('display', 'inline-block');
        $('#page-header > fieldset.display-actions > div > a').css('padding', '0 5px 0 5px');
        $('#usernames').css('border', '1px solid');

        // Fix spacing of text for usergroup descriptions and types
        $('#cp-main').css('max-width', '90%');
        $('.groups-row-wrp').css({
            'width': '80%'
        });
        $('.groups-row-wrp > div > span').css({
            'display': 'block'
        });
        $('.row-wrp > wz-radio-button > span').css({
            'display': 'block'
        });

        /****** UCP NOTIFICATIONS TAB FIXES ******/

        // Move 'New' icon to front of text in notification page
        $("#ucp > section > div.notifications-list > ul.cplist.two-columns > li > div.ml-6 > a > div > wz-badge").each(function() {
            $(this).parent().prepend(this);
        });
        $('#ucp > section > div.action-bar.bar-bottom.d-flex.justify-space-between.align-center > div > ul').css('list-style', 'none !important');
        $('#ucp > section > div.action-bar.bar-bottom.d-flex.justify-space-between.align-center > div > ul > li').css({
            'display': 'inline-block',
            'vertical-align': 'middle',
            'line-height': 'normal',
            'padding': '5px 3px 5px 0',
            'font-size': '12px'
        });

        // Clean up some display issues
        $('#ucp > section > div.action-bar.bar-bottom.d-flex.justify-space-between.align-center > div > ul > li.active').css({'color': '#09f', 'font-weight': '400', 'line-height': '1.4'});
        $('#ucp > section > div.action-bar.bar-bottom.d-flex.justify-space-between.align-center > div > ul > li > a').css('padding', '0');
        $('#ucp > section > div.action-bar.bar-bottom.d-flex.justify-space-between.align-center > div > ul > li.arrow.previous > a > i').css({'color': '#09f', 'font-size': '12px'});

        /****** MODERATOR TOOL FIXES ******/

        // Put the "leave shadow topic" and "lock topic" options back on the move topic page
        $('fieldset dd').css('margin-left', '5%');
        $('dd label').css('white-space', 'normal');

        // Remove excess space in post actions menu for moderator functions
        $('.post-buttons .dropdown a').css({
            'margin-bottom': '0px',
            'padding-left': '0px'
        });
        $('.dropdown-contents a, .dropdown-contents').css('padding-left', '10px');
        $('#phpbb .postbody .post-buttons .dropdown-container .dropdown-contents li').css('padding-left', '5px');
        $('.dropdown-contents a, .dropdown-contents li.dropdown-label').css('padding', '10px 10px 10px 0px');

        // Main
        $('#cp-main.cp-main.mcp-main.panel-container > form').css('margin-left', '10px');
        $('#cp-main.cp-main.mcp-main.panel-container > div').css('margin-left', '10px');

        // Reported Messages tab
        $('#mcp > div').css('margin-left', '10%');

        // Clean up User Notes tab
        $('#mcp > div').css('margin-left', '10px');
        $('#mcp > div > div > fieldset > dl > dd:nth-child(2)').css('width', '50%');
        $('#mcp > div > div > fieldset > dl > dd:nth-child(3)').css('width', '15%');

        // Clean up the Moderator Logs tab
        $('#mcp > div > div > div.action-bar.bar-top').css({'display': 'block', 'margin-bottom': '10px'});
        $('#mcp > div > div > div.action-bar.bar-top > input.inputbox.autowidth').css({'margin': '0 5px', 'border': '1px solid grey'});
        /****** MARK FORUMS READ ******/
        const HOST = window.location.href;
        const MARKREAD = `<h5 class='forum-section-title wz-forums-grey-700'><a id='WFL-MarkRead' style='color:#55595e;'>Mark All Subforums Read</a></h5>`;
        const MARKREAD1 = `<h5 class='forum-section-title wz-forums-grey-700'><a id='WFL-MarkRead1' style='color:#55595e;'>Mark Waze Products Forums Read</a></h5>`;
        const MARKREAD2 = `<h5 class='forum-section-title wz-forums-grey-700'><a id='WFL-MarkRead2' style='color:#55595e;'>Mark Community Forums Read</a></h5>`;
        const MARKREAD3 = `<h5 class='forum-section-title wz-forums-grey-700'><a id='WFL-MarkRead3' style='color:#55595e;'>Mark Formal Mentoring Forums Read</a></h5>`;
        let forumList = $('.row-wrp.forum-section-title-wrp').get();
        let time = `mark_time=${Date.now()}`;
        let hash, forum;

        if (settings.hash || (!settings.hash && HOST.search(/(f=[0-9]{1,3})/) !== -1)) {
            $(forumList[0]).append(MARKREAD);
            $(forumList[1]).append(MARKREAD1);
            $(forumList[2]).append(MARKREAD2);
            $(forumList[3]).append(MARKREAD3);

            let topicLink = $('.mark-read').prop('href') ? $('.mark-read').prop('href') : HOST;
            let temp = topicLink.replace("?", "&");
            let temp2 = temp.split("&");

            for (let k = 0; k < temp2.length; k++) {
                if (temp2[k].includes("hash=")) hash = temp2[k];
                if (temp2[k].includes("f=")) forum = temp2[k];
            }

            if (settings.hash !== hash && hash) { // jm6087 - flipped these if statements
                settings.hash = hash;
                saveSettings();
            } else if (settings.hash) {
                hash = settings.hash;
            }
            if (hash != null) { //jm6087
            if (!forum) forum = '';

            let newURL = `https://www.waze.com/forum/viewforum.php?${hash}&${forum}&mark=forums&${time}`;
            let newURL1 = `https://www.waze.com/forum/viewforum.php?${hash}&f=659&mark=forums&${time}`;
            let newURL2 = `https://www.waze.com/forum/viewforum.php?${hash}&f=663&mark=forums&${time}`;
            let newURL3 = `https://www.waze.com/forum/viewforum.php?${hash}&f=1155&mark=forums&${time}`;
            $('#WFL-MarkRead').prop('href', newURL);
            $('#WFL-MarkRead1').prop('href', newURL1);
            $('#WFL-MarkRead2').prop('href', newURL2);
            $('#WFL-MarkRead3').prop('href', newURL3);
        } else document.querySelector("#WFL-MarkRead").style="display: none"; // jm6087
        }
    }

    function main(tries = 1) {
        if (tries >= 10) {
            log('Giving up on loading', cl.w);
            return;
        } else if (!($ && document.readyState === 'complete')) {
            log('Document not ready, waiting', cl.d);
            setTimeout(main, 500, tries + 1);
            return;
        }
        console.group('WMEFL');
        log('Loading', cl.i);
        loadSettings();
        WMEProfiles();
        checkBetaUser();
        SDGNewForumFixes();
        log('Done', cl.i);
        console.groupEnd('WMEFL');
    }

    main();
}());

