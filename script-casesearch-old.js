const apiProdURL = 'https://3-18-84-142.nip.io'; // new elastic IP

const apiJudge = '/judge/';

let apiServerURL

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
	
	document.getElementById('search-form').addEventListener('submit', async function(event) {
		event.preventDefault(); // Prevent default form submission behavior

		// Collect form data
		const startDate = document.getElementById('start-date').value;
		const endDate = document.getElementById('end-date').value;
		const judge = document.getElementById('judge').value;

		// API endpoint
		const apiUrl = 'https://your-fastapi-server.com/search';

		try {
			// Send POST request to FastAPI server
			const response = await fetch(apiServerURL+apiJudge, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					start_date: startDate,
					end_date: endDate,
					partial_name: judge,
				}),
			});

			// Parse the JSON response
			const data = await response.json();

			if (!data.success) {
				throw new Error(data.message)
			}
			
			renderJudgesAndCases(data.judges);
/*			
			// Generate tables dynamically
			const tableContainer = document.getElementById('table-container');
			tableContainer.innerHTML = ''; // Clear previous content

			// Loop through the response and create tables
			data.tables.forEach((tableData, index) => {
				const table = document.createElement('table');
				table.className = 'table table-striped table-bordered';
				table.innerHTML = `
					<thead>
						<tr>
							${tableData.headers.map(header => `<th>${header}</th>`).join('')}
						</tr>
					</thead>
					<tbody>
						${tableData.rows.map(row => `
							<tr>
								${row.map(cell => `<td>${cell}</td>`).join('')}
							</tr>
						`).join('')}
					</tbody>
				`;
				tableContainer.appendChild(table);
			});
*/
		} catch (error) {
			console.error('Error fetching data:', error);
			alert('An error occurred while fetching data.');
		}
	});
});

function renderJudgesAndCases(judgesData) {
	const container = document.getElementById('table-container');
	container.innerHTML = ''; // Clear previous content
	
	for (const [judgeName, judgeInfo] of Object.entries(judgesData)) {
		// Create an <h3> element for the judge's name
		const judgeHeader = document.createElement('h3');
		judgeHeader.textContent = judgeName;
		container.appendChild(judgeHeader);
		
//		console.log(judgeInfo);
		
		// Create a table for the judge's cases
		const table = document.createElement('table');
		table.className = 'table table-striped table-bordered';
		table.innerHTML = `
			<thead>
				<tr>
					<th>Case Number</th>
					<th>URL</th>
					<th>Filed Date</th>
					<th>Counsel</th>
					<th>Motions</th>
				</tr>
			</thead>
			<tbody>
				${judgeInfo.cases.map(caseInfo => `
					<tr>
						<td>${caseInfo.number}</td>
						<td><a href="${caseInfo.URL}" target="_blank">View Case</a></td>
						<td>${new Date(caseInfo.filed_dt * 1000).toLocaleDateString()}</td>
						<td>${caseInfo.attorneys ? caseInfo.attorneys.join('<br>') : 'N/A'}</td>
						<td>${caseInfo.motions ? caseInfo.motions.join('<br>') : 'N/A'}</td>
					</tr>
				`).join('')}
			</tbody>
		`;
		container.appendChild(table);

	}
}