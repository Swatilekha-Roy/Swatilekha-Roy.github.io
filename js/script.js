/* Website Preloader */
// Preloader state flags
let preloaderReady = false;
let windowLoaded = false;

// Hide the preloader with a fade-out animation
function hidePreloader() {
  const preloader = document.querySelector(".pre-loader");
  if (!preloader) return;

  preloader.style.transition = "opacity 0.5s ease";
  preloader.style.opacity = "0";

  // Remove the element from view after the fade animation completes
  setTimeout(() => {
    preloader.style.display = "none";
  }, 500);
}

// Only hide the preloader after both the window has loaded and components are ready
function maybeHidePreloader() {
  if (preloaderReady && windowLoaded) {
    hidePreloader();
  }
}

// Track when the window has fully loaded
window.addEventListener("load", function () {
  windowLoaded = true;
  maybeHidePreloader();
});

/* Contact Form Handling */
// Handle contact form submission without refreshing the page
$("#contact-form").on("submit", async function (e) {
  e.preventDefault();

  // Spam/honeypot protection: block submissions if the honeypot field has a value
  if ($("#_anna").val().length != 0) {
    return false;
  }

  const $form = $(this);
  const $submitBtn = $form.find('button[type="submit"]');
  const $successMsg = $("#success-message");

  // Show a loading state
  $submitBtn.prop("disabled", true).text("Sending...");

  // Convert FormData to a plain object and ensure access_key is a single string
  const formData = Object.fromEntries(new FormData(this));
  formData.access_key = "5273e7fd-9067-4e85-a420-51ff86dd382d";

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (response.ok) {
      $successMsg
        .html('<i class="fas fa-check-circle"></i> Thanks for writing me. ._.')
        .css({ "margin-left": "2%", color: "inherit" });
      $form[0].reset();
    } else {
      throw new Error(data.message || "Form submission failed.");
    }
  } catch (error) {
    console.error("Submission Error:", error);
    $successMsg
      .html('<i class="fas fa-exclamation-circle"></i> Oops! Something stinks.')
      .css("color", "red");
  } finally {
    $submitBtn
      .prop("disabled", false)
      .html('Send <i class="fa-solid fa-paper-plane"></i>');
  }
});

/* Dynamic Content Loading and Navigation Highlighting */
// Set active navigation link based on current page
function setActiveNavLink() {
  const currentPage = window.location.pathname.split("/").pop() || "index.html";
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    link.classList.remove("active");
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });
}

// Fetch and inject reusable components (header/footer) into the page
async function includeComponents() {
  const components = document.querySelectorAll("[data-component]");

  for (const el of components) {
    const name = el.getAttribute("data-component");
    const resp = await fetch(`components/${name}.html`);
    if (resp.ok) {
      const text = await resp.text();
      el.innerHTML = text;

      // Execute any scripts found in the component (innerHTML won't run them)
      const scripts = el.querySelectorAll("script");
      scripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value),
        );
        newScript.textContent = oldScript.textContent;
        el.appendChild(newScript);
        oldScript.remove();
      });
    }
  }

  // Set active nav link after components are injected
  setActiveNavLink();

  // Initialize Bootstrap tooltips for dynamic components
  const tooltipTriggerList = document.querySelectorAll(
    '[data-bs-toggle="tooltip"]',
  );
  if (typeof bootstrap !== "undefined") {
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }

  // Load GoatCounter visitor statistics
  updateVisitorCount();
}

/* Scroll-to-Top Button Functionality */
// Show or hide the scroll-to-top button based on page scroll position
$(window).on("scroll", function () {
  if ($(this).scrollTop() >= 50) {
    $("#return-to-top").fadeIn(200);
  } else {
    $("#return-to-top").fadeOut(200);
  }
});

// Scroll smoothly to the top when the button is clicked
$(document).on("click", "#return-to-top", function (e) {
  e.preventDefault();
  $("html, body").animate({ scrollTop: 0 }, 500);
});

/* Visitor Count Display Logic (Fetching from GoatCounter) */
function updateVisitorCount() {
  const statsEl = document.getElementById("stats");
  if (!statsEl) return;

  fetch("https://swatilekharoy.goatcounter.com/counter/TOTAL.json")
    .then((resp) => resp.json())
    .then((data) => {
      // Use count_unique for distinct visitors or .count for total hits
      const count = Number(data.count_unique || data.count || 0);

      // If the count is 0, display "beautiful" instead as requested
      if (count === 0) {
        statsEl.innerText = "beautiful";
      } else {
        statsEl.innerText = count.toLocaleString();
      }
    })
    .catch(() => {
      // If the counter fails to load (e.g. ad-blocker), fallback to "beautiful"
      statsEl.innerText = "beautiful";
    });
}

/* Main entry point: include shared components, load experiences, then initialize WOW */
document.addEventListener("DOMContentLoaded", async () => {
  await includeComponents();

  // Load all data in parallel for better performance
  await Promise.all([loadExperience(), loadHighlights(), loadImpact()]);

  preloaderReady = true;
  maybeHidePreloader();

  if (typeof WOW !== "undefined") {
    new WOW().init();
  }
});

