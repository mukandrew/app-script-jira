# App Script - Jira

An script to automatizate the tasks upload

## How to use
- Create a sheet with sequence columns
    - Parent Id
	- Story (its not used)
	- Summary
	- Story Points
	- Description
	- Labels
	- Ignore (used for script to upload or not this row)
	- ID (dont fill this field, its filled after upload by script)
	- Link (dont fill this field, its filled after upload by script)

In the script, line 96 to 101 has index for every column used. If you want create your own sheet with custom columns, change it.

### Inserting the script in Google Sheet
- In the toolbar menu, click in "Tools">"Script Editor"
- In the new tab opened, paste the script (app-script.gs) and save
- Change the const in the script to use your configurations
	- `const jiraPageEndpoint = https://<project-name>.atlassian.net;`
	- `const username = 'YOUR JIRA EMAIL';`
		- Email used to sign in Jira
	- `const jiraToken = 'YOUR JIRA TOKEN';`
		- Generate in: Account Settings>Security
	- `const projectKey = 'PROJECT KEY';`
		- Project Key, usually is the letter in task id. e.g: `ABC-1` would be `ABC`
	- `const issueTypeKey = 'ISSUE KEY';`
		- Check in your project or with your SM, what is the key for Sub-task
	- `const storyPtsKey = 'STORY POINT NAME'`
		- The story points field is a custom field, inside Jira in the Advanced Search you will find it
- In the same tab, click in Triggers in the left menu (clock icon)
- Add a new trigger, with config:
	- function to execute: onOpen
	- event source: from sheet
	- event: on open
	- Click Save
- Back to the sheet tab and reload the page

After insert the script and reload the page, will have been added an option in menu called "Jira Integration"

### Using
- Click in Jira Integration>Create issues
- Insert the sheet name which you want to upload
- Confirm if you are sure to upload the sheet
- Wait to script finish and look for ID and Link columns have been filled
