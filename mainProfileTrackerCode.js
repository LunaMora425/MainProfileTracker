/** Main Profile Tracker Code - coded by Luna of Free Codes
 * https://freecodes.jcink.net/
 *
 * This function takes the userID of the user (contained within the jcink variable of `<!-- |id| -->` on the main profile)
 * and an object of variables and produces a thread tracker, to be inserted wherever the div IDs are listed in the HTML Template
 *
 * @param {string} userID - The user ID from showuser= in the URL, passed in as a string
 * @param {Object} params - Configuration options for the tracker. Properties include:
 * @param {number} params.pageLimit - The number of search results to read through (can be set less than 5)
 * @param {String[]} params.indicatorIcons - Your owed, completed, and (optional) locked thread icons
 * @param {string} params.divider - Divider between forum location and thread description
 * @param {string} params.lockedClass - Used to determine whether a thread is locked
 * @param {String[]} params.archiveForumIDs - IDs of forums to archive
 * @param {Object[]} params.activeThreadContainers - Array of object containers for active threads
 * @param {Object[]} params.archivedThreadContainers - Array of object containers for archived threads
 * @param {String[]} params.ignoreForumIds - Forums to NOT track threads from. Trash can is default
 */
async function buildTracker(userID, params = {}) {
	let searchResults = [];

	/* default values */
	const trashCanForumId = '2';
	const defaultPageLimit = 5;
	const defaultLockedMacroClass = `[title*=Closed],[class*=lock],[class*=closed]`;
	const defaultDivider = ' | ';
	const defaultActiveThreadContainer = [{ containerName: '#active-threads' }];
	const defaultArchivedThreadContainer = [{ containerName: '#archived-threads' }];
	const defaultEmptyTrackerHTML = `<div class="tracker-item">None</div>`;
	const defaultSearchFailedHTML = `<div class="tracker-item">Search Failed</div>`;

	/* User Configuration */
	const options = {
		// the userID from showuser= in the URL
		userID: userID,
		// the number of search results to read through (can be set less than 5)
		pageLimit: params.pageLimit || defaultPageLimit,
		// your owed, completed, and (optional) locked thread icons
		indicatorIcons: buildIndicatorIcons(params.indicatorIcons || []),
		// divider between forum location and thread description
		divider: params.divider || defaultDivider,
		// used to determine whether a thread is archived
		lockedClass: params.lockedClass || defaultLockedMacroClass,
		archiveForumIDs: params.archiveForumIDs || [],
		// containers for active and archived threads
		defaultActiveThreadContainer: defaultActiveThreadContainer,
		defaultArchivedThreadContainer: defaultArchivedThreadContainer,
		activeThreadContainers: params.activeThreadContainers || defaultActiveThreadContainer,
		archivedThreadContainers: params.archivedThreadContainers || defaultArchivedThreadContainer,
		// forums to NOT track threads from. trash can is default
		ignoreForumIDs: params.ignoreForumIds || [trashCanForumId],
	};

	/* Parse Results & Build Tracker */
	const parseResults = async (searchlink, page) => {
		let doc;
		// update the search link with the new page number (starts at 0)
		searchlink = searchlink.replace(/&st=\d+/, `&st=${page * 25}`);
		let data = '';
		try {
			console.log(`fetching search results from: ${searchlink}`);
			data = await $.get(searchlink);
			console.log('success.');
		} catch (err) {
			console.log(`Ajax error loading page: ${searchlink} - ${err.status} ${err.statusText}`);
			console.log(err);
			searchResults.push({
				date: new Date(),
				html: defaultSearchFailedHTML,
				container: buildContainer(false, '0', options),
			});
			return;
		}
		doc = new DOMParser().parseFromString(data, 'text/html');

		// all jcink search results are in a table following this format
		// loop through each row in the table and grab the details for the tracker
		$('#search-topics .tablebasic > tbody > tr', doc).each(function (i, tableRow) {
			// skip the first row, which is the header
			if (i > 0) {
				// divide each row into cells
				const cells = $(tableRow).children('td');

				// grab the forum link, name, and ID
				const forumLinkElement = $(cells[3]).find('a');
				const forumLink = forumLinkElement.attr('href');
				const forumName = forumLinkElement.text();
				const showForumID = forumLink.match(/showforum=([^&]+)&?/)[1];

				// grab the link to the thread from the 'last post' link
				const threadLink = $(cells[7]).children('a').attr('href');

				// check if the thread is in a forum location we should ignore
				const ignored = options.ignoreForumIDs.includes(showForumID);

				// only process the non-ignored threads
				if (!ignored) {
					// locked is true IF the post icon in the cell has one of the locked classes on it OR
					// if the forum ID is in the archiveForumIDs array
					const locked =
						$(cells[0]).find(`${options.lockedClass}`).length || options.archiveForumIDs.includes(showForumID);

					// grab the thread title and description
					const title = $(cells[2]).find('td:nth-child(2) > a').first().text();
					const topicDesc = $(cells[2]).find('.desc').text();

					// grab the last poster's name and ID
					const lastPosterLinkElement = $(cells[7]).find('a[href*=showuser]');
					const lastPosterID = lastPosterLinkElement.attr('href').match(/showuser=([^&]+)&?/)[1];
					const lastPosterName = lastPosterLinkElement.text();

					// if the last poster ID listed for the thread is the same as the user ID, it's not their turn
					const postStatus = lastPosterID === options.userID ? 'completed' : 'owed';
					// grab the post date
					const postDate = $(cells[7]).html().substr(0, $(cells[7]).html().indexOf('<br>'));
					// sets the divider if there is a topic description AND the topic description doesn't start with the divider
					const divider = topicDesc && !topicDesc.startsWith(options.divider) ? options.divider : '';

					// takes the results of the row, builds an object based on the helper functions,
					// and pushes it to the searchResults array
					searchResults.push({
						date: parseDate(postDate),
						html: buildHTML(
							postStatus,
							options,
							threadLink,
							title,
							forumName,
							divider,
							topicDesc,
							locked,
							lastPosterName,
							postDate,
						),
						container: buildContainer(locked, showForumID, options),
					});
				}
			}
		});

		// there should be 25 results on the page plus the table header row. if there are, and the page limit
		// hasn't been reached, go to the next page and call the function again
		if ($('#search-topics .tablebasic > tbody > tr', doc).length == 26 && page < options.pageLimit) {
			page = page + 1;
			return await parseResults(searchlink, page);
		}
	};

	/* First Search */

	// we're using the 'get all posts from user' link
	let href = `/index.php?act=Search&CODE=getalluser&mid=${userID}&type=posts`;
	let data = '';
	try {
		console.log(`fetching first link: ${href}`);
		data = await $.post(href, {});
		console.log('success.');
	} catch (err) {
		console.log(`Ajax error loading page: ${href} - ${err.status} ${err.statusText}`);
		searchResults.push({
			date: new Date(),
			html: defaultSearchFailedHTML,
			container: buildContainer(false, '0', options),
		});
		return;
	}
	doc = new DOMParser().parseFromString(data, 'text/html');

	// the first page of the search results if the search was successful is always a redirect box
	// pull out the meta from the webpage IF it has the refresh tag
	let meta = $('meta[http-equiv="refresh"]', doc);
	// if there is something in the meta, that means there are results to search through
	if (meta.length) {
		// the content of the meta is the new URL string to put in the address bar that starts with url=
		// we grab the link starting from 1 space after the = sign and turn the results into topics instead of posts
		// then we tack on the page # to the end of the link with the st=0 (starting topic = 0)
		href =
			meta
				.attr('content')
				.substr(meta.attr('content').indexOf('=') + 1)
				.replace('result_type=posts', 'result_type=topics') + '&st=0';
	} else {
		// if there is no meta, that means there are no results to search through
		// we grab the board message from the page and check if it says there are no results
		// if it does, we push two empty trackers to the search results array
		// if it doesn't, we push whatever the board message is to the search results array
		let boardmessage = $('#board-message .tablefill .postcolor', doc).text();
		if (boardmessage.includes('we did not find any matches to display')) {
			searchResults.push({
				date: new Date(),
				html: defaultEmptyTrackerHTML,
				container: buildContainer(false, '0', options),
			});
			searchResults.push({
				date: new Date(),
				html: defaultEmptyTrackerHTML,
				container: buildContainer(true, '0', options),
			});
		} else {
			searchResults.push({
				date: new Date(),
				html: `<div class="tracker-item">${boardmessage}</div>`,
				container: buildContainer(false, '0', options),
			});
		}
		return;
	}

	// this first await call will start the recursive function to parse the search results
	// it won't finish until it has gone through all pages up to the page limit
	await parseResults(href, 0);

	// sort the search results by date, newest to oldest, and append the html to the appropriate container
	searchResults
		.sort((a, b) => b.date - a.date)
		.forEach((result) => {
			result.container.append(result.html);
		});

	// if after all of that is done, there are still empty containers,
	// append the default empty tracker html to them
	options.activeThreadContainers.forEach((container) => {
		let containerElement = $(container.containerName);

		if (containerElement.children().length === 0) {
			containerElement.append(defaultEmptyTrackerHTML);
		}
	});

	options.archivedThreadContainers.forEach((container) => {
		let containerElement = $(container.containerName);

		if (containerElement.children().length === 0) {
			containerElement.append(defaultEmptyTrackerHTML);
		}
	});
}