/* Load work experiences from JSON and render into experience containers */
async function loadExperience() {
  const workContainer = document.getElementById("work-experience");
  const leadershipContainer = document.getElementById("leadership-experience");
  if (!workContainer && !leadershipContainer) return;

  try {
    const resp = await fetch("data/experience.json");
    if (!resp.ok) {
      console.error("Failed to load experience data:", resp.statusText);
      return;
    }
    const json = await resp.json();

    if (workContainer) renderExperienceList(json.work || [], workContainer);
    if (leadershipContainer)
      renderExperienceList(json.leadership || [], leadershipContainer);
  } catch (err) {
    console.error("Error loading experience:", err);
  }
}

function renderExperienceList(items, container) {
  container.innerHTML = "";
  items.forEach((item) => {
    const experienceItem = document.createElement("div");
    experienceItem.className = "col-12 col-md-6 experience-section wow fadeIn";

    const title = document.createElement("h4");
    title.textContent = item.title || "";
    experienceItem.appendChild(title);

    if (item.date) {
      const dateElement = document.createElement("em");
      dateElement.textContent = item.date;
      experienceItem.appendChild(dateElement);
    }

    if (item.description) {
      const p = document.createElement("p");
      p.innerHTML = Array.isArray(item.description)
        ? item.description.join("<br />")
        : item.description;
      experienceItem.appendChild(p);
    }

    container.appendChild(experienceItem);
  });
}

/* Load accolades/highlights from JSON and render into lists */
async function loadHighlights() {
  const impactContainer = document.getElementById("impact-highlights");
  const techContainer = document.getElementById("tech-highlights");
  const literaryContainer = document.getElementById("literary-highlights");
  if (!impactContainer && !techContainer && !literaryContainer) return;

  try {
    const resp = await fetch("data/highlights.json");
    if (!resp.ok) {
      console.error("Failed to load highlights data:", resp.statusText);
      return;
    }
    const json = await resp.json();

    if (impactContainer)
      renderHighlightList(json.impactHighlights || [], impactContainer);
    if (techContainer)
      renderHighlightList(json.techHighlights || [], techContainer);
    if (literaryContainer)
      renderHighlightList(json.literaryHighlights || [], literaryContainer);
  } catch (err) {
    console.error("Error loading highlights:", err);
  }
}

function renderHighlightList(items, container) {
  container.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");

    // Create the description text
    const textNode = document.createTextNode(`${item.text} - `);
    li.appendChild(textNode);

    // Create the italicized date
    const em = document.createElement("em");
    em.textContent = item.date;
    li.appendChild(em);

    container.appendChild(li);
  });
}

/* Load impact/volunteering and project data from JSON and render into sections */
async function loadImpact() {
  const volunteerContainer = document.getElementById("volunteer-impact");
  const projectContainer = document.getElementById("project-impact");
  // Only return if both containers are missing, otherwise proceed if at least one exists
  if (!volunteerContainer && !projectContainer) return;

  try {
    const resp = await fetch("data/impact.json");
    if (!resp.ok) {
      console.error("Failed to load impact data:", resp.statusText);
      return;
    }
    const json = await resp.json();

    if (volunteerContainer) {
      renderVolunteeringList(json.volunteering || [], volunteerContainer);
    }
    if (projectContainer) {
      renderProjectItems(json.projects || [], projectContainer);
    }
  } catch (err) {
    console.error("Error loading impact:", err);
  }
}

// Renders volunteering items into the specified container
function renderVolunteeringList(items, container) {
  container.innerHTML = "";
  items.forEach((item) => {
    const itemDiv = document.createElement("div");
    itemDiv.className = "col-12 col-md-6 wow fadeIn volunteer-section"; // Apply classes as per template

    const title = document.createElement("h4");
    title.textContent = item.title;
    itemDiv.appendChild(title);

    if (item.date) {
      const date = document.createElement("em");
      date.textContent = item.date;
      itemDiv.appendChild(date);
    }

    // Description is an array in JSON, but rendered as a single <p> in the template
    if (item.description) {
      const p = document.createElement("p");
      p.innerHTML = Array.isArray(item.description)
        ? item.description.join("<br />")
        : item.description;
      itemDiv.appendChild(p);
    }

    container.appendChild(itemDiv);
  });
}

// Renders project items into the specified container
function renderProjectItems(items, container) {
  container.innerHTML = "";
  items.forEach((item) => {
    // Outer column div matching legacy projects.html
    const colDiv = document.createElement("div");
    colDiv.className = "col-sm-6 col-md-4 wow fadeIn";

    // Card container
    const cardDiv = document.createElement("div");
    cardDiv.className = "card pro-card mb-4";

    // Image at the top
    if (item.img) {
      const img = document.createElement("img");
      img.src = item.img;
      img.className = "card-img-top";
      img.alt = item.title || "Project image";
      cardDiv.appendChild(img);
    }

    // Card body for content
    const cardBody = document.createElement("div");
    cardBody.className = "card-body pro-card-body";

    // Project Name (Title)
    const title = document.createElement("h4");
    title.className = "card-title";
    title.textContent = item.title;
    cardBody.appendChild(title);

    // Project Description
    if (item.description) {
      const p = document.createElement("p");
      p.className = "card-text";
      p.textContent = item.description;
      cardBody.appendChild(p);
    }

    cardDiv.appendChild(cardBody);
    colDiv.appendChild(cardDiv);
    container.appendChild(colDiv);
  });
}