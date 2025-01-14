const apiProdURL = 'https://3-18-84-142.nip.io'; // new elastic IP

const apiJudge = '/judge/';

let apiServerURL

const apiEntitySearch = '/entity-search/';
const apiEntityDetail = '/entity-detail/';

async function checkLocalConfig() {
	console.log("Check for local config info (server URL etc. - local.json");
	
	try {
		const response = await fetch('local.json');
		if (!response.ok) {
			return false;
		}
		const config = await response.json();
		if (config['apiserver']) {
			apiServerURL = config['apiserver'];
			console.log("local config - API server:", apiServerURL);
		}
		return true;

	} catch (error) {
		console.error("Error loading local configs:", error);
		return false;
	}
}

document.addEventListener('DOMContentLoaded', async () => {
	
	await checkLocalConfig();
	
	if (!apiServerURL) { // might already be set with a local URL for testing (j2auth)
		apiServerURL = apiProdURL; // new elastic IP
	}

	// Debounced event listener for the search input
	const searchInput = document.getElementById("search-input");
	const suggestionsDiv = document.getElementById("autofill-suggestions");
	
	searchInput.addEventListener("input", debounce(function () {
		const query = searchInput.value.trim();
		if (query) {
			updateSearchSuggestions(query);
		} else {
			suggestionsDiv.style.display = "none";
		}
	}, 300)); // Adjust delay as needed
	
	// Hide the dropdown when clicking away
	document.addEventListener('click', function (event) {
		const form = document.getElementById('search-form');	
		if (!form.contains(event.target)) {
			suggestionsDiv.style.display = 'none';
		}
	});

	const toggleHeaders = document.querySelectorAll('#case-summary .toggle-header');
	const toggleContents = document.querySelectorAll('#case-summary .toggle-content');
	
	function handleResize() {
		if (window.innerWidth > 768) {
			// Large-screen mode: show all content and disable toggling
			toggleContents.forEach(content => {
				content.style.display = 'block'; // Ensure all content is visible
			});
			toggleHeaders.forEach(header => {
				header.classList.remove('active'); // Remove active state
				header.style.pointerEvents = 'none'; // Disable click events
			});
		} else {
			// Small-screen mode: enable toggling
			toggleHeaders.forEach(header => {
				header.style.pointerEvents = ''; // Enable click events
			});
		}
	}
	
	// Handle toggling for small screens
	toggleHeaders.forEach(header => {
		header.addEventListener('click', () => {
			if (window.innerWidth <= 768) {
				header.classList.toggle('active');
				const content = header.closest('.row').querySelector('.toggle-content');
				if (content) {
					content.style.display = content.style.display === 'block' ? 'none' : 'block';
				}
			}
		});
	});
	
	// Listen for resize events
	window.addEventListener('resize', handleResize);
	
	// Run on initial load
	handleResize();
});

// Debounce function to limit API calls
function debounce(func, delay) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), delay);
	};
}

// Fetch search suggestions from the FastAPI server
async function fetchSearchSuggestions(partial) {
	try {
		const response = await fetch(apiServerURL+apiEntitySearch, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ partial })
		});

		if (response.ok) {
			const result = await response.json();
			if (result.success) {
				console.log(result.suggestions);
				return result.suggestions; // Assuming server returns a `suggestions` array
			} else {
				console.warn("No suggestions found for query:", query);
				return [];
			}
		} else {
			console.error("Failed to fetch search suggestions");
			return [];
		}
	} catch (error) {
		console.error("Error fetching search suggestions:", error);
		return [];
	}
}

// Function to update the search suggestions dynamically
const updateSearchSuggestions = async (query) => {

	const searchInput = document.getElementById("search-input");
	const suggestionsDiv = document.getElementById("autofill-suggestions");

	const suggestions = await fetchSearchSuggestions(query);
	suggestionsDiv.innerHTML = ""; // Clear previous suggestions

	if (suggestions.length > 0) {
		suggestionsDiv.style.display = "block";
		suggestions.forEach(item => {
			const option = document.createElement("div");
			option.className = "dropdown-item";
			option.textContent = item.name; // Display name (or any field from API response)

			option.addEventListener("click", function () {
				searchInput.value = item.name; // Populate the input with the selected value
				suggestionsDiv.style.display = "none";

				// Make a secondary call using the selected key
				fetchSearchResult(item.name,item.ent,item.uuid);
			});

			suggestionsDiv.appendChild(option);
		});
	} else {
		suggestionsDiv.style.display = "none";
	}
};

