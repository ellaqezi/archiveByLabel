const DEFAULTS = {
    'label': "important",
    'query': "label:important",
    'user_id': Session.getActiveUser().getEmail(),
    'tz': Session.getScriptTimeZone(),
    'standardize': "true"
}

function archiveByLabel(input) {
    var label = DEFAULTS.label;
    var query = DEFAULTS.query;
    var userId = DEFAULTS.user_id;
    if (input) {
        label = input.label;
        query = input.query;
        userId = input.user_id;
    }
    var results = Gmail.Users.Messages.list(userId, {q: query});
    var archived = [];
    if (typeof (results.messages) === "undefined") {
        return "No results for query [ (q) ].".replace("(q)", query);
    } else {
        var folder = archiveDirectory(label);
        results.messages.forEach(function (m) {
            var msg = GmailApp.getMessageById(m.id);
            msg.getAttachments().forEach(function (a) {
                var fileName = a.getName();
                fileName = saveAttachmentToFolder(folder, a, fileName, msg.getDate(), input.tz);
                archived.push(fileName);
            });
        });
    }
    return "%d files archived.".replace("%d", archived.length);
}

function archiveDirectory(label = DEFAULTS.label) {
    var path = label.split("/");
    var folderId;
    var current;
    path.forEach(function (subdir) {
        if (typeof (folderId) === "undefined") {
            current = DriveApp.getFoldersByName(subdir);
        } else {
            current = DriveApp.getFolderById(folderId).getFoldersByName(subdir);
        }
        if (current.hasNext()) {
            folderId = current.next().getId();
            Logger.log(subdir);
        } else if (typeof (folderId) === "undefined") {
            Logger.log("creating in root: " + subdir)
            folderId = DriveApp.createFolder(subdir).getId();
        } else {
            Logger.log("creating in directory [%s]: ".replace("%s", DriveApp.getFolderById(folderId).getName()) + subdir)
            folderId = DriveApp.getFolderById(folderId).createFolder(subdir).getId();
        }
    });
    Logger.log("%d: %f".replace("%d", DriveApp.getFolderById(folderId).getName()).replace("%f", folderId))
    return DriveApp.getFolderById(folderId);
}

function standardizeName(attachment, date = new Date(), timezone = DEFAULTS.tz) {
    Logger.log(date.toString() + " >> (tz)".replace("tz", timezone));
    var ts = Utilities.formatDate(date, timezone, "yyyyMMddHHmmss");
    var fileName = ts + "-" + attachment.getName().replaceAll(/[^A-Za-z0-9.]+/g, "_");
    return fileName;
}

function saveAttachmentToFolder(folder, attachment, fileName, date, timezone) {
    if (timezone) {
        fileName = standardizeName(attachment, date, timezone);
    }
    Logger.log(fileName);
    folder.createFile(attachment.copyBlob()).setName(fileName);
    return fileName;
}