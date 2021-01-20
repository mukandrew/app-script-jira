const jiraPageEndpoint = 'https://<project-name>.atlassian.net';
const username = 'YOUR JIRA EMAIL';
const jiraToken = 'YOUR JIRA TOKEN';
const projectKey = 'PROJECT KEY';
const issueTypeKey = 'ISSUE KEY';
const storyPtsKey = 'STORY POINT NAME'

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('Jira Integration')
        .addItem('Create issues', 'showPrompt')
        .addToUi();
}

function showPrompt() {
    var ui = SpreadsheetApp.getUi(); // Same variations.

    var result = ui.prompt(
        'Ok, let\'s do it',
        'Please enter the sheet name:',
        ui.ButtonSet.OK_CANCEL);

    // Process the user's response.
    var button = result.getSelectedButton();
    var sheetName = result.getResponseText();
    if (button == ui.Button.OK) {
        showAlert(sheetName)
    }
}

function showAlert(sheetName) {
    var ui = SpreadsheetApp.getUi();

    var result = ui.alert(
        'Please confirm',
        'Are you sure you want to continue and upload the sheet "' + sheetName + '"?',
        ui.ButtonSet.YES_NO);

    if (result == ui.Button.YES) {
        handler(sheetName)
    }
}

const Project = function () {
    this.key = projectKey;
}

const ParentKey = function (key) {
    this.key = key
}

// Check in your project, some project is (Sub-task, Bug, Epic)
const IssueType = function () {
    this.key = issueTypeKey;
}

const Issue = function (parentKey, summary, storyPts, description, labels) {
    this.summary = summary;
    this.project = new Project();
    this.parent = new ParentKey(parentKey);
    this.issuetype = new IssueType();
    this.description = description;
    this.labels = labels.split(",");
    this[storyPtsKey] = parseInt(storyPts)
}

const BodyRequest = function (fields) {
    this.update = {};
    this.fields = fields;
}

function createIssue(payload) {
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Basic " + Utilities.base64Encode(username + ":" + jiraToken)
    };

    const options = {
        'method': 'post',
        'headers': headers,
        'payload': JSON.stringify(new BodyRequest(payload))
    };
    Logger.log(options.payload);
    try {
        var response = UrlFetchApp.fetch(jiraPageEndpoint + '/rest/api/2/issue', options);
        var responseJSON = JSON.parse(response.getContentText());
        return responseJSON
    } catch (e) {
        return { key: 'Error', self: e.message }
    }
}

// The sheet needs to be the
function handler(sheetName) {
    const parentKeyIndex = 0
    const summaryIndex = 2
    const storyPtsIndex = 3
    const descriptionIndex = 4
    const labelsIndex = 5
    const ignoreIndex = 6

    const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadSheet.getSheetByName(sheetName);

    for (var row = 2; row <= sheet.getMaxRows(); row++) {
        var values = sheet.getRange(row, 1, 1, 7).getValues()[0];
        if (values[ignoreIndex] == false) {
            var issue = new Issue(values[parentKeyIndex], values[summaryIndex], values[storyPtsIndex], values[descriptionIndex], values[labelsIndex]);
            var response = createIssue(issue);
            if (response.key != 'Error') {
                sheet.getRange(row, 7).setValue(true)
                sheet.getRange(row, 9).setValue(jiraPageEndpoint + 'browse/' + response.key);
            } else {
                sheet.getRange(row, 9).setValue(response.self);
            }
            sheet.getRange(row, 8).setValue(response.key);
        }
    }
}
