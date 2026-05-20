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
    console.warn(
      // Log a warning if honeypot is triggered
      "Honeypot field was filled, likely a bot. Blocking submission.",
    );
    return false;
  }

  const $form = $(this);
  const $submitBtn = $form.find('button[type="submit"]');
  const $successMsg = $("#success-message");

  // Show a loading state
  $submitBtn.prop("disabled", true).text("Sending...");

  const formData = new FormData(this);
  // Use .set() instead of .append() to avoid sending duplicate access_key values
  formData.set("access_key", "5273e7fd-9067-4e85-a420-51ff86dd382d".trim());

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (response.ok) {
      $successMsg
        .html('<i class="fas fa-check-circle"></i> Thanks for contacting me!')
        .css({ "margin-left": "2%", color: "inherit" });
      $form[0].reset();
    } else {
      throw new Error(data.message || "Form submission failed.");
    }
  } catch (error) {
    console.error("Submission Error:", error);
    $successMsg
      .html(
        '<i class="fas fa-exclamation-circle"></i> Oops! Something went wrong.',
      )
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
    }
  }

  // Set active nav link after components are injected
  setActiveNavLink();

  preloaderReady = true;
  maybeHidePreloader();
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

/* Main entry point: include shared components, load experiences, then initialize WOW */
document.addEventListener("DOMContentLoaded", async () => {
  await includeComponents();
  await loadExperience();

  if (typeof WOW !== "undefined") {
    new WOW().init();
  }
});

/* Load work experiences from JSON and render into experience containers */
async function loadExperience() {
  try {
    const resp = await fetch("data/experience.json");
    if (!resp.ok) return maybeHidePreloader();
    const json = await resp.json();
    const experiences = json.experience_work || [];
    const leaderships = json.experience_leadership || [];
    const workContainer = document.getElementById("work-experience");
    const leadershipContainer = document.getElementById(
      "leadership-experience",
    );
    if (!workContainer || !leadershipContainer) return maybeHidePreloader();

    workContainer.innerHTML = "";
    leadershipContainer.innerHTML = "";

    renderExperienceList(experiences, workContainer);
    renderExperienceList(leaderships, leadershipContainer);

    maybeHidePreloader();
  } catch (err) {
    console.error("Error loading experience:", err);
    maybeHidePreloader();
  }
}

function renderExperienceList(items, container) {
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

    if (Array.isArray(item.description)) {
      const p = document.createElement("p");
      p.innerHTML = item.description.join("<br />");
      experienceItem.appendChild(p);
    } else if (typeof item.description === "string") {
      const p = document.createElement("p");
      p.innerHTML = item.description;
      experienceItem.appendChild(p);
    }

    container.appendChild(experienceItem);
  });
}