// Fetch search results based on a selected key
async function fetchSearchResult(name,ent,uuid) {

	try {
		const response = await fetch(apiServerURL+apiEntityDetail, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name,ent,uuid })
		});

		if (response.ok) {
			const result = await response.json();
			if (result.success) {

				if (ent == "Disposition") {
					showDispoPage(result.data);
				}
				else if (ent == "Person") {
					showPersonPage(result.data);
				}
				else if (ent == "Case") {
					showCasePage(result.data);
				}
				else if (ent == "Party") {
					showPartyPage(result.data);
				}
				else if (ent == "Issue") {
					showIssuePage(result.data);
				}
				else showOopsPage(result.data);
				
			} else {
				console.log("No success with entity details",result.message)
			}
		} else {
			console.error("Failed to fetch entity details");
		}
	} catch (error) {
		console.error("Error fetching entity details:", error);
	}
}

function showDispoPage(data) {
	
	console.log(`DispositionPage ${data}`)
	
	document.getElementById('case-summary').classList.add('d-none');
	
	const container = document.getElementById('table-container');
	container.classList.remove('d-none');
	container.innerHTML = ''; // Clear previous content

	const dispoHeader = document.createElement('h3');
	dispoHeader.textContent = data.summary;
	container.appendChild(dispoHeader);

	// Create a table for the Disposition items
	const table = document.createElement('table');
	table.className = 'table table-striped table-bordered';
	table.innerHTML = `
		<thead>
			<tr>
				<th>Case&nbspNumber</th>
				<th>Case&nbspType</th>
				<th>Issue</th>
			</tr>
		</thead>
		<tbody>
			${data.items.map((dispoInfo, index) => `
				<tr>
					<td>
						<a href="#" class="case-link" data-case-uuid="${dispoInfo.case_uuid}">
							${dispoInfo.case_number}
						</a>
					</td>
					<td class="expandable" data-bs-toggle="collapse" data-bs-target="#collapse-row-${index}" style="cursor: pointer;">
						${dispoInfo.case_type}
					</td>
					<td class="expandable" data-bs-toggle="collapse" data-bs-target="#collapse-row-${index}" style="cursor: pointer;">
						${dispoInfo.issue}
					</td>
				</tr>
				<tr id="collapse-row-${index}" class="collapse">
					<td></td>
					<td colspan="2">
						<p>${dispoInfo.case_summary}</p>
					</td>
				</tr>
			`).join('')}
		</tbody>
	`;
	container.appendChild(table);
	
	// Attach click event listeners to all links
	const links = container.querySelectorAll('.case-link');
	links.forEach(link => {
		link.addEventListener('click', (event) => {
			event.stopPropagation(); // Prevent triggering any row events
			event.preventDefault(); // Prevent default link behavior
			const caseUuid = link.dataset.caseUuid;
			fetchSearchResult("case", 'Case', caseUuid); // Call the function
		});
	});
}

function showPersonPage(data) {
	
	console.log(`PersonPage ${data}`)
	
	document.getElementById('case-summary').classList.add('d-none');
	
	const container = document.getElementById('table-container');
	container.classList.remove('d-none');
	container.innerHTML = ''; // Clear previous content
	
	const personHeader = document.createElement('h3');
	personHeader.textContent = data.summary;
	container.appendChild(personHeader);
	
	// const paragraph = document.createElement('p');
	// paragraph.textContent = data.summary;
	// container.appendChild(paragraph);
	
	// Create a table for the Person's cases
	const table = document.createElement('table');
	table.className = 'table table-striped table-bordered';
	table.innerHTML = `
		<thead>
			<tr>
				<th>Role</th>
				<th>Case&nbspNumber</th>
				<th>Case&nbspType</th>
			</tr>
		</thead>
		<tbody>

			${data.roles.map((roleInfo, index) => `
				<tr data-bs-toggle="collapse" data-bs-target="#collapse-row-${index}" style="cursor: pointer;">
					<td>${roleInfo.role}</td>
					<td>${roleInfo.case_number}</td>
					<td>${roleInfo.case_type}</td>
				</tr>
				<tr id="collapse-row-${index}" class="collapse">
					<td></td>
					<td colspan="2">
						<p>${roleInfo.case_summary}</p>
					</td>
				</tr>
			`).join('')}

		</tbody>
	`;
	container.appendChild(table);
}

