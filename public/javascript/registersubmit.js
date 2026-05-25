document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".registration-form");
  if (!form) return;

  const message = document.getElementById("reg-form-message");
  const submitButton = form.querySelector('button[type="submit"]');

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const phoneInput = document.getElementById("phone");
  const primarySkillInput = document.getElementById("primary-skill");
  const secondarySkillsInput = document.getElementById("secondary-skills");
  const cityInput = document.getElementById("city");
  const experienceInput = document.getElementById("experience");
  const photoInput = document.getElementById("photo");
  const descriptionInput = document.getElementById("description");
  const termsCheckbox = document.getElementById("agree-terms");

  function showMessage(text, state = "info") {
    message.textContent = text;
    message.classList.remove("is-error", "is-success", "is-info");
    message.classList.add(`is-${state}`);
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = (nameInput?.value || "").trim();
    const email = (emailInput?.value || "").trim();
    const phone = (phoneInput?.value || "").trim();
    const primarySkill = (primarySkillInput?.value || "").trim();
    const secondarySkills = (secondarySkillsInput?.value || "").trim();
    const city = (cityInput?.value || "").trim();
    const experience = Number((experienceInput?.value || "").trim());
    const photo = (photoInput?.value || "").trim();
    const description = (descriptionInput?.value || "").trim();
    const agreed = termsCheckbox?.checked;

    const combinedSkills = [primarySkill, secondarySkills].filter(Boolean).join(",");

    if (!name) return showMessage("Please enter your full name.", "error");
    if (!email && !phone) return showMessage("Please provide at least one contact method.", "error");
    if (!primarySkill) return showMessage("Please enter your primary skill.", "error");
    if (!city) return showMessage("Please enter your city.", "error");
    if (!Number.isFinite(experience) || experience < 0) {
      return showMessage("Please enter a valid number of years of experience.", "error");
    }
    if (!agreed) return showMessage("Please agree to the terms before continuing.", "error");

    const payload = {
      name,
      contact: phone || email,
      city,
      skills: combinedSkills,
      experience,
      ratings: 0,
      distance: 0,
      photo,
      description
    };

    submitButton.disabled = true;
    showMessage("Creating your professional profile...", "info");

    try {
      const response = await fetch("/api/workers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 201) {
        form.reset();
        showMessage(
          "Profile created successfully. You are now ready to appear in GigConnect search results.",
          "success"
        );
        return;
      }

      if (response.status === 409) {
        showMessage(data.message || "That contact already exists on the platform.", "error");
        return;
      }

      if (response.status === 422) {
        if (Array.isArray(data.errors) && data.errors.length) {
          showMessage(data.errors.map((item) => item.msg).join(" "), "error");
          return;
        }

        showMessage(data.message || "Please review the form details and try again.", "error");
        return;
      }

      showMessage(data.message || "Something went wrong while creating the profile.", "error");
    } catch (error) {
      console.error("Registration error:", error);
      showMessage("The request failed. Please try again in a moment.", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
});
