# GrandRP ACP - Rockstar Social Club Improvements (GRSI)
<p align="center"><img src="Pictures/header.png" alt="header"></p>

## __Features__

### ACP
#### SocialClub
* SocialClubs link to the member search on the Rockstar SocialClub Website (Authorization Logs as well as Player Search)
* Color-Highlight valid/invalid SC Accounts (Authorization Logs as well as Player Search)
* Option: Show SocialClub ID behind SocialClub names
* Context Menu on SocialClub field
	* Trigger a background check
	* Update all SocialClub entries
	* Mark/Unmark SocialClub accounts as known cheater
	* Copy SocialClub Name
	* Copy SocialClub ID
	* Reset All data on a specific SocialClub

#### Money Logs
* Highlight Money transfers over 5 Million
* Add pages to a summary that will show the total amount incoming/outgoing by day in a different tab

#### Organization Logs
* Player and Quantity Filter. This will filter all entries with PlayerID and/or Quantity starting from the current to the "End Page" and display them in a seperate table

#### Authorization Logs
* "Search All" Button to automatically go through and summarize all pages. Will display all different entries in a seperate table

#### All Logs with Pages
* Field to go to desired page
* Search a page by date

### SocialClub Website
* Buttons to manually store if Account is valid or not
* Option: Color Highlight exact matches
* Show SocialClub ID for match
* Option: Show SocialClub ID for all accounts from a search

### Common
* Scroll to top by clicking the russian headlines
* Local storage system using Tampermokeys ```GM_getValue``` and ```GM_setValue``` features
* Import a list of known Cheater SocialClubs seperated by a new line (`\r\n`), as found in Google Docs
* Automatically Process SocialClubs
	* Automatically detect and store searchresults done on the Rockstar members list
	* Option: Close SocialClub website after processing
	* Option: Button to process SC in a sepreate window that closes after processing
	* Option: Button on previously processed SocialClubs


## __Installation__

```GRSI.user.js``` is a [Tampermonkey](https://www.tampermonkey.net/) Skript, currently used and tested with version 4.18.1 on Chrome, although it should work with all other Tampermonkey-supported Browsers as well.

To install it, create a new userscript inside Tampermokey, paste the contents of ```GRSI.user.js```, and enable the script.
Alternatively, the script is hosted on [my Website](https://g.m5.cx/GRSI.user.js). Opening the Link will trigger an installation prompt inside Tampermonkey.

## __Usage__

### __Overall Quality of Life Improvements__
* Scroll to the top by pressing the russian headlines on every page
* Improvements to the page chooser on every page
	* Page Field
	* Date field to search for Date (done through binary search, page will reload multiple times during search until done)
		* Time 0:00: Search for just the date
		*  Time X:00: Search for date and hour
		* Time X:XX: Search for date, hour and minute

![Page Chooser](Pictures/pagination_search_improvements.png?raw=true)

### __SocialClub__

### Autoprocess

**Disclaimer:** Use cauting with Autoprocess. Invalid (red) SocialClubs should always be manually confirmed to avoid false negatives due to being ratelimited by Rockstar. Valid Accounts (Green) are 100% guaranteed to exist, although they may be spoofed (confirm the SCID).

#### Autoprocess in Background
* Find your Account in question  
![First Search](Pictures/bg_process_first_search.png?raw=true)  
* A new window will open, loading the SocialClub website. The Window will close after the value is stored. No further interaction is needed.  
![SocialClub Popup](Pictures/bg_process_popup_window.png?raw=true)  
* Return to the ACP page and press the "Update" button in the Social Club field, the context menu or just search again to see the color highlighting  
![Final Result](Pictures/general_done_highlighted_search.png?raw=true)

#### Autoprocess through Search
* Find your Account in question  
![First Search](Pictures/general_first_search.png?raw=true)  
* Search SocialClub either by clicking the SocialClub in the ACP or manually through Rockstars Website  
![SocialClub Search](Pictures/auto_process_sc_search.png?raw=true)  
* The script will now automatically save the search result, there's no further interaction needed with the Rockstar page.  
* Return to the ACP page and either search again or press the "Update" button in the Social Club field to see the color highlighting  
![Final Result](Pictures/general_done_highlighted_search.png?raw=true)  

### Manual Handling
* Find your Account in question  
![First Search](Pictures/general_first_search.png?raw=true)  
* Search SocialClub either by clicking the SocialClub in the ACP or manually through Rockstars Website  
![SocialClub Search](Pictures/general_sc_search.png?raw=true)  
* Optionally: Color Highlight the exact match and/or show it's SCID.  
![SocialClub Search with Color Highlighting and SCID](Pictures/general_sc_search_color_scid.png?raw=true)  
* Determine if the account exists, and save that value by pressing the "Yes" or "No" buttons. "Clear" will unset the previous values for the searched Account.  
![SC Validation Buttons](Pictures/sc_legit_buttons.png?raw=true)  
* Return to the ACP page and either search again or press the "Update" button in the Social Club field to see the color highlighting  
![Final Result](Pictures/general_done_highlighted_search.png?raw=true)

### Context Menu
* Open SC Check in Background
* Update values
* Mark and unmark SocialClubs as known cheaters
* Copy SocialClub and SocialClub ID
* Reset all stored values about a specific SocialClub

![Context Menu](Pictures/sc_context_menu.png?raw=true)

### __Money Logs__
* Specify your desired search
* All individual transfers over 5 Million will be highlighted red

![Money Overview](Pictures/money_search_overview.png?raw=true)

* Clear the summary by pressing the "Reset" button
* Add a page to the summary by pressing the "Add" button
* Show the daily summary by pressing "Show"

![Money Overview](Pictures/money_buttons.png?raw=true)

* Upon pressing show, the summary will open in another tab - values above 5 Million will be highlighted in red once again

![Money Overview](Pictures/money_page_summary.png?raw=true)

**Disclaimer:** This will add all money transfers on the pages to the summary. Make sure your search parameters qualify for 1.7.

### __Organization Logs__
* Filter matching Player ID or Quantity (useful for FIB Fake IDs) from current to "End Page" by entering the query and pressing "Filter"
![Money Overview](Pictures/fraction_logs_search.png?raw=true)
* The Script will go through the pages and open a summary page once done
![Money Summary](Pictures/fraction_logs_summary.png?raw=true)

### __Authorization Logs__
* "Search All" Button to go over all possible pages

![Authorization Confirmation](Pictures/authorization_logs_confirmation.png?raw=true)
* After confirming the search query, the Script will go through all pages and create a summary table of all unique ID, SocialClub and (optionally) IP pairs.

![Authorization Summary](Pictures/authorization_logs_summary.png?raw=true)

### __Overall__
* Import Cheater list by going to the dropdown menu

![Import Cheater Dropdown](Pictures/import_cheater_dropdown.png?raw=true)

* Copy and Paste the table into the prompt, continue by pressing OK

![Import Cheater Table](Pictures/import_cheater_table.png?raw=true)
![Import Cheater Prompt](Pictures/import_cheater_prompt.png?raw=true)

* After the successful import has been confirmed, the added SocialClubs will be marked as cheaters. You can still manually mark and unmark them.

![Import Cheater Confirmation](Pictures/import_cheater_confirmed.png?raw=true)
![Import Cheater Result](Pictures/import_cheater_result.png?raw=true)