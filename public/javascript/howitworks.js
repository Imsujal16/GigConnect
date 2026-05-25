document.addEventListener("DOMContentLoaded", async () => {
    const stepsContainer = document.getElementById("stepsContainer");

    if (!stepsContainer) {
        console.error("Error: The 'stepsContainer' element was not found in how-it-works.html. Please ensure it exists.");
        return;
    }

    try {
        const response = await fetch('/assets/howitworks.json');
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status} - Could not load howitworks.json`);
        }
        const steps = await response.json();

        stepsContainer.innerHTML = ''; 

        steps.forEach((step) => {
            const stepElement = document.createElement('div');
            stepElement.classList.add('timeline-step');

            stepElement.innerHTML = `
                <div class="step-icon-wrapper">
                    <img src="${step.icon}" alt="${step.title} icon" class="step-icon">
                </div>
                <div class="step-content-wrapper">
                    <h3>${step.stepNumber}. ${step.title}</h3>
                    <p>${step.description}</p>
                </div>
            `;
            stepsContainer.appendChild(stepElement);
        });

    } catch (error) {
        console.error("An error occurred while loading or rendering 'How It Works' steps:", error);
        if (stepsContainer) {
            stepsContainer.innerHTML = '<p class="error-message">Failed to load "How It Works" steps.Ensure `assets/howitworks.json` exists and is valid, and image paths are correct.</p>';
        }
    }
});