/* Helper Functions */

// build indicator icons
// if you're using custom i class icons, they are checked for format and added to the array
// if not, the default icon classes are added
function buildIndicatorIcons(indicatorIcons) {
	let indicatorIconsArray = [];
	if (indicatorIcons.length !== 0) {
		indicatorIcons.forEach((icon) => {
			if (/^[-a-z _\d]+$/i.test(icon)) {
				indicatorIconsArray.push(icon);
			}
		});
	} else {
		indicatorIconsArray.push('default-owed-icon', 'default-completed-icon');
	}
	return indicatorIconsArray;
}

// build container bucket for thread tracker
function buildContainer(locked, showForumID, options) {
	// check the thread's showForumID against the active and archived thread containers
	// if the thread is meant to go in a specific container (ex: event thread goes in event bucket)
	// set that container as the return value
	// if there is no special container, return the default container name

	if (locked) {
		for (const container of options.archivedThreadContainers) {
			if (container.forumIDs && container.forumIDs.includes(showForumID)) {
				return $(container.containerName);
			} else {
				return $(options.defaultArchivedThreadContainer[0].containerName);
			}
		}
	} else {
		for (const container of options.activeThreadContainers) {
			if (container.forumIDs && container.forumIDs.includes(showForumID)) {
				return $(container.containerName);
			} else {
				return $(options.defaultActiveThreadContainer[0].containerName);
			}
		}
	}
}

