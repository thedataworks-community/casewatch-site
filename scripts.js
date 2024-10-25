const BIZ = "dworks";
const APP = "casewatch";

document.addEventListener("DOMContentLoaded", async function() {


	const dynamicContent = document.getElementById('authenticated-content');

//	const bottomSection = document.querySelector('.bottom-section');
	const pageHeader = document.querySelector('.top-section h1');
	const caseSearch = document.getElementById('case-search-form');

	const authForm = document.getElementById('auth-form-container');
	const phoneInput = document.getElementById('phone');

	const modalElement = document.getElementById("modal");
	const confirmModal = new bootstrap.Modal(modalElement);
	const codeInputs = document.querySelectorAll(".code-input");

	const countyInput = document.getElementById("county");
	const suggestionsDiv = document.getElementById("county-suggestions");
	
	const caseNumberInput = document.getElementById("case-number");
	
	const caseDescription = document.getElementById("case-description");
	const submitBtn = document.getElementById("submit-btn");

//	
//	confirmModal.style.display = "none";

// Sample data for autocomplete (replace with server data)
	const counties = ["Tulsa", "Oklahoma", "Creek", "Canadian", "Pottawatomie"]; // Example county list
	const casesByCounty = {
			"Tulsa": ["12345", "67890"],
			"Oklahoma": ["54321", "98765"]
		};


	await j2AuthInit( BIZ,APP ); // userProfile, isAuthenticated

	if (isAuthenticated) {
		
		letEmOnIn();

	} else {
		
		authForm.classList.remove('hidden');
		
	//	Masking the phone number input
		VMasker(phoneInput).maskPattern('(999) 999-9999');
	
	//	Handle "Enter" key press on phone input
		phoneInput.addEventListener('keypress', function(event) {
			if (event.key === 'Enter') {
				event.preventDefault(); // Prevents the default action (which may be submitting the form)
				submitPhoneNumber();
			}
		});
	
	//	Handle "Done" button on iOS (when input loses focus)
		phoneInput.addEventListener('focusout', function() {
			const isiOS = /iPhone|iPad/i.test(navigator.userAgent);
			if (isiOS) {
				submitPhoneNumber();
			}
		});
	
//		const codeInputs = document.querySelectorAll(".code-input");
	
	// 	Set focus to the first input when the modal is fully shown
		modalElement.addEventListener("shown.bs.modal", function () {
			codeInputs[0].focus();
		});
	
		codeInputs.forEach((input, index) => {
			// Use 'keyup' to capture after character is added
			input.addEventListener("keyup", function () {
				if (this.value.length === 1 && index < codeInputs.length - 1) {
					codeInputs[index + 1].focus();
				} else if (index === codeInputs.length - 1) {
					// All digits entered, validate code
					this.blur();
					validateCode();
				}
			});
	
		//	Handle backspace to move focus backward
			input.addEventListener("keydown", function (event) {
				if (event.key === "Backspace" && this.value === "" && index > 0) {
					codeInputs[index - 1].focus();
				}
			});
		});

	}	
	
	function submitPhoneNumber() {
		
		const phoneNumber = phoneInput.value;
		
		if (isValidPhoneNumber(phoneNumber)) {
			
			getUserBusinessRegs(phoneNumber);
//				.then(bizRegistrations => {
				if (bizID in bizRegistrations) {
						
					console.log(`${phoneNumber} is already registered with ${bizID}!`)
				}
				else {
						
					console.log(`${phoneNumber} not yet registered with ${bizID}`);

					requestAuthenticationCode(phoneNumber)
						.then(serverCode => {
							if (serverCode) {
								// Handle the serverCode
								console.log(`got a code from server: ${serverCode}`)
							} else {
								// Handle the case where no auth code was returned
								console.error(`got not auth code from server!!`)
							}
						})
						.catch(error => {
							// Handle any unexpected errors
							console.error("Unexpected error:", error);
						});
					
					showModal("A verification code was sent to your phone from a (512) number. Enter it below just to confirm you're you...", true);
				}
//			})			
		} else {
			
			alert('Please enter a valid phone number.');
		}
	}

	function isValidPhoneNumber(phone) {
		const regex = /^\(\d{3}\) \d{3}-\d{4}$/;
		return regex.test(phone);
	}

	function validateCode() {
		const code = Array.from(codeInputs).map(input => input.value).join("");
		if (code.length === 4) {
			
			console.log("Validating code:", code);
			// Add your validation logic here
			
			// Call verifyAuthenticationCode and handle the result
			verifyAuthenticationCode(code)
				.then(isAuthenticated => {
					if (isAuthenticated) {
	
						console.log("Authentication successful!");
						console.log("User Profile:", userProfile);
						console.log("User Token:", userToken);
						
						letEmOnIn();					
						registerBusinessUser(); // associate user with biz
	
				} else {
					// Authentication failed, handle the error
					console.error("Authentication failed!");
					
					// reset the verification input so they can try again?
					showModal("Oops! That didn't work.", true)
				}
			})
			.catch(error => {
				// Handle any unexpected errors
				console.error("Unexpected error:", error);
			});
		}
	}
	
	function showModal(message, showVerificationField) {
		modalMessage.textContent = message;
		if (showVerificationField) {
		//	verificationInput.classList.remove('hidden');
			confirmModal.show();
			codeInputs[0].focus();
			removeOutsideClickListener();
		} 
		else {
			verificationInput.classList.add('hidden');
			addOutsideClickListener();
		}
		modal.classList.remove('hidden');
	}

	// Remove the click listener to avoid unintended modal closures
	function removeOutsideClickListener() {
		modal.removeEventListener('click', outsideClickListener);
	}
	
	// Handle the click outside modal content to close it
	function outsideClickListener(event) {
		if (!modalContent.contains(event.target)) {
			modal.classList.add('hidden');
			removeOutsideClickListener();
		}
	}

	function letEmOnIn() {	

		confirmModal.hide();
		authForm.classList.add('hidden');

	//	topSectionHeader.textContent = `Hello, ${userProfile.firstName}!`;  // Update top section
		pageHeader.textContent = `Welcome back!`;

	//	Authenticated content

		dynamicContent.classList.remove('hidden');
		dynamicContent.innerHTML = `
			<p>(here's some stuff for you to look at)</p>
		`;

		caseSearch.classList.remove('hidden');  // Show the bottom section if authenticated
		countyInput.disabled = false;
		
		// Function to handle county autocomplete
		countyInput.addEventListener("input", function() {
			const query = countyInput.value.toLowerCase();
			suggestionsDiv.innerHTML = ""; // Clear previous suggestions
			if (query) {
				const matchingCounties = counties.filter(county => county.toLowerCase().startsWith(query));
				
				// Show suggestions if there are matches
				if (matchingCounties.length > 0) {
					suggestionsDiv.style.display = "block";
					matchingCounties.forEach(county => {
						const option = document.createElement("div");
						option.className = "dropdown-item";
						option.textContent = county;
						option.addEventListener("click", function() {
							countyInput.value = county; // Set input to selected county
							suggestionsDiv.style.display = "none"; // Hide suggestions
							caseNumberInput.disabled = false; // Enable the case number field
						});
						suggestionsDiv.appendChild(option);
					});
				} else {
					suggestionsDiv.style.display = "none";
				}
			} else {
				suggestionsDiv.style.display = "none";
			}
		});
		
		// Hide suggestions if the input loses focus
		countyInput.addEventListener("blur", function() {
			setTimeout(() => suggestionsDiv.style.display = "none", 100); // Delay to allow click
		});
		
		countyInput.addEventListener("focus", function() {
			if (suggestionsDiv.innerHTML) {
				suggestionsDiv.style.display = "block";
			}
		});
				
		// Handle case number autocomplete after county is selected
		caseNumberInput.addEventListener("input", function() {
			const selectedCounty = countyInput.value;
			if (selectedCounty && casesByCounty[selectedCounty]) {
				const matchingCases = casesByCounty[selectedCounty].filter(casenum => casenum.startsWith(caseNumberInput.value));
		
				// Autocomplete behavior (dropdown can be added here as well)
				if (matchingCases.length === 1) {
					caseNumberInput.value = matchingCases[0];
					showCaseDescription(selectedCounty, matchingCases[0]);
					submitBtn.disabled = false; // Enable submit button
				}
			}
		});
		
		// Show case description after both fields are valid
		function showCaseDescription(county, casenum) {
			// Assume a function fetchCaseDescription(county, casenum) that gets the description
			caseDescription.textContent = `Selected Case: ${county} County, Case #${casenum}`;
			caseDescription.style.display = "block";
		}
		
		// Submit function
		submitBtn.addEventListener("click", function() {
			const county = countyInput.value;
			const casenum = caseNumberInput.value;
			if (county && casenum) {
				addCase(county, casenum);
			}
		});
		
		function addCase(county, casenum) {
			// Placeholder function for adding the case
			console.log(`Adding case: County - ${county}, Case Number - ${casenum}`);
		}
	}
});


// Handle form submission
// document.getElementById('auth-form').addEventListener('submit', function(event) {
//	event.preventDefault();
//	const mobileNumber = document.getElementById('mobile-number').value;
//	startAuthenticationFlow(mobileNumber);
//	console.log(`TODO! authenticate this mobile: ${mobileNumber}`)
// });
