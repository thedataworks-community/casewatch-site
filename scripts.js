const BIZ = "dworks";
const APP = "casewatch";

document.addEventListener("DOMContentLoaded", function() {
	const dynamicContentDiv = document.getElementById('dynamic-content');
	const bottomSection = document.querySelector('.bottom-section');
	const topSectionHeader = document.querySelector('.top-section h1');

	j2AuthInit( BIZ,APP ); // userProfile, isAuthenticated
	
	if (isAuthenticated) {

		// Authenticated content
		bottomSection.classList.remove('hidden');  // Show the bottom section if authenticated
		topSectionHeader.textContent = `Hello, ${userProfile.firstName}!`;  // Update top section
		dynamicContentDiv.innerHTML = `
			<h2>Welcome back!</h2>
			<p>(here's some stuff for you to look at)</p>
			`;
	} 
});

// Handle form submission
document.getElementById('auth-form').addEventListener('submit', function(event) {
	event.preventDefault();
	const mobileNumber = document.getElementById('mobile-number').value;
//	startAuthenticationFlow(mobileNumber);
	console.log(`TODO! authenticate this mobile: ${mobileNumber}`)
});
