const jiraPageEndpoint = 'https://<project-name>.atlassian.net';
const username = 'YOUR JIRA EMAIL';
const jiraToken = 'YOUR JIRA TOKEN';
const projectKey = 'PROJECT KEY';

const colunmIndexes = {
    parentId: 0,
    story: 1,
    summary: 2,
    storyPoints: 3,
    description: 4,
    labels: 5,
    assignee: 6,
    priority: 7,
    ignore: 8,
    issueId: 9,
    link: 10
};

const maxColunms = 11;

function onOpen() {
    SpreadsheetApp.getUi()
        .createMenu('Jira Integration')
        .addItem('Create issues', 'showPrompt')
        .addToUi();
}

function showPrompt() {
    var ui = SpreadsheetApp.getUi();
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
        ui.ButtonSet.YES_NO
    );

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

const IssueType = function () {
    this.id = "10003";
}

const Issue = function (parentKey, summary, description, labels, project, storyPts, priority, assignee) {
    this.summary = summary;
    this.project = project;
    this.parent = new ParentKey(parentKey);
    this.issuetype = new IssueType();
    this.description = description;
    this.labels = labels.split(",");
    /* this field is a custom field, check in your Jira to get the name in your org */
    this['customfield_10026'] = parseInt(storyPts);
    if (priority.id != '') this.priority = priority;
    if (assignee.accountId != '') this.assignee = assignee;
}

const BodyRequest = function (fields) {
    this.update = {};
    this.fields = fields;
}

const Priority = function (priority, sheet) {
    if (priority == '') {
        this.id = '';
        return;
    }

    for (var row = 2; row <= sheet.getMaxRows(); row++) {
        var values = sheet.getRange(row, 4, 1, 2).getValues()[0];
        if (priority == values[1]) {
            this.id = values[0];
        }
    }
}

const Assignee = function (assignee, sheet) {
    if (assignee == '') {
        this.accountId = '';
        return;
    }

    for (var row = 2; row <= sheet.getMaxRows(); row++) {
        var values = sheet.getRange(row, 1, 1, 2).getValues()[0];
        if (assignee == values[1]) {
            this.accountId = values[0];
        }
    }
}

function createIssue(payload, issueId) {
    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Basic " + Utilities.base64Encode(username + ":" + jiraToken)
    };

    /* if has issue ID inserted in the sheet, this is to update */
    const toUpdated = issueId != ''
    const method = issueId == '' ? 'post' : 'put';

    const options = {
        'method': method,
        'headers': headers,
        'payload': JSON.stringify(new BodyRequest(payload))
    };
    const endpoint = jiraPageEndpoint + '/rest/api/2/issue' + (toUpdated ? ('/' + issueId) : '');

    Logger.log(options.payload);

    try {
        var response = UrlFetchApp.fetch(endpoint, options);
        var responseJSON = toUpdated ? { key: issueId } : JSON.parse(response.getContentText());
        return responseJSON
    } catch (e) {
        return { key: 'Error', self: e.message }
    }
}

function handler(sheetName) {
    const spreadSheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadSheet.getSheetByName(sheetName);
    const dataSheet = spreadSheet.getSheetByName('data');
    const project = new Project();

    var resut = { success: 0, errors: 0 }

    for (var row = 2; row <= sheet.getMaxRows(); row++) {
        var values = sheet.getRange(row, 1, 1, maxColunms).getValues()[0];

        const line = {
            parentId: values[colunmIndexes.parentId],
            story: values[colunmIndexes.story],
            summary: values[colunmIndexes.summary],
            storyPoints: values[colunmIndexes.storyPoints],
            description: values[colunmIndexes.description],
            labels: values[colunmIndexes.labels],
            assignee: values[colunmIndexes.assignee],
            priority: values[colunmIndexes.priority],
            ignore: values[colunmIndexes.ignore],
            issueId: values[colunmIndexes.issueId]
        }

        if (line.ignore == false || (line.ignore == false && line.issueId != '')) {
            var priority = new Priority(line.priority, dataSheet);
            var assignee = new Assignee(line.assignee, dataSheet);
            var issue = new Issue(
                line.parentId,
                line.summary,
                line.description,
                line.labels,
                project,
                line.storyPoints,
                priority,
                assignee
            );

            var response = createIssue(issue, line.issueId);

            if (response.key != 'Error') {
                sheet.getRange(row, colunmIndexes.ignore + 1).setValue(true)
                sheet.getRange(row, colunmIndexes.link + 1).setValue(jiraPageEndpoint + '/browse/' + response.key);
                sheet.getRange(row, colunmIndexes.issueId + 1).setValue(response.key);
                resut.success += 1;
            } else {
                sheet.getRange(row, colunmIndexes.link + 1).setValue(response.self);
                resut.errors += 1;
            }
        }
    }
    spreadSheet.toast('Result: ' + resut.success + ' issues was sent successfully and ' + resut.errors + ' issues had problem sending', 'Finished')
}