// build html for thread tracker
function buildHTML(
	postStatus,
	options,
	threadLink,
	title,
	locationName,
	divider,
	threadDesc,
	locked,
	lastPosterName,
	postDate,
) {
	let symbol = '';
	if (!locked) {
		const symbolIcon = postStatus === 'owed' ? options.indicatorIcons[0] : options.indicatorIcons[1];
		symbol = `<span class="status ${postStatus}" aria-described-by="${postStatus}"><i class="${symbolIcon}"></i></span>`;
	} else if (options.indicatorIcons[2]) {
		symbol = `<span class="status locked" aria-described-by="Closed Thread"><i class="${options.indicatorIcons[2]}"></i></span>`;
	}

	return `
           <div class="tracker-item"><b>${symbol} <a href="${threadLink}">${title}</a></b>
              <div class="tracker-details">
                <span class="tracker-forum">${locationName}</span> <span class="tracker-desc">${divider} ${threadDesc}</span><br>
                ${
									!locked
										? `<span class="tracker-lastpost"><b>Last Post:</b> ${lastPosterName} - ${postDate}</span>`
										: ''
								}
              </div><hr></div>`;
}

/* parse jcink relative dates */
// when switching the result type from posts to topics with the 'get all by user' link,
// the posts aren't sorted by last post date. these two functions convert the relative jcink dates to absolute dates
// in order to make a date object that can then be sorted newest to oldest
function parseRelativeDate(str, start, daysOffset = 0) {
	if (str.startsWith(start)) {
		const time = str.slice(start.length);
		const date = new Date();
		date.setDate(date.getDate() - daysOffset);
		const [hours, minutes] = time.split(':');
		date.setHours(parseInt(hours), parseInt(minutes));
		return date;
	}
	return null;
}

function parseDate(str) {
	const monthNames = {
		Jan: 'January',
		Feb: 'February',
		Mar: 'March',
		Apr: 'April',
		May: 'May',
		Jun: 'June',
		Jul: 'July',
		Aug: 'August',
		Sep: 'September',
		Oct: 'October',
		Nov: 'November',
		Dec: 'December',
	};

	const date = parseRelativeDate(str, 'Yesterday at ', 1) || parseRelativeDate(str, 'Today at ');
	if (date) return date;

	const matchSeconds = str.match(/(\d+) seconds ago/);
	if (matchSeconds) {
		const date = new Date();
		date.setSeconds(date.getSeconds() - parseInt(matchSeconds[1]));
		return date;
	}

	const matchMinutes = str.match(/(\d+) minutes ago/);
	if (matchMinutes) {
		const date = new Date();
		date.setMinutes(date.getMinutes() - parseInt(matchMinutes[1]));
		return date;
	}

	const match = str.match(/(\w+) (\d+) (\d+), (\d+:\d+ [AP]M)/);
	if (match) {
		const month = monthNames[match[1]];
		const day = match[2];
		const year = match[3];
		const time = match[4];
		return new Date(`${month} ${day}, ${year} ${time}`);
	}

	// If the date is in a format that this function doesn't recognize, return null
	return null;
}
