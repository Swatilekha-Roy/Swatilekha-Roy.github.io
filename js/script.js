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

// Fetch and inject reusable components (header/footer/divider) into the page
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

/* Helper: Generic JSON Fetcher */
async function fetchJSON(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Failed to load ${url}: ${resp.statusText}`);
    return await resp.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

/* Helper: Render Block Items */
function renderBlocks(items, container, sectionClass) {
  container.innerHTML = "";
  (items || []).forEach((item) => {
    const div = document.createElement("div");
    div.className = `col-12 col-md-6 wow fadeIn ${sectionClass}`;

    const title = document.createElement("h4");
    title.textContent = item.title || "";
    div.appendChild(title);

    if (item.date) {
      const em = document.createElement("em");
      em.textContent = item.date;
      div.appendChild(em);
    }

    if (item.description) {
      const p = document.createElement("p");
      p.innerHTML = Array.isArray(item.description)
        ? item.description.join("<br />")
        : item.description;
      div.appendChild(p);
    }
    container.appendChild(div);
  });
}

/* Helper: Render Card Items */
async function renderCards(
  items,
  container,
  cardClass,
  bodyClass,
  hasButton = false,
) {
  container.innerHTML = ""; // Clear container initially

  const cardElements = []; // To store fully constructed card DOM elements
  const imageLoadPromises = []; // To track image loading for each card

  (items || []).forEach((item) => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-md-4 wow fadeIn";

    const card = document.createElement("div");
    card.className = `card mb-4 ${cardClass}`;

    if (item.img) {
      const img = document.createElement("img"); // Create the actual img element for the DOM
      img.className = "card-img-top";
      img.alt = item.title || "Image";

      const imgLoadPromise = new Promise((resolve) => {
        const tempImg = new Image(); // Use a temporary Image object to pre-load
        tempImg.src = item.img;

        tempImg.onload = () => {
          img.src = item.img; // Set src for the actual img element after pre-load
          card.prepend(img); // Prepend so image is at the top of the card
          resolve();
        };
        tempImg.onerror = () => {
          console.warn(
            `Failed to load image: ${item.img}. Skipping image for this card.`,
          );
          // Optionally, add a placeholder image here if desired
          resolve(); // Resolve even if image fails to load, so other cards can render
        };
      });
      imageLoadPromises.push(imgLoadPromise);
    }

    const body = document.createElement("div");
    body.className = `card-body ${bodyClass}`;

    const title = document.createElement("h4");
    title.className = "card-title";
    title.textContent = item.title || "";
    body.appendChild(title);

    if (item.description) {
      const p = document.createElement("p");
      p.className = "card-text";
      p.textContent = item.description;
      body.appendChild(p); // Append description
    }

    if (hasButton && item.link) {
      const btn = document.createElement("a");
      btn.href = item.link;
      btn.className = "btn btn-primary btn-sm btn-film";
      btn.innerHTML = 'Watch <i class="fa-solid fa-play"></i>';
      body.appendChild(btn); // Append button
    }

    card.appendChild(body); // Append body to card
    col.appendChild(card);
    cardElements.push(col); // Store the column element
  });

  // Wait for all images to load (or fail) before appending any cards to the DOM
  await Promise.all(imageLoadPromises);
  cardElements.forEach((el) => container.appendChild(el));
}

/* Main entry point */
document.addEventListener("DOMContentLoaded", async () => {
  await includeComponents();

  await Promise.all([
    (async () => {
      const data = await fetchJSON("data/experience.json");
      if (!data) return;
      const workCon = document.getElementById("work-experience");
      const leadCon = document.getElementById("leadership-experience");
      if (workCon) renderBlocks(data.work, workCon, "experience-section");
      if (leadCon) renderBlocks(data.leadership, leadCon, "experience-section");
    })(),
    (async () => {
      const data = await fetchJSON("data/highlights.json");
      if (!data) return;
      ["impact", "tech", "literary"].forEach((key) => {
        const con = document.getElementById(`${key}-highlights`);
        if (con) {
          con.innerHTML = "";
          (data[`${key}Highlights`] || []).forEach((item) => {
            const li = document.createElement("li");
            li.innerHTML = `${item.text} - <em>${item.date}</em>`;
            con.appendChild(li);
          });
        }
      });
    })(),
    (async () => {
      const data = await fetchJSON("data/impact.json");
      if (!data) return;
      const volCon = document.getElementById("volunteer-impact");
      const proCon = document.getElementById("project-impact");
      if (volCon) renderBlocks(data.volunteering, volCon, "volunteer-section");
      if (proCon)
        await renderCards(data.projects, proCon, "pro-card", "pro-card-body");
    })(),
    (async () => {
      const data = await fetchJSON("data/art.json");
      if (!data) return;
      const pubCon = document.querySelector(".publication-ul");
      const filmCon = document.getElementById("onscreen-art");
      if (pubCon) {
        pubCon.innerHTML = "";
        (data.publications || []).forEach((item) => {
          const li = document.createElement("li");
          li.innerHTML = `${item.text} - <em>${item.date}</em> ${item.link ? `<a href="${item.link}">Read here</a>` : ""}<br />`;
          pubCon.appendChild(li);
        });
      }
      if (filmCon)
        await renderCards(
          data.film,
          filmCon,
          "film-card",
          "film-card-body",
          true,
        );
    })(),
  ]);

  // Artistic handwriting animation for the homepage name
  const nameHome = document.querySelector(".name-home");
  if (nameHome) {
    const text = nameHome.textContent.trim();
    nameHome.textContent = "";
    let cumulativeDelay = 0;

    [...text].forEach((char, i) => {
      const span = document.createElement("span");
      span.textContent = char === " " ? "\u00A0" : char;
      span.classList.add("char");
      // Add a base delay plus a random variance to simulate human typing/writing rhythm
      const randomJitter = Math.random() * 0.12;
      cumulativeDelay += 0.10 + randomJitter;
      span.style.animationDelay = `${cumulativeDelay}s`;
      nameHome.appendChild(span);
    });
  }

  preloaderReady = true;
  maybeHidePreloader();

  if (typeof WOW !== "undefined") new WOW().init();

  // Initialize Intersection Observer to trigger header underlines on scroll
  const headerObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          headerObserver.unobserve(entry.target); // Ensure it only animates once
        }
      });
    },
    { threshold: 0.2 },
  );

  document
    .querySelectorAll("h3")
    .forEach((header) => headerObserver.observe(header));
});