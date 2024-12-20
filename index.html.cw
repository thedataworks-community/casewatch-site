<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>CaseWatch: Court Event Notifications</title>
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/css/bootstrap.min.css" rel="stylesheet">
	<link rel="stylesheet" href="styles.css">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-masker/1.1.1/vanilla-masker.min.js"></script>
</head>
<body>
	<!-- Content Canvas -->
	<div class="content-container">
		<!-- Top Section -->
		<section class="top-section">
			<div class="container">
				<h1>Welcome to CaseWatch Oklahoma</h1>
				<p>Get notifications and reminders for court events that are important to you.
				Find cases by county, follow them, and we'll send you SMS alerts when
				events are coming up so you won't miss anything.
				</p>
			</div>
		</section>

		<!-- Middle Section -->
		<section class="middle-section">
			<div class="container">
				<!-- Authentication Form (visible by default) -->
				<div id="auth-form-container" class="hidden">
					<h2>Register your mobile</h2>
					<p>Enter your mobile number below so we can register your device for SMS updates on cases you follow</p>
					<!-- Phone number input -->
					<input type="text" id="phone" placeholder="(mobile number here)" class="phone-input" maxlength="14">
				</div>

				<!-- Authenticated Content (hidden by default) -->
				<div id="authenticated-content" class="hidden">
				<!-- This will be populated after authentication -->
					<table class="table table-responsive table-striped">
					<thead>
						<tr>
							<th scope="col" onclick="sortTable(0)">Case Number</th>
							<th scope="col" onclick="sortTable(1)">Date</th>
							<th scope="col">Event</th>
							<th scope="col">Notify Me</th>
						</tr>
					</thead>
					<tbody id="case-table-body">
						<tr>
							<td colspan="4" class="text-center">Nothing to see here yet...</td>
						</tr>
					</tbody>
					</table>
				</div>
			</div>
		</section>

		<!-- Bottom Section -->
		<section class="bottom-section">
			<div class="container">
				<div id="case-search-form">
					<h2>Find a case to follow:</h2>
					<form id="bottom-form">
						<!-- County Input with Autocomplete Dropdown -->
						<div class="mb-3 position-relative">
							<input type="text" class="form-control" id="county" placeholder="Enter county" autocomplete="off">
							<div id="county-suggestions" class="dropdown-menu" style="display: none;"></div>
						</div>		
						<!-- Case Number Input with Autocomplete (Initially Disabled) -->
						<div class="mb-3">
							<input type="text" class="form-control" id="case-number" placeholder="Enter case number" autocomplete="off" disabled>
							<div id="case-number-suggestions" class="dropdown-menu" style="display: none;"></div>
						</div>
		
						<!-- Placeholder for Case Description -->
						<p id="case-description" class="text-muted mt-2" style="display: none;"></p>
		
						<!-- Submit Button (Initially Disabled) -->
						<button type="button" class="btn btn-primary mt-3" id="submit-btn" disabled>Submit</button>
					</form>
				</div>
			</div>
		</section>
	</div>

	<!-- BEGIN j2auth Authentication -->

	<!-- Modal Structure with Bootstrap Attributes -->
	<div id="modal" class="modal fade" tabindex="-1" aria-hidden="true">
		<div class="modal-dialog">
			<div class="modal-content">
				<div class="modal-header">
					<h5 class="modal-title">Enter Verification Code</h5>
					<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
				</div>
				<div class="modal-body">
					<p id="modalMessage">Enter the code you received</p>
					<div id="verificationInput">
						<input type="text" id="code1" maxlength="1" class="code-input" autocomplete="off">
						<input type="text" id="code2" maxlength="1" class="code-input" autocomplete="off">
						<input type="text" id="code3" maxlength="1" class="code-input" autocomplete="off">
						<input type="text" id="code4" maxlength="1" class="code-input" autocomplete="off">
					</div>
				</div>
			</div>
		</div>
	</div>
	
	<script src="j2auth/j2auth.js"></script> 
	
	<!-- END j2auth Authentication -->

	<!-- Sticky Footer -->
	<footer class="footer">
		<div class="container">
			<p>CaseWatch © 2024 Dataworks LLC. All rights reserved.</p>
		</div>
	</footer>

	<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha3/dist/js/bootstrap.bundle.min.js"></script>
	<script src="scripts.js"></script>
	
	<script>
		// Sort table by column index (0: Case Number, 1: Date)
		let sortOrder = {};
		function sortTable(columnIndex) {
			const table = document.getElementById("case-table-body");
			const rows = Array.from(table.rows).slice(0); // skip header row
	
			if (!sortOrder[columnIndex]) sortOrder[columnIndex] = 'asc';
	
			rows.sort((a, b) => {
				let valA = a.cells[columnIndex].innerText;
				let valB = b.cells[columnIndex].innerText;
	
				// Handle date sorting for columnIndex 1
				if (columnIndex === 1) {
					valA = new Date(valA);
					valB = new Date(valB);
				}
	
				if (sortOrder[columnIndex] === 'asc') {
					return valA > valB ? 1 : -1;
				} else {
					return valA < valB ? 1 : -1;
				}
			});
	
			sortOrder[columnIndex] = sortOrder[columnIndex] === 'asc' ? 'desc' : 'asc';
	
			table.innerHTML = ""; // Clear the table body
			rows.forEach(row => table.appendChild(row)); // Rebuild with sorted rows
		}
	</script>
</body>
</html>