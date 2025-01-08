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

				console.log("Details:", result);
				console.log("Ent:",ent);
				// Render or display results (e.g., update a table or content area)
			
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
	
	const tableContainer = document.getElementById('table-container');
	tableContainer.textContent = `Disposition ${data.header}`;
}

function showPersonPage(data) {
	
	console.log(`PersonPage ${data.name}`)
	
	const container = document.getElementById('table-container');
	container.innerHTML = ''; // Clear previous content
	
	const personHeader = document.createElement('h3');
	personHeader.textContent = data.summary;
	container.appendChild(personHeader);
	
	// const paragraph = document.createElement('p');
	// paragraph.textContent = data.summary;
	// container.appendChild(paragraph);
	
	// Create a table for the judge's cases
	const table = document.createElement('table');
	table.className = 'table table-striped table-bordered';
	table.innerHTML = `
		<thead>
			<tr>
				<th>Role</th>
				<th>Case Number</th>
				<th>Case Type</th>
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
	
	const tableContainer = document.getElementById('table-container');
	tableContainer.textContent = `Case ${data.header}`;
}

function showPartyPage(data) {
	
	const tableContainer = document.getElementById('table-container');
	tableContainer.textContent = `Party ${data.header}`;
}

function showIssuePage(data) {
	
	const tableContainer = document.getElementById('table-container');
	tableContainer.textContent = `Issue ${data.header}`;
}

function showOopsPage(data) {
	
	const tableContainer = document.getElementById('table-container');
	tableContainer.textContent = `Oops! ${data.header}`;
}
