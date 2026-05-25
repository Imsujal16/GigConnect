document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navPanel = document.querySelector("[data-nav-panel]");

  if (navToggle && navPanel) {
    navToggle.addEventListener("click", () => {
      const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isExpanded));
      navPanel.classList.toggle("is-open", !isExpanded);
    });

    navPanel.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navToggle.setAttribute("aria-expanded", "false");
        navPanel.classList.remove("is-open");
      });
    });
  }

  document.addEventListener("click", (event) => {
    const contactToggle = event.target.closest("[data-contact-toggle]");
    if (contactToggle) {
      const panelId = contactToggle.getAttribute("aria-controls");
      const panel = panelId ? document.getElementById(panelId) : null;
      if (!panel) return;

      const isExpanded = contactToggle.getAttribute("aria-expanded") === "true";
      const defaultLabel = contactToggle.dataset.contactDefault || "Contact now";

      document.querySelectorAll("[data-contact-toggle][aria-expanded='true']").forEach((button) => {
        if (button === contactToggle) return;
        const targetId = button.getAttribute("aria-controls");
        const targetPanel = targetId ? document.getElementById(targetId) : null;
        button.setAttribute("aria-expanded", "false");
        button.textContent = button.dataset.contactDefault || "Contact now";
        if (targetPanel) targetPanel.hidden = true;
      });

      contactToggle.setAttribute("aria-expanded", String(!isExpanded));
      contactToggle.textContent = isExpanded ? defaultLabel : "Hide contact";
      panel.hidden = isExpanded;
      return;
    }

    document.querySelectorAll(".nav-dropdown[open]").forEach((dropdown) => {
      if (!dropdown.contains(event.target)) {
        dropdown.removeAttribute("open");
      }
    });
  });

  document.querySelectorAll("[data-fill-target]").forEach((button) => {
    button.addEventListener("click", () => {
      const targetKey = button.dataset.fillTarget;
      const targetValue = button.dataset.fillValue || "";
      const scope = button.closest("form") || document;
      const targetField =
        scope.querySelector(`#${CSS.escape(targetKey)}`) ||
        scope.querySelector(`[name="${CSS.escape(targetKey)}"]`) ||
        document.getElementById(targetKey) ||
        document.querySelector(`[name="${CSS.escape(targetKey)}"]`);

      if (!targetField) return;

      targetField.value = targetValue;
      targetField.dispatchEvent(new Event("input", { bubbles: true }));
      targetField.focus();
    });
  });

  const revealTargets = document.querySelectorAll("[data-reveal]");
  if (!revealTargets.length) return;

  if (!("IntersectionObserver" in window)) {
    revealTargets.forEach((target) => target.classList.add("is-visible"));
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      rootMargin: "0px 0px -80px 0px",
      threshold: 0.15
    }
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
});
