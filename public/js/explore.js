// public/js/explore.js

// Wrap in IIFE
(function() {
  // Navbar scroll effect specific to explore page
  // NOTE: This is another instance of duplicated navbar code.
  // Consider moving generic navbar behavior to a single 'global.js' or 'script.js'.
  const navbarExplore = document.querySelector(".navbar"); // Renamed to avoid confusion if other scripts also define 'navbar'
  if (navbarExplore) {
      window.addEventListener("scroll", () => {
          if (window.scrollY > 50) {
              navbarExplore.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
              navbarExplore.style.backdropFilter = "blur(10px)";
              navbarExplore.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
          } else {
              navbarExplore.style.backgroundColor = "transparent";
              navbarExplore.style.boxShadow = "none";
          }
      });
  } else {
      console.warn('Navbar element not found for explore.js scroll effect.');
  }

  // Country data (can be defined outside DOMContentLoaded as it's just data)
  const countries = [
      { name: "Egypt", image: "../images/countries/egypt.avif", description: "Dive into Egypt’s sweets, spiced with ancient flavors." },
      { name: "USA", image: "../images/countries/usa.avif", description: "Pop-Tarts, Cheetos—salty and the bold crunch of American snacks." },
      { name: "UK", image: "../images/countries/uk.avif", description: "From tea to biscuits, British snacks that hit the spot." },
      { name: "Germany", image: "../images/images/countries/germany.avif", description: "Pretzels, bratwurst, and rich chocolate—Germany’s best." }, // Fix: image path was wrong (double /images)
      { name: "Mexico", image: "../images/countries/mexico.avif", description: "Spicy chili, sweet tamarind—Mexico’s snack magic." },
      { name: "China", image: "../images/countries/china.avif", description: "Savor dumplings, mooncakes, and crispy Chinese treats." },
      { name: "Japan", image: "../images/countries/japan.avif", description: "Pocky, matcha, and Japan’s unique snack style." },
      { name: "Korea", image: "../images/countries/korea.avif", description: "Bold kimchi, sweet rice cakes—Korea’s snacks speak flavor." }
  ];

  // ALL other code that interacts with DOM elements should be inside DOMContentLoaded
  document.addEventListener("DOMContentLoaded", async () => {

      const container = document.getElementById("scrollContainer");
      const content = document.getElementById("scrollContent");
      const bg = document.getElementById("background");
      const navDotsContainer = document.querySelector(".nav-dots");

      if (!container || !content || !bg || !navDotsContainer) {
          console.error("Explore page required elements (scrollContainer, scrollContent, background, nav-dots) not found.");
          return; // Exit if critical elements are missing
      }

      let isScrolling = false;

      function populateList() {
          content.innerHTML = "";
          navDotsContainer.innerHTML = "";
          countries.forEach((country, index) => {
              const countryDiv = createCountryElement(country);
              content.appendChild(countryDiv);
              const dot = document.createElement("div");
              dot.classList.add("nav-dot");
              dot.dataset.index = index;
              dot.dataset.country = country.name;
              dot.addEventListener("click", () => scrollToCountry(index));
              navDotsContainer.appendChild(dot);
          });
          container.scrollTop = 0;
      }

     function createCountryElement(country) {
          const countryDiv = document.createElement("div");
          countryDiv.classList.add("country");
          countryDiv.innerHTML = `
              <span>${country.name}</span>
              <p class="description">${country.description}</p>
              <button class="view-snacks">View Snacks</button>
          `;
          countryDiv.querySelector(".view-snacks").addEventListener("click", () => goToCountryPage(country.name));
          return countryDiv;
      } 

      function scrollToCountry(index) {
          const targetCountry = countries[index];
          const items = Array.from(content.children).filter(el => el.classList.contains("country"));
          const targetItem = items.find(item =>
              item.querySelector("span")?.textContent.trim() === targetCountry.name
          );
          if (targetItem) {
              const containerHeight = container.offsetHeight;
              const targetPosition = targetItem.offsetTop - (containerHeight / 2) + (targetItem.offsetHeight / 2);
              container.scrollTo({ top: targetPosition, behavior: "smooth" });
          }
      }

       function goToCountryPage(countryName) {
          const formattedName = countryName.toLowerCase();
          sessionStorage.setItem("lastSelectedCountry", formattedName);
          // IMPORTANT: Change this to use EJS routing or relative path if 'products.html' is not at root
          window.location.href = `/products?country=${formattedName}`; // Assuming Express route for /products
      }


      function highlightCenter() {
          const items = Array.from(content.children).filter(el => el.classList.contains("country"));
          const dots = document.querySelectorAll(".nav-dot");

          let closest = null;
          let minDistance = Infinity;
          let selectedName = "";

          items.forEach((item) => {
              const rect = item.getBoundingClientRect();
              const centerDistance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
              if (centerDistance < minDistance) {
                  minDistance = centerDistance;
                  closest = item;
                  selectedName = item.querySelector("span")?.textContent.trim();
              }
          });

          items.forEach(item => item.classList.remove("highlight"));
          dots.forEach(dot => dot.classList.remove("active"));

          if (closest) {
              closest.classList.add("highlight");
              const countryIndex = countries.findIndex(c => c.name === selectedName);
              const activeDot = Array.from(dots).find(dot => Number(dot.dataset.index) === countryIndex);
              if (activeDot) activeDot.classList.add("active");
              if (countryIndex !== -1) {
                  // Correct the image path for backgrounds
                  bg.style.backgroundImage = `url('/images/countries/${countries[countryIndex].image.split('/').pop()}')`;
                  bg.style.transition = "background-image 1s ease-in-out";
              }
          }
      }

      function appendList(direction) {
          const list = direction === 'down' ? countries : [...countries].reverse();
          list.forEach(country => {
              const countryDiv = createCountryElement(country);
              if (direction === 'down') {
                  content.appendChild(countryDiv);
              } else {
                  content.prepend(countryDiv);
              }
          });
          isScrolling = false;
      }

      container.addEventListener("scroll", () => {
          if (isScrolling) return;
          const containerHeight = container.offsetHeight;
          const contentHeight = content.offsetHeight;
          const scrollPosition = container.scrollTop;

          if (scrollPosition + containerHeight >= contentHeight - 50) {
              isScrolling = true;
              appendList('down');
          } else if (scrollPosition <= 50) {
              isScrolling = true;
              appendList('up');
          }
          highlightCenter();
      });

      document.addEventListener("keydown", (e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowRight") {
              smoothScrollToNextCountry("down");
          } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
              smoothScrollToNextCountry("up");
          }
      });

      function smoothScrollToNextCountry(direction) {
          const items = document.querySelectorAll(".country");
          let currentPosition = container.scrollTop;

          if (items.length === 0) return; // Prevent error if no items

          if (direction === "down") {
              currentPosition += items[0].offsetHeight;
          } else if (direction === "up") {
              currentPosition -= items[0].offsetHeight;
          }

          container.scrollTo({
              top: currentPosition,
              behavior: "smooth"
          });

          const containerHeight = container.offsetHeight;
          const contentHeight = content.offsetHeight;
          if (currentPosition + containerHeight >= contentHeight - 50) {
              appendList('down');
          } else if (currentPosition <= 50) {
              appendList('up');
          }
      }

      function initScrollingCards() {
          const cardContainer = document.querySelector(".scrolling-cards");
          if (!cardContainer) return;

          const originalCards = Array.from(cardContainer.children);
          if (originalCards.length === 0) return; // Avoid error if no cards

          for (let i = 0; i < 2; i++) {
              originalCards.forEach(card => {
                  const clone = card.cloneNode(true);
                  cardContainer.appendChild(clone);
              });
          }
          const cardCount = cardContainer.children.length;
          const animationDuration = Math.max(30, cardCount * 0.5);
          cardContainer.style.animationDuration = `${animationDuration}s`;
      }

      // Call initial functions (from old window.onload)
      populateList();
      initScrollingCards();

      const lastSelectedCountry = sessionStorage.getItem("lastSelectedCountry");
      if (lastSelectedCountry) {
          const countryIndex = countries.findIndex(c => c.name.toLowerCase() === lastSelectedCountry);
          if (countryIndex !== -1) {
              const tryScroll = () => {
                  const items = Array.from(content.children).filter(el => el.classList.contains("country"));
                  const targetItem = items.find(item =>
                      item.querySelector("span")?.textContent.trim().toLowerCase() === lastSelectedCountry
                  );
                  if (targetItem) {
                      scrollToCountry(countryIndex);
                      highlightCenter();
                      sessionStorage.removeItem("lastSelectedCountry");
                  } else {
                      requestAnimationFrame(tryScroll);
                  }
              };
              tryScroll();
          } else {
              highlightCenter();
          }
      } else {
          highlightCenter();
      }

      // Highlight first country/dot on load
      const items = document.querySelectorAll(".country");
      const dots = document.querySelectorAll(".nav-dot");
      if (items.length > 0 && dots.length > 0) {
          items[0].classList.add("highlight");
          dots[0].classList.add("active");
      }

      // Products page logic (This part might be better in a separate 'products.js' if not all pages use it)
      const params = new URLSearchParams(window.location.search);
      const country = params.get("country");

      if (country) {
          const productContainer = document.getElementById("favorites-container");
          const title = document.getElementById("country-title");

          if (title) {
              title.textContent = country.charAt(0).toUpperCase() + country.slice(1);
          }

          try {
              // Correct path to snacks.json if it's in public/js/
              const res = await fetch("/js/snacks.json"); // Changed from ../js/snacks.json
              const data = await res.json();

              const items = data[country.toLowerCase()];
              if (!items || items.length === 0) {
                  if (productContainer) {
                      productContainer.innerHTML = "<p>No products found for this country.</p>";
                  }
                  return;
              }

              items.forEach((product) => {
                  const card = document.createElement("div");
                  card.className = "product-card";

                  const img = document.createElement("img");
                  // Correct image path for products
                  img.src = `/images/products/${product.image.split('/').pop()}`; // Assuming products images are in public/images/products/
                  img.alt = product.name;
                  img.className = "product-image";

                  const name = document.createElement("p");
                  name.textContent = product.name;
                  name.className = "product-name";

                  card.appendChild(img);
                  card.appendChild(name);

                  if (productContainer) {
                      productContainer.appendChild(card);
                  }
              });

          } catch (err) {
              console.error("Error loading products:", err);
              if (productContainer) {
                  productContainer.innerHTML = "<p>Failed to load products.</p>";
              }
          }
      }
  }); 

})(); 