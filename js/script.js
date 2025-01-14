document.addEventListener('DOMContentLoaded', () => {
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