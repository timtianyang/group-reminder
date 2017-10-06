var admin_num = "4128185379";
var group_leader_num;
var group_leader_name;
var group_name = "GanEn";
var spreadsheetId = '15CNzyZeTPH8RVHXPBhaMFlm6gpCez1_pddDQkyk9OwA';
var global_enable = 0;
var songs_msg = "Please remember to prepare worship songs this week";
var bible_msg = "Please remember to prepare to lead bible study this week";
var snack_msg = "Please remember to prepare snacks and drinks this week";
var food_msg = "Please remember to get food from Church this week";
var sms_url = "";
var secret = "";

function sendText(msg, phone_num) {
    var url = sms_url;
    var options = {
        "method": "post",
        "headers": {
            "Authorization": "Basic " + Utilities.base64Encode(secret)
        },
        "payload": {
            "From": "+14123123652",
            "To": phone_num,
            "Body": msg
        }
    };
    var response = UrlFetchApp.fetch(url, options);
}

/* 
 * Find a row entry by a target date in sheet '周五服侍安排'
 * ret 2: friday canceled
 *     1: date not found
 */
function find_entry_by_date(date) {
    var rangeName = '周五服侍安排!A2:F';
    var values = Sheets.Spreadsheets.Values.get(spreadsheetId, rangeName).values;
    for (var row = 0; row < values.length; row++) {
        var d_iter = new Date(values[row][1]);

        /* Ignores non-date values */
        if (!isNaN(d_iter.getTime())) {
            if (d_iter.getTime() == date.getTime()) {
                //Logger.log("found " + (date.getMonth() + 1) + "/" + date.getDate());
                if ( values[row][3] === undefined || values[row][4] === undefined )
                  return 2;
                return values[row];
            } else if (d_iter.getTime() > date.getTime()) {
                //Logger.log("found something bigger " + values[row][1] + "  " + (d_iter.getMonth() + 1) + "/" + d_iter.getDate() + " instead of " + (date.getMonth() + 1) + "/" + date.getDate())
                return 1;
            }
            //Logger.log(d_iter.getTime() + " " + date.getTime())
        } else
            Logger.log("skip: not a date " + values[row][1]);
    }
    Logger.log("searched through entire list and not found");
    return 1;
}

/* 
 * Find a phone number by a target date in sheet '基督徒联系方式'
 * Assume Column C contains cell numbers.
 * Assume Column A contains names.
 */
function look_up_number(name) {
    var rangeName = '基督徒联系方式!A1:C';
    var values = Sheets.Spreadsheets.Values.get(spreadsheetId, rangeName).values;
    if (!values) {
        Logger.log('No names found.');
    } else {
        for (var row = 0; row < values.length; row++)
            if (values[row][0] == name)
                return values[row][2];
    }
    return 0;
}

function notify_all(dateString, song_person, song_num, bible_person, bible_num, snack_person, snack_num, food_person, food_num) {
    var s = dateString + "- " + song_person + ":" + song_num + " " + bible_person + ":" + bible_num + " " + snack_person +": " + snack_num + " " +food_person + ":" + food_num;
    Logger.log(s);

    if (song_num == 0 || bible_num == 0 || food_num == 0) {
        sendText("phone number missing " + s, admin_num)
        //sendText("phone number missing " + s, group_leader_num)
    }

    var ending = " -- sent from UC Group " + group_name + " with Love";

    if (song_num != 0)
        sendText(song_person + ": " + songs_msg + "   " + dateString + ending, song_num);
    if (bible_num != 0)
        sendText(bible_person + ": " + bible_msg + "   " + dateString + ending, bible_num);
    if (snack_num != 0)
        sendText(snack_person + ": " + snack_msg + "   " + dateString + ending, snack_num);
    if (food_num != 0)
        sendText(food_person + ": " + food_msg + "   " + dateString + ending, food_num);
}

function populate_globals() {
    var rangeName = 'Automation!A2:B';
    var values = Sheets.Spreadsheets.Values.get(spreadsheetId, rangeName).values;
    if (!values) {
        Logger.log('No names found.');
    } else {
        for (var row = 0; row < values.length; row++) {
            switch (values[row][0]) {
                case "Group Name":
                    group_name = values[row][1]; continue;
                case "Group Leader":
                    group_leader_name = values[row][1]; continue;
                case "Leader Phone":
                    group_leader_num = values[row][1]; continue;
                case "Automation Dev Phone":
                    admin_num = values[row][1]; continue;
                case "Automation Enable Switch":
                    global_enable = values[row][1]; continue;
                case "诗歌敬拜msg":
                    songs_msg = values[row][1]; continue;
                case "带领查经msg":
                    bible_msg = values[row][1]; continue;
                case "水果零食msg":
                    snack_msg = values[row][1]; continue;
                case "拿饭司机msg":
                    food_msg = values[row][1]; continue;
            }
        }
    }
    //Logger.log(group_name + "," + group_leader_name + "," + group_leader_num + "," + admin_num + "," + global_enable + "," + songs_msg + "," + bible_msg + "," + food_msg)
}

function doGet() {
    var target_dat = new Date();
    var numberOfDaysToAdd = 1;
    target_dat.setDate(target_dat.getDate() + numberOfDaysToAdd)
    target_dat.setHours(0, 0, 0, 0) /* easier for comp later */

    var dateString = (target_dat.getMonth() + 1) + "/" + target_dat.getDate() + "/" + target_dat.getYear();
    textOutput = ContentService.createTextOutput(dateString);
    Logger.log(dateString);

    populate_globals();
  
    if (!global_enable)
        return;
  
    var entry = find_entry_by_date(target_dat);
    if ( entry == 1 ) {
        Logger.log("Entry " + dateString + " doesn't exist!")
        sendText("Entry " + dateString + " doesn't exist!", admin_num)
    } else if ( entry == 2 ) {
        Logger.log("Friday canceled")
        /* friday canceled */
        return;
    } else {
        var song_person = entry[2];
        var bible_person = entry[3];
        var snack_person = entry[4];
        var food_person = entry[5];
        
        var song_num = look_up_number(song_person);
        var bible_num = look_up_number(bible_person);
        var snack_num = look_up_number(snack_person);
        var food_num = look_up_number(food_person);
        notify_all(dateString, song_person, song_num, bible_person, bible_num, snack_person, snack_num, food_person, food_num)
        //notify_all(dateString, song_person, admin_num, bible_person, admin_num, snack_person, admin_num, food_person, admin_num)
    }
}
