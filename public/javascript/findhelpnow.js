function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
class Professional {
    constructor(data) {
      this.name = data.name;
      this.ratings = data.ratings;
      this.experience = data.experience;
      this.distance = data.distance;
      this.photo = data.photo;
      this._id = data._id;
      this.contact = data.contact;
      this.city = data.city;
      this.skills = data.skills;
    }
  
    generateStars(ratings) {
      let stars = "";
      const r = typeof ratings === "number" ? ratings : 0;
      for (let i = 0; i < 5; i++) {
        stars += i < Math.floor(r)
          ? '<span class="filled">★</span>'
          : "<span>★</span>";
      }
      return stars;
    }
  
    renderCard() {
      const skills = Array.isArray(this.skills)
        ? this.skills.join(", ")
        : "N/A";
  
      return `
        <div class="card">
          <div class="worker-photo">
            <img src="${this.photo || "default-avatar.png"}" alt="${this.name}">
          </div>
          <div class="card-content">
            <h3>${this.name}</h3>
            <div class="rating-visual">
              ${this.generateStars(this.ratings)}
              <span>${this.ratings ?? "N/A"}/5</span>
            </div>
            <p>${this.experience} years experience</p>
            <p>${this.distance} km away</p>
            <p>Location: ${this.city ?? "N/A"}</p>
            <p>Skills: ${skills}</p>
            <button class="contact-btn">Contact</button>
          </div>
        </div>
      `;
    }
  }
  
  let allProfessionals = [];
  
  document.addEventListener("DOMContentLoaded", () => {
    console.log("findhelpnow.js loaded");
  
    const workerCardsContainer = document.querySelector(".worker-cards");
    const loadingMessage = document.querySelector(".loading-message");
    const skillSearchInput = document.getElementById("search-skill");
    const citySearchInput = document.getElementById("search-city");
    const searchButton = document.querySelector(".find-help");
    const clearButton = document.querySelector(".clear-btn");
    const sortSelect = document.getElementById("sort-select");
  
    function renderProfessionalCards(list) {
      workerCardsContainer.innerHTML = "";
  
      if (!list.length) {
        workerCardsContainer.innerHTML =
          "<p class='no-results'>No professionals found.</p>";
        return;
      }
  
      list.forEach(p => {
        workerCardsContainer.innerHTML += p.renderCard();
      });
    }
  
    async function fetchAndDisplayProfessionals() {
      const skill = skillSearchInput?.value.trim() || "";
      const city  = citySearchInput?.value.trim() || "";
  
      if (!skill && !city) {
        workerCardsContainer.innerHTML =
          "<p class='no-results'>Enter skill or city to search.</p>";
        return;
      }
  
      if (loadingMessage) loadingMessage.style.display = "block";
      workerCardsContainer.innerHTML = "";
      if (searchButton) searchButton.disabled = true;
  
      const params = [];
      if (skill) {
        params.push(`skill=${encodeURIComponent(skill)}`);
        params.push(`name=${encodeURIComponent(skill)}`);
      }
      if (city) params.push(`city=${encodeURIComponent(city)}`);
  
      const url = `/api/workers?${params.join("&")}`;
      console.log("FETCH:", url);
  
      try {
        const res = await fetch(url);
        const data = await res.json();
  
        if (!Array.isArray(data)) {
          throw new Error("Backend did not return an array");
        }
        await delay(1000)
        allProfessionals = data.map(d => new Professional(d));
        renderProfessionalCards(allProfessionals);
  
      } catch (err) {
        console.error(err);
        workerCardsContainer.innerHTML =
          "<p class='error-message'>Something went wrong.</p>";
      } finally {
        if (loadingMessage) loadingMessage.style.display = "none";
        if (searchButton) searchButton.disabled = false;
      }
    }
  
    // SAFE event bindings
    if (searchButton) {
      searchButton.addEventListener("click", fetchAndDisplayProfessionals);
    }
  
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        skillSearchInput.value = "";
        citySearchInput.value = "";
        workerCardsContainer.innerHTML = "";
        if (loadingMessage) loadingMessage.style.display = "none";
      });
    }
  
    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        const sorted = [...allProfessionals];
  
        if (sortSelect.value === "experience") {
          sorted.sort((a, b) => b.experience - a.experience);
        }
        if (sortSelect.value === "rating") {
          sorted.sort((a, b) => b.ratings - a.ratings);
        }
        if (sortSelect.value === "distance") {
          sorted.sort((a, b) => a.distance - b.distance);
        }
  
        renderProfessionalCards(sorted);
      });
    }
  });
  