# Jcink Main Profile Tracker

A Main Profile Tracker code for jcink sites.

Designed as an alternative to FizzyElf's excellent Main Profile Tracker code - https://fizzyelf.jcink.net/index.php?showtopic=79

This tracker code uses a different kind of search method and allows an unlimited number of active and archived thread containers.

The raw code is available in this github repository for example and learning purposes. For installation directly onto a jcink site, please see
[free codes link here]

## What This Can't Do

Due to the search link used ('get all posts by this user' versus the traditional search link), you can't limit the code to only include certain forums. It will always search for the first 5 pages (or roughly 125 threads) of the user's posts.

This code ONLY takes forum IDs. It does not take category IDs or forum names of any kind.

## Known Bugs

Right now the code considers _all_ locked threads as 'archived' by default. A workaround for this is to provide a different class to the lockedClass param so it assumes the locked thread isn't locked. (Note that if you do this then all locked threads will be considered 'active' unless they are in one of the archived forums.)

## Future Enhancements

- A 'loading' spinner to your active and archived thread containers while the code is searching for threads.
- the ability to set specific icons for specific containers (ex: using a different icon for 'comms' and 'archived comms' threads)

## How to Use

Insert the following HTML code into your main profile template where you want the tracker to appear.

```html
<div id="active-threads"></div>

<div id="archived-threads"></div>
```

At the bottom of your main profile HTML template, insert the following script tags to load the tracker code:

```html
<script src="LINK FOR HOSTED CODE HERE"></script>
<script>
	$(document).ready(function () {
		trackerParams = {
			archiveForumIDs: ['#', '#', '#'],
		};
		buildTracker(`<!-- |id| -->`, trackerParams);
	});
</script>
```

The only _required_ parameter is `archiveForumIDs`, which is how you tell the tracker code which forums the 'completed', 'locked', or 'archived' threads should be in. The code will also contain all locked threads as archived by default.

Lastly, add your CSS inside `<style>` tags in the main profile template, right underneath the script tags:

```html
<style>
	.default-owed-icon:before {
		content: '\2794';
		font-style: normal;
		font-family: verdana, arial, sans-serif;
	}

	.default-completed-icon:before {
		content: '\2713';
		font-style: normal;
		font-family: verdana, arial, sans-serif;
	}

	.tracker-item a {
		font-size: 20px;
	}

	.tracker-item .status {
		width: 1.5em;
		text-align: center;
	}
	.tracker-item .completed {
		color: green;
		font-size: 20px;
	}
	.tracker-item .owed {
		color: brown;
		font-size: 20px;
	}

	.tracker-item hr {
		background-color: #000;
		border: none;
		height: 2px;
	}
</style>
```

## Optional Parameters

If you want to have multiple 'active' or 'archived' thread containers -- like, for example, you want to have a separate tracked spot for 'comms' and 'archived comms' -- you can add the following parameter to your `trackerParams` object with the name of the div ID where you want the comms to go, and the forum IDs the code should check for those threads in:

```javascript
trackerParams = {
	activeThreadContainers: [
		{ containerName: '#active-comms', forumIDs: ['#', '#', '#'] },
	],
	archivedThreadContainers: [
		{ containerName: '#archived-comms', forumIDs: ['#', '#', '#'] },
	],
};
```

Here is an example of a fully filled out `trackerParams` object with all variables in play:

```javascript
trackerParams = {
	// goes in order of 'owed', 'completed', 'locked'
	indicatorIcons: ['fas-check', 'fas-exclamation-triangle'],
	// must have space to either side if you want spaces in the divider
	divider: ' --- ',
	// if you have a custom class or identifier on your locked macro icon, otherwise it uses jcink default
	lockedClass: '[title=Closed]',
	// all of the DEFAULT archive forum IDs
	archiveForumIDs: ['31', '32', '33'],
	// all of the forum IDs you want to ignore. you can take out this line if you don't want to ignore any; it will ignore trash can by default
	ignoreForumIDs: ['2', '22'],
	// if you want to have multiple active or archived thread containers
	activeThreadContainers: [
		{ containerName: '#active-comms', forumIDs: ['3', '4', '5'] },
	],
	archivedThreadContainers: [
		{ containerName: '#archived-comms', forumIDs: ['34', '35', '36'] },
	],
};
```