function showCasePage(data) {
	
	ddict = data.info
//	console.log(`CasePage ${ddict}`)
	console.log('CASE PAGE');
	console.log(ddict);
		
	document.getElementById('table-container').classList.add('d-none');
	
	const page = document.getElementById('case-summary');
	page.classList.remove('d-none'); // show the page

//	Case:	
	const caseDiv = document.getElementById('case-details');
	
	// const pElement = document.createElement('p');
	// const strongElement = document.createElement('strong');
	// strongElement.textContent = ddict.number;
	// pElement.appendChild(strongElement);
	// const normalElement = document.createTextNode(` (${ddict.county} County)`);
	// pElement.appendChild(normalElement);
	// caseDiv.appendChild(pElement);
	
	document.getElementById('case-summary-case').innerHTML = `
		<strong>${ddict.number}</strong> (${ddict.county} County)
	`;

//	Judge(s):
	const judgesDiv = document.getElementById('judge-details');
	judgesDiv.innerHTML = '';

	const jul = document.createElement("ul");
	jul.className = "mb-0 list-unstyled";
// 	Iterate over the dictionary and create list items
	Object.entries(ddict.judges).forEach(([uuid, judgeData]) => {
		const listItem = document.createElement("li");
		listItem.className = "list-group-item"; // Bootstrap class for styled list items
		// Create the link
		const link = document.createElement("a");
		link.href = "#"; // Prevents default navigation
		link.textContent = judgeData.name;
		link.addEventListener("click", (event) => {
			event.preventDefault(); // Prevent default link behavior
	//		console.log("CLICK!");
			fetchSearchResult(judgeData.name, "Person", uuid); // Call the function with parameters
		});
		listItem.appendChild(link);
		jul.appendChild(listItem);
	});
	judgesDiv.appendChild(jul);
	
//	Issues:
	const issuesDiv = document.getElementById('issue-details');
	issuesDiv.innerHTML = '';
	
 	const iul = document.createElement("ul");
	iul.className = "mb-0 list-unstyled";
// 	Iterate over the dictionary and create list items
	Object.entries(ddict.issues).forEach(([uuid, issueData]) => {
 		const listItem = document.createElement("li");
 		listItem.className = "list-group-item"; // Bootstrap class for styled list items
 		// Create the link
 		const link = document.createElement("a");
 		link.href = "#"; // Prevents default navigation
 		link.textContent = issueData.issue;
 		link.addEventListener("click", (event) => {
 			event.preventDefault(); // Prevent default link behavior
//			console.log("CLICK!");
 			fetchSearchResult(issueData.issue, "Issue", uuid); // Call the function with parameters
 		});
 		listItem.appendChild(link);
		iul.appendChild(listItem);
 	});
 	issuesDiv.appendChild(iul);




// 	const container = document.getElementById('table-container');
// 	container.innerHTML = ''; // Clear previous content
// 
// 	const caseHeader = document.createElement('h3');
// 	caseHeader.textContent = ddict.summary;
// 	container.appendChild(caseHeader);
// 	
// 	const paragraph = document.createElement('p');
// 	paragraph.textContent = ddict.overview;
// 	container.appendChild(paragraph);
// 	
// 	console.log("JUDGES")
// 	console.log(ddict.judges)
// 	
// 	const judgesListContainer = document.createElement("div");
// 	judgesListContainer.className = "container mt-4"; // Bootstrap container with margin-top
// 	
// 	const judgesHeading = document.createElement("h3");
// 	judgesHeading.textContent = "Judges";
// 	judgesListContainer.appendChild(judgesHeading);
// 
// 	// Create the unordered list
// 	const jul = document.createElement("ul");
// 	jul.className = "list-group"; // Bootstrap class for styled lists
// 	
// 	// Iterate over the dictionary and create list items
// 	Object.entries(ddict.judges).forEach(([uuid, judgeData]) => {
// 		const listItem = document.createElement("li");
// 		listItem.className = "list-group-item"; // Bootstrap class for styled list items
// 	
// 		// Create the link
// 		const link = document.createElement("a");
// 		link.href = "#"; // Prevents default navigation
// 		link.textContent = judgeData.name;
// 		link.addEventListener("click", (event) => {
// 			event.preventDefault(); // Prevent default link behavior
// 			fetchSearchResult(judgeData.name, "Person", uuid); // Call the function with parameters
// 		});
// 	
// 		// Append the link to the list item
// 		listItem.appendChild(link);
// 	
// 		// Append the list item to the unordered list
// 		jul.appendChild(listItem);
// 	});
// 	judgesListContainer.appendChild(jul);
// 	container.appendChild(judgesListContainer);
// 
// 	console.log("ISSUES")
// 	console.log(ddict.issues)
// 	
// 	const issuesListContainer = document.createElement("div");
// 	issuesListContainer.className = "container mt-4"; // Bootstrap container with margin-top
// 	
// 	const issuesHeading = document.createElement("h3");
// 	issuesHeading.textContent = "Issues";
// 	issuesListContainer.appendChild(issuesHeading);
// 
// 	// Create the unordered list
// 	const iul = document.createElement("ul");
// 	iul.className = "list-group"; // Bootstrap class for styled lists
// 
// 	// Iterate over the dictionary and create list items
// 	Object.entries(ddict.issues).forEach(([uuid, issueData]) => {
// 		const listItem = document.createElement("li");
// 		listItem.className = "list-group-item"; // Bootstrap class for styled list items
// 
// 		// Create the link
// 		const link = document.createElement("a");
// 		link.href = "#"; // Prevents default navigation
// 		link.textContent = issueData.issue;
// 		link.addEventListener("click", (event) => {
// 			event.preventDefault(); // Prevent default link behavior
// 			fetchSearchResult(issueData.issue, "Issue", null); // Call the function with parameters
// 		});
// 
// 		// Append the link to the list item
// 		listItem.appendChild(link);
// 
// 		// Append the list item to the unordered list
// 		iul.appendChild(listItem);
// 	});
// 	issuesListContainer.appendChild(iul);
// 	container.appendChild(issuesListContainer)
// 
// 
// 	const partiesListContainer = document.createElement("div");
// 	partiesListContainer.className = "container mt-4"; // Bootstrap container with margin-top
// 		
// 	// Create a heading for the list
// 	const partiesHeading = document.createElement("h3");
// 	partiesHeading.textContent = "Parties";
// 	partiesListContainer.appendChild(partiesHeading);
// //	... build the list here
// 	const ppara = document.createElement('p');
// 	ppara.textContent = "(coming soon)";
// 	partiesListContainer.appendChild(ppara);
// 
// 	container.appendChild(partiesListContainer)
// 
// 	const contentionsListContainer = document.createElement("div");
// 	contentionsListContainer.className = "container mt-4"; // Bootstrap container with margin-top
// 			
// 	// Create a heading for the list
// 	const contentionsHeading = document.createElement("h3");
// 	contentionsHeading.textContent = "Contentions";
// 	contentionsListContainer.appendChild(contentionsHeading);
// //	... build the list here
// 	const cpara = document.createElement('p');
// 	cpara.textContent = "(coming soon)";
// 	contentionsListContainer.appendChild(cpara);
// 	container.appendChild(contentionsListContainer)
// 
// 	const witnessesListContainer = document.createElement("div");
// 	witnessesListContainer.className = "container mt-4"; // Bootstrap container with margin-top
// 			
// 	// Create a heading for the list
// 	const witnessesHeading = document.createElement("h3");
// 	witnessesHeading.textContent = "Witnesses";
// 	witnessesListContainer.appendChild(witnessesHeading);
// //	... build the list here
// 	const wpara = document.createElement('p');
// 	wpara.textContent = "(coming soon)";
// 	witnessesListContainer.appendChild(wpara);
// 	container.appendChild(witnessesListContainer)

}

function showPartyPage(data) {

	document.getElementById('case-summary').classList.add('d-none');

	const tableContainer = document.getElementById('table-container');
	tableContainer.classList.remove('d-none');
	tableContainer.textContent = `Party ${data.header}`;
}

function showIssuePage(data) {
	
	document.getElementById('case-summary').classList.add('d-none');

	const tableContainer = document.getElementById('table-container');
	tableContainer.classList.remove('d-none');
	tableContainer.textContent = `Issue ${data.header}`;
}

function showOopsPage(data) {
	
	document.getElementById('case-summary').classList.add('d-none');

	const tableContainer = document.getElementById('table-container');
	tableContainer.classList.remove('d-none');
	tableContainer.textContent = `Oops! ${data.header}`;
}
