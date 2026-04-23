document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("discoverApp");
  if (!root) return;

  const DEFAULT_CITY = "Gurugram";

  const form = document.getElementById("discoverForm");
  const queryInput = document.getElementById("search-query");
  const cityInput = document.getElementById("search-city");
  const sortSelect = document.getElementById("sort-select");
  const verifiedToggle = document.getElementById("verified-only");
  const clearButton = document.getElementById("clear-search");
  const resultsHeading = document.getElementById("resultsHeading");
  const resultsSummary = document.getElementById("resultsSummary");
  const resultsGrid = document.getElementById("resultsGrid");
  const loadingState = document.getElementById("loadingState");

  const state = {
    query: root.dataset.initialQuery || "",
    city: root.dataset.initialCity || "",
    sort: root.dataset.initialSort || "relevance",
    verifiedOnly: root.dataset.initialVerified === "true",
    results: []
  };

  queryInput.value = state.query;
  cityInput.value = state.city;
  sortSelect.value = state.sort;
  verifiedToggle.checked = state.verifiedOnly;

  function escapeHtml(value = "") {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeSkills(skills) {
    if (Array.isArray(skills)) return skills.filter(Boolean);
    if (typeof skills === "string") {
      return skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);
    }
    return [];
  }

  function sortResults(list, sortKey) {
    const results = [...list];

    results.sort((left, right) => {
      const leftVerified = left.isVerified ? 1 : 0;
      const rightVerified = right.isVerified ? 1 : 0;

      switch (sortKey) {
        case "rating":
          return (right.ratings - left.ratings) || (right.experience - left.experience);
        case "experience":
          return (right.experience - left.experience) || (right.ratings - left.ratings);
        case "distance":
          return (left.distance - right.distance) || (right.ratings - left.ratings);
        case "newest":
          return new Date(right.createdAt) - new Date(left.createdAt);
        default:
          return (
            (rightVerified - leftVerified) ||
            (right.ratings - left.ratings) ||
            (right.experience - left.experience) ||
            (left.distance - right.distance)
          );
      }
    });

    return results;
  }

  function getVisibleResults() {
    const filtered = state.verifiedOnly
      ? state.results.filter((worker) => worker.isVerified)
      : [...state.results];

    return sortResults(filtered, state.sort);
  }

  function updateUrl() {
    const params = new URLSearchParams();
    if (state.query) params.set("skill", state.query);
    if (state.city) params.set("city", state.city);
    if (state.sort && state.sort !== "relevance") params.set("sort", state.sort);
    if (state.verifiedOnly) params.set("verified", "true");

    const nextUrl = params.toString() ? `/findHelpNow?${params.toString()}` : "/findHelpNow";
    window.history.replaceState({}, "", nextUrl);
  }

  function formatPhone(value = "") {
    const digits = String(value).replace(/[^\d]/g, "");
    if (digits.length === 10) {
      return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
    }

    return String(value || "").trim();
  }

  function renderSkeletons() {
    resultsGrid.innerHTML = Array.from({ length: 3 }, () => `
      <article class="skeleton-card">
        <div class="skeleton-line is-short"></div>
        <div class="skeleton-line is-medium"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line is-medium"></div>
      </article>
    `).join("");
  }

  function updateHeading(list) {
    const pieces = [];
    if (state.query) pieces.push(`for "${state.query}"`);
    if (state.city) pieces.push(`in ${state.city}`);

    if (state.query || state.city) {
      resultsHeading.textContent = `${list.length} professional${list.length === 1 ? "" : "s"} ${pieces.join(" ")}`.trim();
      resultsSummary.textContent = state.verifiedOnly
        ? "Verified-only mode is active."
        : "Compare experience, ratings, and distance before you contact someone.";
      return;
    }

    resultsHeading.textContent = `Featured professionals around ${DEFAULT_CITY}`;
    resultsSummary.textContent =
      "Browse local professionals first, then narrow the list only when you need to.";
  }

  function renderEmptyState() {
    resultsGrid.innerHTML = `
      <div class="empty-state">
        <h3>No professionals matched that search.</h3>
        <p>Try a broader service, a nearby location, or start with one of the suggested categories.</p>
        <div class="empty-actions">
          <button type="button" class="chip-button" data-suggest-query="Electrician">Electrician</button>
          <button type="button" class="chip-button" data-suggest-query="Plumber">Plumber</button>
          <button type="button" class="chip-button" data-suggest-query="Driver">Driver</button>
        </div>
      </div>
    `;
  }

  function renderResults() {
    const visibleResults = getVisibleResults();
    updateHeading(visibleResults);

    if (!visibleResults.length) {
      renderEmptyState();
      return;
    }

    resultsGrid.innerHTML = visibleResults
      .map((worker) => {
        const skills = normalizeSkills(worker.skills);
        const description =
          worker.description ||
          "Experienced local professional available for nearby service requests and repeat work.";
        const photo = encodeURI(worker.photo || "/assets/gigconnect.logo.png");
        const similarSearchHref = `/findHelpNow?skill=${encodeURIComponent(skills[0] || worker.name)}&city=${encodeURIComponent(worker.city || DEFAULT_CITY)}`;
        const bookHref = worker.id ? `/book-service/${encodeURIComponent(worker.id)}` : "/contactus";
        const price = Number(worker.startingPrice || worker.hourlyRateInr || 0);
        const phoneDisplay = formatPhone(worker.phone || worker.contact);
        const emailDisplay = String(worker.email || "").trim();
        const hasDirectContact = Boolean(phoneDisplay || emailDisplay);
        const contactPanelId = `discover-contact-${escapeHtml(String(worker.id || worker._id || worker.name).replace(/[^a-zA-Z0-9_-]/g, "-"))}`;
        const priceLabel = price > 0
          ? new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0
            }).format(price)
          : "Price on request";

        return `
          <article class="result-card">
            <div class="result-card-top">
              <div class="result-identity">
                <img
                  class="result-avatar"
                  src="${escapeHtml(photo)}"
                  alt="${escapeHtml(worker.name)}"
                  onerror="this.src='/assets/gigconnect.logo.png'"
                >
                <div>
                  <h3>${escapeHtml(worker.name)}</h3>
                  <div class="result-badges">
                    <span class="result-badge is-rating">${escapeHtml((Number(worker.ratings) || 0).toFixed(1))} / 5 rating</span>
                    ${worker.isVerified ? '<span class="result-badge is-verified">Verified profile</span>' : '<span class="result-badge">New profile</span>'}
                  </div>
                </div>
              </div>

              <div class="result-badges">
                <span class="result-badge">${escapeHtml(worker.city || DEFAULT_CITY)}</span>
              </div>
            </div>

            <div class="result-meta">
              <span>${escapeHtml(String(worker.experience || 0))} years experience</span>
              <span>${escapeHtml(String(worker.distance || 0))} km away</span>
              <span>Starts at ${escapeHtml(priceLabel)}</span>
            </div>

            <div class="result-skills">
              ${skills.map((skill) => `<span class="skill-tag">${escapeHtml(skill)}</span>`).join("")}
            </div>

            <p class="result-description">${escapeHtml(description)}</p>

            <div class="result-actions">
              <a href="${escapeHtml(bookHref)}" class="button button-primary">Book now</a>
              ${
                hasDirectContact
                  ? `<button type="button" class="button button-secondary" data-contact-toggle data-contact-default="Contact now" aria-expanded="false" aria-controls="${contactPanelId}">Contact now</button>`
                  : '<a href="/contactus" class="button button-secondary">Request support</a>'
              }
              <a href="${escapeHtml(similarSearchHref)}" class="button button-secondary">View similar</a>
            </div>

            ${
              hasDirectContact
                ? `
                  <div class="contact-reveal glass-inset" id="${contactPanelId}" hidden>
                    <span class="contact-reveal-label">Direct contact</span>
                    ${phoneDisplay ? `<strong class="contact-reveal-value">${escapeHtml(phoneDisplay)}</strong>` : ""}
                    ${emailDisplay ? `<span class="contact-reveal-meta">${escapeHtml(emailDisplay)}</span>` : ""}
                    <p class="contact-reveal-copy">Use these details directly without leaving GigConnect.</p>
                  </div>
                `
                : ""
            }
          </article>
        `;
      })
      .join("");
  }

  async function fetchProfessionals() {
    loadingState.hidden = false;
    renderSkeletons();

    const params = new URLSearchParams();
    if (state.query) {
      params.set("skill", state.query);
      params.set("name", state.query);
    }
    if (state.city) params.set("city", state.city);

    const endpoint = params.toString() ? `/api/workers?${params.toString()}` : "/api/workers";

    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("Worker API did not return an array.");
      }

      state.results = data.map((worker) => ({
        ...worker,
        skills: normalizeSkills(worker.skills)
      }));

      updateUrl();
      renderResults();
    } catch (error) {
      console.error("Failed to fetch professionals:", error);
      resultsHeading.textContent = "Unable to load professionals right now";
      resultsSummary.textContent = "Please try again in a moment or contact support if the problem continues.";
      resultsGrid.innerHTML = `
        <div class="empty-state">
          <h3>Something went wrong while loading the marketplace.</h3>
          <p>Please try again or contact the GigConnect team if the issue continues.</p>
          <div class="empty-actions">
            <a href="/contactus" class="button button-primary">Contact support</a>
          </div>
        </div>
      `;
    } finally {
      loadingState.hidden = true;
    }
  }

  function applyFormState() {
    state.query = queryInput.value.trim();
    state.city = cityInput.value.trim();
    state.sort = sortSelect.value;
    state.verifiedOnly = verifiedToggle.checked;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    applyFormState();
    await fetchProfessionals();
  });

  sortSelect.addEventListener("change", () => {
    applyFormState();
    updateUrl();
    renderResults();
  });

  verifiedToggle.addEventListener("change", () => {
    applyFormState();
    updateUrl();
    renderResults();
  });

  clearButton.addEventListener("click", async () => {
    state.query = "";
    state.city = "";
    state.sort = "relevance";
    state.verifiedOnly = false;

    queryInput.value = "";
    cityInput.value = "";
    sortSelect.value = "relevance";
    verifiedToggle.checked = false;

    updateUrl();
    await fetchProfessionals();
  });

  root.addEventListener("click", (event) => {
    const suggestedButton = event.target.closest("[data-suggest-query]");
    if (!suggestedButton) return;

    queryInput.value = suggestedButton.dataset.suggestQuery || "";
    queryInput.focus();
  });

  fetchProfessionals();
});
