# GrandRP ACP - Rockstar Social Club Improvements (GRSI)
<p align="center"><img src="Pictures/header.png" alt="header"></p>

## Features

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

#### All Logs with Pages
* Field to go to desired page
* Search a page by date (done through binary search, page will reload multiple times during search until done)
	* Time 0:00: Search for just the date
	*  Time X:00: Search for date and hour
	* Time X:XX: Search for date, hour and minute

#### Common
* Scroll to top by clicking the russian headlines

### SocialClub Website
* Buttons to manually store if Account is valid or not
* Option: Color Highlight exact matches
* Show SocialClub ID for match
* Option: Show SocialClub ID for all accounts from a search

### Common
* Local storage system using Tampermokeys ```GM_getValue``` and ```GM_setValue``` features
* Automatically Process SocialClubs
	* Automatically detect and store searchresults done on the Rockstar members list
	* Option: Close SocialClub website after processing
	* Option: Button to process SC in a sepreate window that closes after processing
	* Option: Button on previously processed SocialClubs


## Installation

```GRSI.user.js``` is a [Tampermonkey](https://www.tampermonkey.net/) Skript, currently used and tested with version 4.18.1 on Chrome, although it should work with all other Tampermonkey-supported Browsers as well.

To install it, create a new userscript inside Tampermokey, paste the contents of ```GRSI.user.js```, and enable the script.
Alternatively, the script is hosted on [my Website](https://g.m5.cx/GRSI.user.js). Opening the Link will trigger an installation prompt inside Tampermonkey.

## Usage

### General
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

### Autoprocess

**Disclaimer:** Autoprocess is in a Beta state. Invalid (red) SocialClubs should always be manually confirmed to be invalid. Valid Accounts (Green) are 100% guaranteed to exist, although they may be spoofed (check the SCID).

#### Autoprocess through Search
* Find your Account in question  
![First Search](Pictures/general_first_search.png?raw=true)  
* Search SocialClub either by clicking the SocialClub in the ACP or manually through Rockstars Website  
![SocialClub Search](Pictures/auto_process_sc_search.png?raw=true)  
* The script will now automatically save the search result, there's no further interaction needed with the Rockstar page.  
* Return to the ACP page and either search again or press the "Update" button in the Social Club field to see the color highlighting  
![Final Result](Pictures/general_done_highlighted_search.png?raw=true)  

#### Autoprocess in Background
* Find your Account in question  
![First Search](Pictures/bg_process_first_search.png?raw=true)  
* A new window will open, loading the SocialClub website. The Window will close after the value is stored. No further interaction is needed.  
![SocialClub Popup](Pictures/bg_process_popup_window.png?raw=true)  
* Return to the ACP page and either search again or press the "Update" button in the Social Club field to see the color highlighting  
![Final Result](Pictures/general_done_highlighted_search.png?raw=true)