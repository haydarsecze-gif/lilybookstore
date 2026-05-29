// Lily Bookstore Main Application Logic

document.addEventListener("DOMContentLoaded", () => {
  // --- APPLICATION STATE ---
  let books = [...window.BookStore.INITIAL_BOOKS];
  let cart = [];
  let currentFilter = "All Books";
  let searchQuery = "";
  let currentTab = "home"; // home, browse, cart, goodreads, about, contact
  let syncedBooksList = []; // Goodreads imports waiting for review
  let scrapedBooksList = []; // Goodreads automatically crawled books
  let olSearchResults = []; // OpenLibrary lookups
  let preorderSearchQuery = ""; // Search term for preorder titles
  let isSearchingExternal = false; // Loading status for external search
  let externalPreorderResults = []; // Results of external search
  let isSearchingBrowseExternal = false; // Loading status for browse external search
  let browseExternalResults = []; // Results of browse external search
  let currentUser = null; // Profile session data
  let authTab = "login"; // login or register view active tab
  let selectedDelivery = "phnom-penh";
  let selectedPayment = "credit-card";
  
  let isLoadingScrape = false;

  // Stagger animations runtime fallback (no-op since inline indices are used)
  const applyStaggerIndices = () => {};

  // --- MEMBERSHIP TIER HELPERS ---
  const calculateTotalSpent = (user) => {
    if (!user || !user.orders) return 0;
    return user.orders.reduce((sum, order) => sum + order.total, 0);
  };

  const getMemberTier = (totalSpent) => {
    if (totalSpent >= 250) {
      return { name: "Gold Member", discount: 0.10, class: "gold", nextTier: null, nextMin: null };
    } else if (totalSpent >= 100) {
      return { name: "Silver Member", discount: 0.05, class: "silver", nextTier: "Gold Member", nextMin: 250 };
    } else {
      return { name: "Bronze Reader", discount: 0.00, class: "bronze", nextTier: "Silver Member", nextMin: 100 };
    }
  };

  // Community Chat State
  let chatMessages = [
    { username: "Jane_Reads", text: "Hi everyone! Highly recommending 'Fever Dream' by Elsie Silver. The character chemistry is fantastic!", time: "09:30 AM", isUser: false },
    { username: "BookThief_9", text: "I just finished 'The Silent Patient'. Genuinely shocked by that ending. What did you guys think?", time: "09:34 AM", isUser: false },
    { username: "Recommender_Bot", text: "If you liked 'The Silent Patient', I highly recommend checking out 'Verity' by Colleen Hoover or 'The Guest List' by Lucy Foley!", time: "09:36 AM", isUser: false },
    { username: "Alice_In_Bookland", text: "Oh, I'll definitely check out 'The Guest List'. Added to my TBR!", time: "09:40 AM", isUser: false }
  ];

  let requestedTitles = [
    { id: "req-1", title: "The Midnight Library", author: "Matt Haig", votes: 14, voted: false },
    { id: "req-2", title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", votes: 9, voted: false },
    { id: "req-3", title: "Fourth Wing", author: "Rebecca Yarros", votes: 22, voted: false }
  ];
  let activeSlideIndex = 0;
  let sliderInterval = null;
  let appliedDiscount = 0; // percentage discount (e.g. 0.20 for 20%)

  // --- LOCAL STORAGE SYNCRONIZATION ---
  const loadState = () => {
    try {
      // Clear old database cache on version upgrade to display new books cleanly
      const CATALOG_VERSION = "v7";
      const savedVersion = localStorage.getItem("lily_catalog_version");
      if (savedVersion !== CATALOG_VERSION) {
        localStorage.removeItem("lily_imported_books");
        localStorage.removeItem("lily_modified_covers");
        localStorage.removeItem("lily_ol_metadata");
        localStorage.setItem("lily_catalog_version", CATALOG_VERSION);
      }

      const savedCart = localStorage.getItem("lily_cart");
      if (savedCart) cart = JSON.parse(savedCart);
      
      const savedBooks = localStorage.getItem("lily_imported_books");
      if (savedBooks) {
        const imported = JSON.parse(savedBooks);
        imported.forEach(impBook => {
          if (!books.some(b => b.id === impBook.id)) {
            books.push(impBook);
          }
        });
      }

      const savedUser = localStorage.getItem("lily_user");
      if (savedUser) currentUser = JSON.parse(savedUser);

      // Load custom reviews overlay
      const savedReviews = localStorage.getItem("lily_book_reviews");
      if (savedReviews) {
        const customReviews = JSON.parse(savedReviews);
        Object.keys(customReviews).forEach(bookId => {
          const book = books.find(b => b.id === bookId);
          if (book) {
            book.reviews = customReviews[bookId];
          }
        });
      }

      // Load custom modified covers overlay
      const savedCovers = localStorage.getItem("lily_modified_covers");
      if (savedCovers) {
        const customCovers = JSON.parse(savedCovers);
        Object.keys(customCovers).forEach(bookId => {
          const book = books.find(b => b.id === bookId);
          if (book) {
            book.cover = customCovers[bookId];
          }
        });
      }

      // Load OL metadata cache
      const savedMetadata = localStorage.getItem("lily_ol_metadata");
      if (savedMetadata) {
        const olMetadata = JSON.parse(savedMetadata);
        Object.keys(olMetadata).forEach(bookId => {
          const book = books.find(b => b.id === bookId);
          if (book) {
            book.cover_i = olMetadata[bookId].cover_i;
            book.isbns = olMetadata[bookId].isbns;
          }
        });
      }
    } catch (e) {
      console.error("Error loading localStorage", e);
    }
  };

  const saveUserState = () => {
    try {
      if (currentUser) {
        localStorage.setItem("lily_user", JSON.stringify(currentUser));
      } else {
        localStorage.removeItem("lily_user");
      }
    } catch (e) {
      console.error("Error saving user state", e);
    }
  };

  const saveCartState = () => {
    localStorage.setItem("lily_cart", JSON.stringify(cart));
    updateCartCount();
  };

  const saveImportedBooks = (importedBooks) => {
    localStorage.setItem("lily_imported_books", JSON.stringify(importedBooks.filter(b => b.isGoodreadsImport || b.id.startsWith("ol-"))));
  };

  // --- SELECTORS ---
  const navLinks = document.querySelector(".nav-links");
  const navToggle = document.querySelector(".nav-toggle");
  const contentArea = document.getElementById("content-area");
  const cartOverlay = document.getElementById("cart-overlay");
  const cartItemsContainer = document.getElementById("cart-items");
  const cartSubtotal = document.getElementById("cart-subtotal");
  const cartCountBadges = document.querySelectorAll(".cart-count");
  const bookDialog = document.getElementById("book-dialog");
  if (bookDialog) {
    bookDialog.addEventListener("click", (e) => {
      if (e.target === bookDialog) {
        bookDialog.close();
      }
    });
  }
  
  const getCoverUrl = (cover) => {
    if (!cover) return "";
    if (cover.includes("openlibrary.org") && !cover.includes("?default=")) {
      return `${cover}?default=false`;
    }
    return cover;
  };

  const floatingCart = document.getElementById("floating-cart");
  const toastContainer = document.getElementById("toast-container");



  // --- ROUTING / VIEW CONTROLLER ---
  const updateNavIndicator = () => {
    const activeLink = document.querySelector(`.nav-link[data-tab="${currentTab}"]`);
    const indicator = document.querySelector(".nav-indicator");
    
    if (activeLink && indicator) {
      const navItem = activeLink.closest(".nav-item");
      if (navItem) {
        const newLeft = navItem.offsetLeft;
        const newWidth = navItem.offsetWidth;
        const parentWidth = navItem.parentElement.offsetWidth;
        const newRight = parentWidth - (newLeft + newWidth);

        const currentLeft = parseFloat(indicator.style.left) || 0;

        indicator.classList.remove("slide-left", "slide-right");
        if (indicator.classList.contains("visible")) {
          if (newLeft > currentLeft) {
            indicator.classList.add("slide-right");
          } else if (newLeft < currentLeft) {
            indicator.classList.add("slide-left");
          }
        }

        indicator.style.left = `${newLeft}px`;
        indicator.style.right = `${newRight}px`;
        indicator.style.top = `${navItem.offsetTop}px`;
        indicator.style.height = `${navItem.offsetHeight}px`;
        indicator.classList.add("visible");
      }
    }
  };

  const navigateTo = (tabName) => {
    currentTab = tabName;
    
    // Clear active slide timers
    clearInterval(sliderInterval);

    // Update navbar active states
    document.querySelectorAll(".nav-link").forEach(link => {
      if (link.dataset.tab === tabName) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });

    // Close mobile menu
    navLinks.classList.remove("open");
    
    // Update sliding indicator position synchronously so it starts sliding instantly
    updateNavIndicator();
    
    // Scroll to top instantly before rendering/transition
    window.scrollTo(0, 0);

    const updateDOM = () => {
      // Render corresponding view
      if (tabName === "home") {
        renderHomeView();
      } else if (tabName === "browse") {
        renderBrowseView();
      } else if (tabName === "preorder") {
        renderPreOrderView();
      } else if (tabName === "cart") {
        renderCartView();
      } else if (tabName === "community") {
        renderCommunityView();
      } else if (tabName === "about") {
        renderAboutView();
      } else if (tabName === "profile") {
        renderProfileView();
      }
    };

    // Use View Transitions API if supported for horizontal page slide transitions
    if (document.startViewTransition) {
      document.startViewTransition(updateDOM);
    } else {
      updateDOM();
    }
  };

  // Handle Navbar clicks
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo(link.dataset.tab);
    });
  });

  // Mobile menu toggle
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  // Close mobile menu when clicking outside
  document.addEventListener("click", (e) => {
    if (navLinks.classList.contains("open") && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
      navLinks.classList.remove("open");
    }
  });

  // Close mobile menu on Escape key press
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("open")) {
      navLinks.classList.remove("open");
    }
  });

  // --- UI COMPONENT RENDERERS ---

  // RENDER HOME VIEW
  const renderHomeView = () => {
    if (isLoadingScrape) {
      // Render Skeleton Loaders while scraping
      contentArea.innerHTML = `
        <section class="hero-slider-section fade-in-view" style="justify-content: center; align-items: center;">
          <div class="container" style="text-align: center;">
            <div class="skeleton-loader" style="width: 150px; height: 30px; margin: 0 auto 1.5rem;"></div>
            <div class="skeleton-loader" style="width: 350px; height: 50px; margin: 0 auto 2.5rem;"></div>
            <div class="skeleton-loader" style="width: 100%; height: 300px;"></div>
          </div>
        </section>
        <section class="container fade-in-view" style="padding-block: 4rem;">
          <div class="section-header">
            <h2>Curated for You</h2>
          </div>
          <div class="books-grid">
            ${Array(4).fill(0).map(() => `
              <div class="book-card" style="border-color: transparent;">
                <div class="book-card-cover-wrapper skeleton-loader" style="aspect-ratio: 2/3;"></div>
                <div class="skeleton-loader" style="height: 20px; width: 80%; margin-bottom: 0.5rem;"></div>
                <div class="skeleton-loader" style="height: 15px; width: 60%;"></div>
              </div>
            `).join('')}
          </div>
        </section>
      `;
      return;
    }

    // Determine upcoming releases for slider (we take index 0 to 4 of catalog)
    const upcomingBooks = books.slice(0, 5);
    const hotPicks = books.filter(b => b.rating >= 5).slice(0, 5); // Top 5 5-star books (1 row)
    const curatedList = books.slice(4, 9); // Next 5 books (1 row)

    let slidesHtml = "";
    let dotsHtml = "";
    upcomingBooks.forEach((book, idx) => {
      const isPreOrder = book.category === "New Arrivals" || book.publishedYear >= 2026;
      const isFirst = idx === 0;
      const fetchAttr = isFirst ? 'fetchpriority="high"' : 'loading="lazy"';
      const coverStackHtml = book.cover 
        ? `<img src="${getCoverUrl(book.cover)}" referrerpolicy="no-referrer" onerror="this.style.display='none';" class="slide-cover-bg" alt="" ${fetchAttr} />
           <img src="${getCoverUrl(book.cover)}" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" class="slide-cover-main" alt="${book.title} Cover" ${fetchAttr} />
           <div class="book-detail-cover-placeholder" style="display: none; width: 260px; height: 380px; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
             <div class="book-card-no-cover-title" style="font-size: 1.5rem; margin-bottom: 1rem;">${book.title}</div>
             <div class="book-card-no-cover-author" style="font-size: 1rem;">by ${book.author}</div>
           </div>`
        : `<div class="book-detail-cover-placeholder" style="width: 260px; height: 380px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
             <div class="book-card-no-cover-title" style="font-size: 1.5rem; margin-bottom: 1rem;">${book.title}</div>
             <div class="book-card-no-cover-author" style="font-size: 1rem;">by ${book.author}</div>
           </div>`;

      slidesHtml += `
        <div class="slide ${idx === activeSlideIndex ? 'active' : ''}" data-index="${idx}">
          <div class="slide-content-grid">
            <div class="slide-content">
              <span class="slide-badge">Upcoming Release</span>
              <h1 class="slide-title">${book.title}</h1>
              <div class="slide-meta">
                <span class="slide-genre">${book.category}</span>
                <span class="slide-rating">${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}</span>
              </div>
              <p class="slide-desc">${book.description}</p>
              <div class="slide-actions-row">
                <button class="btn-primary btn-explore" data-id="${book.id}">Explore Details</button>
                ${isPreOrder ? `
                  <button class="btn-primary btn-preorder" data-id="${book.id}" style="background-color: var(--color-brown); border: 1px solid var(--glass-border);">Pre-Order</button>
                ` : `
                  <button class="btn-primary btn-add-cart" data-id="${book.id}" ${book.stock === 0 ? 'disabled' : ''} style="background-color: var(--color-brown); border: 1px solid var(--glass-border);">
                    ${book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                `}
              </div>
            </div>
            <div class="slide-visual">
              <div class="slide-cover-stack">
                ${coverStackHtml}
              </div>
            </div>
          </div>
        </div>
      `;
      dotsHtml += `
        <button class="slider-dot ${idx === activeSlideIndex ? 'active' : ''}" data-index="${idx}" aria-label="Go to slide ${idx + 1}"></button>
      `;
    });

    let curatedHtml = "";
    curatedList.forEach((book, idx) => curatedHtml += renderBookCardHTML(book, false, idx));

    let hotPicksHtml = "";
    hotPicks.forEach((book, idx) => hotPicksHtml += renderBookCardHTML(book, false, idx));

    contentArea.innerHTML = `
      <!-- Hero Carousel Slider (No Arrow Buttons, Frosted Layout) -->
      <section class="hero-slider-section fade-in-view">
        <!-- Blurred backgrounds stack -->
        <div class="slider-bg-blur-container">
          ${upcomingBooks.map((book, idx) => `
            <div class="slider-bg-blur-image ${idx === activeSlideIndex ? 'active' : ''}" 
                 style="background-image: url('${book.cover}');"></div>
          `).join('')}
        </div>
        <div class="container slider-wrapper">
          <div class="slider-track">
            ${slidesHtml}
          </div>
          <div class="slider-dots">
            ${dotsHtml}
          </div>
        </div>
      </section>

      <!-- Hot Picks 2026 Grid (First Section) -->
      <section class="container fade-in-view" style="padding-block: 4rem 2rem;">
        <div class="section-header">
          <span class="section-badge">Upcoming Trends</span>
          <h2>Trending Picks 2026</h2>
        </div>
        <div class="books-grid" id="hot-picks-grid">
          ${hotPicksHtml}
        </div>
      </section>

      <!-- Curated For You Grid (Second Section) -->
      <section class="container fade-in-view" style="padding-block: 2rem 5rem;">
        <div class="section-header">
          <span class="section-badge">Top Recommendations</span>
          <h2>Curated for You</h2>
        </div>
        <div class="books-grid" id="curated-grid">
          ${curatedHtml}
        </div>
      </section>
    `;

    attachBookCardListeners();
    attachSliderListeners();
    applyStaggerIndices(document.getElementById("hot-picks-grid"));
    applyStaggerIndices(document.getElementById("curated-grid"));
  };

  // RENDER BROWSE VIEW
  const renderBrowseView = () => {
    let filtersHtml = "";
    window.BookStore.CATEGORIES.forEach(cat => {
      filtersHtml += `
        <button class="filter-btn ${currentFilter === cat ? 'active' : ''}" data-category="${cat}">
          ${cat}
        </button>
      `;
    });

    contentArea.innerHTML = `
      <section class="container fade-in-view" style="padding-block: 8rem 6rem;">
        <div class="section-header" style="margin-block: 0 3rem; text-align: left;">
          <span class="section-badge">Catalog</span>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem);">Browse Library</h1>
        </div>

        <!-- Local Search and Tabs -->
        <div class="library-controls">
          <div class="filter-container">
            ${filtersHtml}
          </div>
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input type="text" class="search-input" id="catalog-search" placeholder="Search catalog..." value="${searchQuery}">
          </div>
        </div>

        <!-- Catalog Listing Grid -->
        <div class="books-grid" id="catalog-books-grid">
          <!-- Loaded dynamically by renderBrowseResults -->
        </div>
      </section>
    `;

    // Bind event listeners locally to avoid destroying input box focus
    const searchInput = document.getElementById("catalog-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        clearTimeout(window.searchDebounceTimer);
        window.searchDebounceTimer = setTimeout(() => {
          executeBrowseSearch();
        }, 300);
      });
    }

    contentArea.querySelectorAll(".filter-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        currentFilter = btn.dataset.category;
        contentArea.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        executeBrowseSearch();
      });
    });

    executeBrowseSearch();
  };

  const renderBrowseResults = () => {
    const booksGrid = document.getElementById("catalog-books-grid");
    if (!booksGrid) return;

    // Filter books locally
    let filteredBooks = books.filter(b => !(b.category === "New Arrivals" || b.publishedYear >= 2026 || b.isPreorder || (!b.isGoodreadsImport && b.stock === undefined)));
    if (currentFilter !== "All Books") {
      filteredBooks = filteredBooks.filter(b => b.category === currentFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredBooks = filteredBooks.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.author.toLowerCase().includes(q)
      );
    }

    let localHtml = filteredBooks.map((b, idx) => renderBookCardHTML(b, false, idx)).join('');

    if (isSearchingBrowseExternal) {
      booksGrid.innerHTML = `
        ${localHtml}
        <div style="grid-column: 1 / -1; margin-top: 1rem; margin-bottom: 0.5rem;"><h3 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-sand);">Searching external databases...</h3></div>
        ${Array(2).fill(0).map((_, idx) => `
          <div class="preorder-card" style="opacity: 0.6; --sibling-index: ${filteredBooks.length + idx + 1};">
            <div class="preorder-cover-wrapper skeleton-loader"></div>
            <div class="preorder-details" style="gap: 1rem;">
              <div class="skeleton-loader" style="height: 24px; width: 60%;"></div>
              <div class="skeleton-loader" style="height: 16px; width: 40%;"></div>
              <div class="skeleton-loader" style="height: 80px; width: 100%;"></div>
            </div>
          </div>
        `).join('')}
      `;
      applyStaggerIndices(booksGrid);
      return;
    }

    let extHtml = browseExternalResults.map((b, idx) => renderBookCardHTML(b, true, filteredBooks.length + idx)).join('');

    if (!localHtml && !extHtml) {
      booksGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
          <p style="font-size: 1.25rem;">No books found matching your search.</p>
        </div>
      `;
      return;
    }

    booksGrid.innerHTML = localHtml + extHtml;
    applyStaggerIndices(booksGrid);
    attachBookCardListeners();
  };

  const executeBrowseSearch = async () => {
    const q = searchQuery.trim();
    if (q.length > 0) {
      if (window.lastBrowseSearchQuery !== q) {
        window.lastBrowseSearchQuery = q;
        isSearchingBrowseExternal = true;
        renderBrowseResults();

        try {
          const results = await window.GoodreadsSync.searchOpenLibrary(q);
          // Filter out duplicates (books already in local books array)
          browseExternalResults = results.filter(ext => 
            !ext.isPreorder && !books.some(b => b.title.toLowerCase() === ext.title.toLowerCase())
          );
        } catch (err) {
          console.error(err);
          browseExternalResults = [];
        } finally {
          isSearchingBrowseExternal = false;
          if (currentTab === "browse" && searchQuery.trim() === q) {
            renderBrowseResults();
          }
        }
      } else {
        renderBrowseResults();
      }
    } else {
      window.lastBrowseSearchQuery = "";
      browseExternalResults = [];
      isSearchingBrowseExternal = false;
      renderBrowseResults();
    }
  };

  // RENDER DEDICATED PRE-ORDER HUB VIEW
  const renderPreOrderView = () => {
    // Eligible local preorders: out of stock, or upcoming, or manually pre-ordered
    let eligibleLocalPreorders = books.filter(b => b.stock === 0 || b.publishedYear >= 2026 || b.isPreorder);
    
    // Reset or keep filtered list
    let filteredPreorders = [...eligibleLocalPreorders];
    if (preorderSearchQuery) {
      const q = preorderSearchQuery.toLowerCase();
      filteredPreorders = filteredPreorders.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.author.toLowerCase().includes(q)
      );
    } else {
      externalPreorderResults = [];
    }

    const renderPreorderCardHtml = (book, isExternal = false, index = 0) => {
      const coverHtml = book.cover 
        ? `<img src="${getCoverUrl(book.cover)}" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" class="preorder-cover" alt="${book.title} Cover" />
           <div class="book-card-no-cover" style="display: none; height: 100%; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
             <span class="book-card-no-cover-title" style="font-size: 1.1rem;">${book.title}</span>
             <span class="book-card-no-cover-author">by ${book.author}</span>
           </div>`
        : `<div class="book-card-no-cover" style="height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
            <span class="book-card-no-cover-title" style="font-size: 1.1rem;">${book.title}</span>
            <span class="book-card-no-cover-author">by ${book.author}</span>
           </div>`;

      const starsHtml = `<div class="book-card-stars" style="color: var(--accent-color); font-size: 0.95rem; margin-bottom: 0.75rem; text-align: left;">${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}</div>`;

      const amazonPrice = book.price.toFixed(2);
      const worksPrice = (book.price * 0.9).toFixed(2);
      const goodreadsPrice = (book.price * 0.95).toFixed(2);

      const btnClass = isExternal ? "btn-preorder-external" : "btn-preorder-add";

      return `
        <div class="preorder-card" style="--sibling-index: ${index + 1};">
          <div class="preorder-cover-wrapper" style="cursor: pointer;" data-id="${book.id}" data-external="${isExternal}">
            ${coverHtml}
          </div>
          <div class="preorder-details">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.25rem;">
                <h3 class="book-card-title" style="cursor: pointer; font-size: 1.5rem;" data-id="${book.id}" data-external="${isExternal}">${book.title}</h3>
                ${isExternal ? `
                  <span style="font-size: 0.7rem; font-family: var(--font-sans); background: var(--color-rose-alpha-30); color: var(--accent-color); padding: 0.15rem 0.5rem; border-radius: var(--border-radius-pill); border: 1px solid var(--glass-border); flex-shrink: 0;">Global</span>
                ` : `
                  <span style="font-size: 0.7rem; font-family: var(--font-sans); background: rgba(2, 70, 68, 0.4); color: var(--color-sand); padding: 0.15rem 0.5rem; border-radius: var(--border-radius-pill); border: 1px solid var(--glass-border); flex-shrink: 0;">${book.stock === 0 ? 'Out of Stock' : 'Upcoming'}</span>
                `}
              </div>
              <p class="book-card-author" style="font-size: 0.95rem; margin-bottom: 0.5rem;">by ${book.author}</p>
              ${starsHtml}
              <p class="slide-desc" style="font-size: 0.9rem; margin-bottom: 1rem; -webkit-line-clamp: 2; display: -webkit-box; -webkit-box-orient: vertical; line-clamp: 2; overflow: hidden;">${book.description}</p>
            </div>
            
            <div class="preorder-retailers">
              <!-- Amazon US -->
              <div class="retailer-option">
                <div class="retailer-name">Amazon (US)</div>
                <div class="retailer-meta">Ships from: United States</div>
                <div class="retailer-price">$${amazonPrice}</div>
                <button class="btn-preorder-retailer ${btnClass}" data-id="${book.id}" data-store="Amazon (US)" data-country="United States" data-price="${amazonPrice}">Pre-Order</button>
              </div>
              
              <!-- The Works UK -->
              <div class="retailer-option">
                <div class="retailer-name">The Works (UK)</div>
                <div class="retailer-meta">Ships from: United Kingdom</div>
                <div class="retailer-price">$${worksPrice}</div>
                <button class="btn-preorder-retailer ${btnClass}" data-id="${book.id}" data-store="The Works (UK)" data-country="United Kingdom" data-price="${worksPrice}">Pre-Order</button>
              </div>
              
              <!-- Goodreads Global -->
              <div class="retailer-option">
                <div class="retailer-name">Goodreads (Global)</div>
                <div class="retailer-meta">Global Partner</div>
                <div class="retailer-price">$${goodreadsPrice}</div>
                <button class="btn-preorder-retailer ${btnClass}" data-id="${book.id}" data-store="Goodreads (Global)" data-country="Global" data-price="${goodreadsPrice}">Pre-Order</button>
              </div>
            </div>
          </div>
        </div>
      `;
    };

    const bindPreorderListeners = () => {
      const localGrid = document.getElementById("local-preorder-grid");
      if (!localGrid) return;

      localGrid.querySelectorAll(".preorder-cover-wrapper, .book-card-title").forEach(el => {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const bookId = el.dataset.id;
          const isExternal = el.dataset.external === "true";
          
          if (isExternal) {
            let book = externalPreorderResults.find(b => b.id === bookId);
            if (book) {
              const localBook = books.find(b => b.title.toLowerCase() === book.title.toLowerCase());
              if (localBook) {
                showBookDetail(localBook.id);
              } else {
                if (!books.some(b => b.id === book.id)) {
                  book.isPreorder = true;
                  books.push(book);
                  saveImportedBooks(books);
                }
                showBookDetail(book.id);
              }
            }
          } else {
            showBookDetail(bookId);
          }
        });
      });

      localGrid.querySelectorAll(".btn-preorder-add").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const store = btn.dataset.store;
          const country = btn.dataset.country;
          const price = parseFloat(btn.dataset.price);
          addToCart(btn.dataset.id, true, { store, country, price });
        });
      });

      localGrid.querySelectorAll(".btn-preorder-external").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const bookId = btn.dataset.id;
          const store = btn.dataset.store;
          const country = btn.dataset.country;
          const price = parseFloat(btn.dataset.price);

          let book = externalPreorderResults.find(b => b.id === bookId);
          if (book) {
            const localBook = books.find(b => b.title.toLowerCase() === book.title.toLowerCase());
            const targetId = localBook ? localBook.id : book.id;
            if (!localBook && !books.some(b => b.id === book.id)) {
              book.isPreorder = true;
              books.push(book);
              saveImportedBooks(books);
            }
            addToCart(targetId, true, { store, country, price });
          }
        });
      });
    };

    const renderPreorderResults = () => {
      const localGrid = document.getElementById("local-preorder-grid");
      if (!localGrid) return;

      if (isSearchingExternal) {
        let localHtml = filteredPreorders.map((b, idx) => renderPreorderCardHtml(b, false, idx)).join('');
        localGrid.innerHTML = `
          ${localHtml}
          <div style="grid-column: 1 / -1; margin-top: 1rem; margin-bottom: 0.5rem;"><h3 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-sand);">Searching Amazon, The Works & Goodreads...</h3></div>
          ${Array(2).fill(0).map((_, idx) => `
            <div class="preorder-card" style="opacity: 0.6; --sibling-index: ${filteredPreorders.length + idx + 1};">
              <div class="preorder-cover-wrapper skeleton-loader"></div>
              <div class="preorder-details" style="gap: 1rem;">
                <div class="skeleton-loader" style="height: 24px; width: 60%;"></div>
                <div class="skeleton-loader" style="height: 16px; width: 40%;"></div>
                <div class="skeleton-loader" style="height: 80px; width: 100%;"></div>
              </div>
            </div>
          `).join('')}
        `;
        return;
      }

      let html = filteredPreorders.map((b, idx) => renderPreorderCardHtml(b, false, idx)).join('');
      let extHtml = externalPreorderResults.map((b, idx) => renderPreorderCardHtml(b, true, filteredPreorders.length + idx)).join('');

      if (!html && !extHtml) {
        localGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
            <p style="font-size: 1.25rem;">No pre-order titles found matching your search.</p>
          </div>
        `;
        return;
      }

      localGrid.innerHTML = html + extHtml;
      bindPreorderListeners();
    };

    contentArea.innerHTML = `
      <section class="container fade-in-view" style="padding-block: 8rem 6rem;">
        <div class="section-header" style="margin-block: 0 3rem; text-align: left;">
          <span class="section-badge">Upcoming & Out of Stock Releases</span>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 0.5rem;">Pre-Order Hub</h1>
          <p style="max-width: 600px;">Secure your copies of upcoming books or titles currently out of stock. Search and order directly from global retailers with shipping options.</p>
        </div>

        <div class="preorder-controls-layout" style="display: flex; flex-direction: column; gap: 2rem; width: 100%; max-width: 900px; margin: 0 auto;">
          
          <div class="preorder-search-container" style="padding: 2rem; background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: var(--border-radius-lg); backdrop-filter: blur(10px); width: 100%; box-sizing: border-box;">
            <h3 style="font-family: var(--font-serif); font-size: 1.5rem; color: var(--color-sand); margin-bottom: 1.25rem; text-align: center;">Search Pre-Order Books</h3>
            <div class="search-form-wrapper" style="display: flex; gap: 1rem; width: 100%; align-items: center; justify-content: center; flex-wrap: nowrap;">
              <div style="position: relative; flex: 1; max-width: 600px; width: 100%;">
                <span style="position: absolute; left: 1.1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; font-size: 1.1rem;">🔍</span>
                <input type="text" id="preorder-search" placeholder="Enter book title or author name..." value="${preorderSearchQuery}" style="width: 100%; padding: 0.75rem 1.25rem 0.75rem 2.75rem; border-radius: var(--border-radius-pill); border: 1px solid var(--glass-border); background-color: var(--color-brown-alpha-30); color: var(--color-sand); font-size: 0.95rem; box-sizing: border-box; outline: none; transition: var(--transition-fast);">
              </div>
              <button id="btn-preorder-search-submit" style="padding: 0.75rem 2rem; margin-top: 0; min-height: 42px; border-radius: var(--border-radius-pill); font-family: var(--font-sans); font-size: 0.95rem; font-weight: 600; flex-shrink: 0; background-color: var(--accent-color); color: var(--color-sand); border: none; cursor: pointer; transition: var(--transition-fast); display: inline-flex; align-items: center; justify-content: center;">Search</button>
            </div>
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 100%;">
            <!-- Unified Preorder Listing Grid -->
            <div class="preorder-grid" id="local-preorder-grid">
              <!-- Loaded dynamically by renderPreorderResults -->
            </div>
          </div>

        </div>
      </section>
    `;

    // Attach search action
    const executeSearch = async () => {
      const searchInput = document.getElementById("preorder-search");
      if (!searchInput) return;
      
      const query = searchInput.value.trim();
      preorderSearchQuery = query;
      
      // Update local grid
      filteredPreorders = books.filter(b => b.stock === 0 || b.publishedYear >= 2026);
      if (query) {
        const q = query.toLowerCase();
        filteredPreorders = filteredPreorders.filter(b => 
          b.title.toLowerCase().includes(q) || 
          b.author.toLowerCase().includes(q)
        );
      }
      
      // If we have a query, fetch from OpenLibrary
      if (query.length > 0) {
        isSearchingExternal = true;
        renderPreorderResults();
        
        try {
          const results = await window.GoodreadsSync.searchOpenLibrary(query);
          externalPreorderResults = results.filter(ext => 
            !books.some(b => b.title.toLowerCase() === ext.title.toLowerCase())
          );
        } catch (err) {
          console.error(err);
          externalPreorderResults = [];
        } finally {
          isSearchingExternal = false;
          if (currentTab === "preorder" && preorderSearchQuery === query) {
            renderPreorderResults();
          }
        }
      } else {
        externalPreorderResults = [];
        renderPreorderResults();
      }
    };

    const searchInput = document.getElementById("preorder-search");
    const searchBtn = document.getElementById("btn-preorder-search-submit");

    if (searchBtn) {
      searchBtn.addEventListener("click", executeSearch);
    }
    if (searchInput) {
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          executeSearch();
        }
      });
    }

    renderPreorderResults();
  };

  // RENDER DEDICATED CART VIEW
  const renderCartView = () => {
    if (cart.length === 0) {
      contentArea.innerHTML = `
        <section class="container fade-in-view" style="padding-block: 10rem 6rem; text-align: center;">
          <div style="font-size: 4rem; color: var(--accent-color); margin-bottom: 1.5rem; opacity: 0.6;">🛒</div>
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">Your Cart is Empty</h1>
          <p style="margin-bottom: 2rem;">Looks like you haven't added any books to your cart yet.</p>
          <button class="btn-primary" id="cart-empty-browse-btn">Go Shopping</button>
        </section>
      `;
      document.getElementById("cart-empty-browse-btn").addEventListener("click", () => navigateTo("browse"));
      return;
    }

    let itemsHtml = "";
    let subtotalVal = 0;
    cart.forEach((item, idx) => {
      subtotalVal += item.price * item.qty;
      itemsHtml += `
        <div class="cart-table-item" style="--sibling-index: ${idx + 1};">
          ${item.cover ? `
            <img src="${item.cover}" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=&quot;cart-table-cover&quot; style=&quot;background: linear-gradient(135deg, var(--color-teal), var(--color-brown)); display: flex; align-items: center; justify-content: center; text-align: center; padding: 6px; font-size: 0.6rem; color: var(--color-sand); font-weight: 700; line-height: 1.1; overflow: hidden;&quot;>${item.title.replace(/'/g, "\\'")}</div>';" class="cart-table-cover" alt="${item.title}" />
          ` : `
            <div class="cart-table-cover" style="background: linear-gradient(135deg, var(--color-teal), var(--color-brown)); display: flex; align-items: center; justify-content: center; text-align: center; padding: 6px; font-size: 0.6rem; color: var(--color-sand); font-weight: 700; line-height: 1.1; overflow: hidden;">
              ${item.title}
            </div>
          `}
          <div class="cart-table-details">
            <h3 class="cart-table-title">${item.title} ${item.isPreOrder ? `<span class="order-status-badge pre-order" style="font-size: 0.65rem; padding: 2px 6px; vertical-align: middle; margin-left: 6px;">Pre-Order${item.store ? ` (${item.store})` : ''}</span>` : ''}</h3>
            <p class="cart-table-author">by ${item.author}</p>
            <div class="cart-table-actions">
              <div class="cart-qty-selectors">
                <button class="cart-qty-btn btn-qty-minus" data-id="${item.id}">-</button>
                <span class="cart-qty-val">${item.qty}</span>
                <button class="cart-qty-btn btn-qty-plus" data-id="${item.id}">+</button>
              </div>
              <button class="cart-table-remove btn-item-remove" data-id="${item.id}">Remove</button>
            </div>
          </div>
          <span style="font-weight: 700; font-size: 1.2rem; color: var(--color-sand);">$${(item.price * item.qty).toFixed(2)}</span>
        </div>
      `;
    });

    const totalSpent = calculateTotalSpent(currentUser);
    const tier = getMemberTier(totalSpent);
    
    // Ensure payment method is valid for the delivery location
    if (selectedDelivery !== "phnom-penh" && selectedPayment === "cod") {
      selectedPayment = "aba-pay";
    }

    // Delivery fee
    let deliveryFee = selectedDelivery === "phnom-penh" ? 1.50 : 2.00;
    let isFreeDelivery = false;
    
    if (tier.name === "Gold Member") {
      deliveryFee = 0;
      isFreeDelivery = true;
    }

    const combinedDiscountRate = appliedDiscount + tier.discount;
    const discountVal = subtotalVal * combinedDiscountRate;
    const totalVal = subtotalVal - discountVal + deliveryFee;

    contentArea.innerHTML = `
      <section class="container fade-in-view" style="padding-block: 8rem 6rem;">
        <div class="section-header" style="margin-block: 0 3rem; text-align: left;">
          <span class="section-badge">Checkout</span>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem);">Your Shopping Cart</h1>
        </div>

        <div class="cart-page-layout">
          <!-- Item list panel -->
          <div class="cart-items-panel">
            ${itemsHtml}
          </div>

          <!-- Checkout summary panel -->
          <div class="cart-summary-panel">
            <h3 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.75rem; color: var(--color-sand);">Order Summary</h3>
            <div class="summary-row">
              <span>Subtotal</span>
              <span>$${subtotalVal.toFixed(2)}</span>
            </div>
            
            <div class="summary-row" style="font-size: 0.85rem; color: var(--text-muted);">
              <span>Loyalty Level</span>
              <span style="font-weight: 600; color: var(--accent-color);">${tier.name} (${(tier.discount * 100)}% Off)</span>
            </div>

            ${combinedDiscountRate > 0 ? `
              <div class="summary-row" style="color: var(--accent-color);">
                <span>Combined Discount (${(combinedDiscountRate * 100)}%)</span>
                <span>-$${discountVal.toFixed(2)}</span>
              </div>
            ` : ""}
            
            <div class="delivery-selection-title" style="margin-block: 1rem 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Delivery Destination</div>
            <div class="delivery-options-wrapper" style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem;">
              <label class="delivery-option-card ${selectedDelivery === 'phnom-penh' ? 'active' : ''}" style="cursor: pointer; display: flex; flex-direction: column; padding: 0.65rem; border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); transition: var(--transition-fast);">
                <input type="radio" name="delivery-location" value="phnom-penh" ${selectedDelivery === 'phnom-penh' ? 'checked' : ''} style="display: none;">
                <span style="font-weight: 700; font-size: 0.85rem; color: var(--color-sand);">Phnom Penh</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${isFreeDelivery ? 'FREE' : '$1.50'}</span>
              </label>
              <label class="delivery-option-card ${selectedDelivery === 'province' ? 'active' : ''}" style="cursor: pointer; display: flex; flex-direction: column; padding: 0.65rem; border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); transition: var(--transition-fast);">
                <input type="radio" name="delivery-location" value="province" ${selectedDelivery === 'province' ? 'checked' : ''} style="display: none;">
                <span style="font-weight: 700; font-size: 0.85rem; color: var(--color-sand);">Province</span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">${isFreeDelivery ? 'FREE' : '$2.00'}</span>
              </label>
            </div>

            <div class="summary-row">
              <span>Shipping Fee</span>
              <span>${isFreeDelivery ? 'FREE' : `$${deliveryFee.toFixed(2)}`}</span>
            </div>

            <div class="summary-row total">
              <span>Total</span>
              <span>$${totalVal.toFixed(2)}</span>
            </div>

            <div class="payment-selection-title" style="margin-block: 1rem 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Payment Method</div>
            <div class="payment-options-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; margin-bottom: 1.5rem;">
              <label class="delivery-option-card ${selectedPayment === 'credit-card' ? 'active' : ''}" style="cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.65rem; border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); transition: var(--transition-fast);">
                <input type="radio" name="payment-method" value="credit-card" ${selectedPayment === 'credit-card' ? 'checked' : ''} style="display: none;">
                <span style="font-weight: 700; font-size: 0.85rem; color: var(--color-sand);">💳 Card</span>
              </label>
              <label class="delivery-option-card ${selectedPayment === 'aba-pay' ? 'active' : ''}" style="cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.65rem; border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); transition: var(--transition-fast);">
                <input type="radio" name="payment-method" value="aba-pay" ${selectedPayment === 'aba-pay' ? 'checked' : ''} style="display: none;">
                <span style="font-weight: 700; font-size: 0.85rem; color: var(--color-sand);">📱 ABA Pay</span>
              </label>
              <label class="delivery-option-card ${selectedPayment === 'bakong-qr' ? 'active' : ''}" style="cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.65rem; border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); transition: var(--transition-fast);">
                <input type="radio" name="payment-method" value="bakong-qr" ${selectedPayment === 'bakong-qr' ? 'checked' : ''} style="display: none;">
                <span style="font-weight: 700; font-size: 0.85rem; color: var(--color-sand);">🇰🇭 Bakong QR</span>
              </label>
              ${selectedDelivery === 'phnom-penh' ? `
                <label class="delivery-option-card ${selectedPayment === 'cod' ? 'active' : ''}" style="cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.65rem; border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); transition: var(--transition-fast);">
                  <input type="radio" name="payment-method" value="cod" ${selectedPayment === 'cod' ? 'checked' : ''} style="display: none;">
                  <span style="font-weight: 700; font-size: 0.85rem; color: var(--color-sand);">💵 COD</span>
                </label>
              ` : ""}
            </div>

            <!-- Promo Input -->
            <div class="promo-box" style="margin-block: 0 1.5rem;">
              <input type="text" class="input-text" id="promo-input" placeholder="Promo Code (e.g. LILY20)" style="padding-block: 0.6rem;">
              <button class="btn-sync" id="btn-apply-promo" style="padding: 0.6rem 1.25rem;">Apply</button>
            </div>

            <!-- checkout form -->
            <form id="checkout-form" style="display: flex; flex-direction: column; gap: 0.75rem; margin-top: 1rem;">
              <input type="text" class="input-text" required placeholder="Full Name" style="padding-block: 0.65rem;">
              <input type="email" class="input-text" required placeholder="Email Address" style="padding-block: 0.65rem;">
              
              <!-- Conditional payment fields -->
              ${selectedPayment === 'credit-card' ? `
                <div class="payment-method-fields" style="display: flex; flex-direction: column; gap: 0.75rem; animation: fadeIn 0.3s ease;">
                  <input type="text" class="input-text" required placeholder="Cardholder Name" style="padding-block: 0.65rem;">
                  <input type="text" class="input-text" required placeholder="Card Number (16-digits)" style="padding-block: 0.65rem;">
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <input type="text" class="input-text" required placeholder="Expiry MM/YY" style="padding-block: 0.65rem;">
                    <input type="text" class="input-text" required placeholder="CVV (3-digits)" style="padding-block: 0.65rem;">
                  </div>
                </div>
              ` : ""}

              ${selectedPayment === 'aba-pay' ? `
                <div class="payment-method-fields" style="display: flex; flex-direction: column; gap: 0.75rem; text-align: center; padding: 1rem; border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); background-color: rgba(2, 70, 68, 0.3); animation: fadeIn 0.3s ease;">
                  <p style="font-size: 0.85rem; color: var(--color-sand); margin-bottom: 0.75rem;">Simulate paying with ABA Mobile app</p>
                  <input type="text" class="input-text" required placeholder="ABA Phone Number or Account ID" style="padding-block: 0.65rem;">
                </div>
              ` : ""}

              ${selectedPayment === 'bakong-qr' ? `
                <div class="payment-method-fields" style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; text-align: center; padding: 1rem; border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); background-color: rgba(2, 70, 68, 0.3); animation: fadeIn 0.3s ease;">
                  <p style="font-size: 0.85rem; color: var(--color-sand); margin-bottom: 0.5rem;">Scan this Bakong KHQR with your banking app</p>
                  <div class="bakong-qr-mockup" style="width: 140px; height: 140px; border-radius: var(--border-radius-md); border: 2px solid var(--accent-color); padding: 0.5rem; background-color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; margin: 0 auto;">
                    <div style="font-size: 0.65rem; color: #e51d24; font-weight: 800; border-bottom: 1.5px solid #e51d24; width: 100%; text-align: center; margin-bottom: 2px; padding-bottom: 1px; letter-spacing: 0.05em; line-height: 1;">KHQR</div>
                    <div style="flex-grow: 1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px; width: 100%;">
                      <div style="background-color: #000;"></div><div style="background-color: #000;"></div><div style="background-color: #fff;"></div><div style="background-color: #000;"></div>
                      <div style="background-color: #000;"></div><div style="background-color: #fff;"></div><div style="background-color: #000;"></div><div style="background-color: #fff;"></div>
                      <div style="background-color: #fff;"></div><div style="background-color: #000;"></div><div style="background-color: #000;"></div><div style="background-color: #000;"></div>
                      <div style="background-color: #000;"></div><div style="background-color: #fff;"></div><div style="background-color: #fff;"></div><div style="background-color: #000;"></div>
                    </div>
                    <div style="font-size: 0.55rem; color: #024644; font-weight: 700; margin-top: 2px; line-height: 1;">$${totalVal.toFixed(2)}</div>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">The QR code will dynamically verify your transaction.</span>
                </div>
              ` : ""}

              ${selectedPayment === 'cod' ? `
                <div class="payment-method-fields" style="text-align: center; padding: 1rem; border: 1px solid var(--glass-border); border-radius: var(--border-radius-md); background-color: rgba(2, 70, 68, 0.3); animation: fadeIn 0.3s ease;">
                  <p style="font-size: 0.85rem; color: var(--color-sand); margin-bottom: 0;">💵 Pay with cash when your books are delivered in Phnom Penh.</p>
                </div>
              ` : ""}
              
              <button type="submit" class="btn-checkout" style="margin-top: 1rem;">Complete Order</button>
            </form>
          </div>
        </div>
      </section>
    `;

    attachCartPageListeners();
    applyStaggerIndices(document.querySelector(".cart-items-panel"));
  };

  // RENDER COMMUNITY VIEW
  const renderCommunityView = () => {
    let chatHtml = "";
    chatMessages.forEach((msg, idx) => {
      chatHtml += `
        <div class="chat-bubble ${msg.isUser ? 'user' : ''}" style="--sibling-index: ${idx + 1};">
          <div class="chat-bubble-header">
            <span class="chat-username">${msg.username}</span>
            <span class="chat-time">${msg.time}</span>
          </div>
          <div class="chat-message-text">${msg.text}</div>
        </div>
      `;
    });

    let requestsHtml = "";
    requestedTitles.forEach((req, idx) => {
      const isAlreadyAdded = books.some(b => b.title.toLowerCase() === req.title.toLowerCase());
      
      requestsHtml += `
        <div class="request-item" id="req-item-${req.id}" style="--sibling-index: ${idx + 1};">
          <div class="request-info">
            <span class="request-title">${req.title}</span>
            <span class="request-author">by ${req.author}</span>
          </div>
          <div class="request-actions">
            <button class="btn-vote ${req.voted ? 'voted' : ''}" data-id="${req.id}" ${req.voted ? 'disabled' : ''}>
              ▲ <span>${req.votes}</span>
            </button>
            ${isAlreadyAdded ? `
              <span style="font-size: 0.75rem; color: var(--color-rose); font-weight: 600;">In Store</span>
            ` : `
              <button class="btn-publish" data-id="${req.id}">Add to Store</button>
            `}
          </div>
        </div>
      `;
    });

    contentArea.innerHTML = `
      <section class="container fade-in-view" style="padding-block: 8rem 6rem;">
        <div class="section-header" style="margin-block: 0 3rem; text-align: left;">
          <span class="section-badge">Community Portal</span>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 0.5rem;">Community Chat & Requests</h1>
          <p style="max-width: 600px;">Connect with other readers, share instant recommendations, request new titles, and vote to add books to the bookstore catalog.</p>
        </div>

        <div class="community-layout">
          <!-- Chat Panel -->
          <div class="chat-panel">
            <h3 style="font-family: var(--font-serif); font-size: 1.35rem; margin-bottom: 1rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; color: var(--color-sand);">Instant Recommendations</h3>
            <div class="chat-messages" id="chat-messages-container">
              ${chatHtml}
            </div>
            <form class="chat-input-wrapper" id="chat-send-form">
              <input type="text" class="input-text" id="chat-input-msg" required placeholder="Type your book recommendation or chat here...">
              <button type="submit" class="btn-sync">Send</button>
            </form>
          </div>

          <!-- Request Panel -->
          <div class="request-panel">
            <div class="request-header">
              <h3 style="font-family: var(--font-serif); font-size: 1.35rem; color: var(--color-sand); margin-bottom: 0.25rem;">Request a Title</h3>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0;">Don't see your book in our catalog? Request it here or vote for existing requests.</p>
            </div>
            
            <form class="request-form" id="book-request-form">
              <input type="text" class="input-text" id="req-input-title" required placeholder="Book Title" style="padding-block: 0.55rem; font-size: 0.85rem;">
              <input type="text" class="input-text" id="req-input-author" required placeholder="Author Name" style="padding-block: 0.55rem; font-size: 0.85rem;">
              <button type="submit" class="btn-sync" style="padding-block: 0.55rem; font-size: 0.85rem; width: 100%;">Submit Request</button>
            </form>

            <h4 style="font-family: var(--font-sans); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-rose); margin-bottom: 0.75rem; border-bottom: 1px solid var(--glass-border); padding-bottom: 0.25rem;">Title Requests & Votes</h4>
            <div class="request-list" id="requests-list-container">
              ${requestsHtml}
            </div>
          </div>
        </div>
      </section>
    `;

    // Scroll chat to bottom
    const chatContainer = document.getElementById("chat-messages-container");
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
    applyStaggerIndices(document.getElementById("requests-list-container"));
    applyStaggerIndices(document.getElementById("chat-messages-container"));

    // Attach chat send listener
    const chatForm = document.getElementById("chat-send-form");
    if (chatForm) {
      chatForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = document.getElementById("chat-input-msg");
        const msgText = input.value.trim();
        if (!msgText) return;

        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        chatMessages.push({
          username: "You (Reader)",
          text: msgText,
          time: timeStr,
          isUser: true
        });

        input.value = "";
        renderCommunityView();

        // Simulate a response from a Recommender after 1.5 seconds
        setTimeout(() => {
          simulateRecommenderResponse(msgText);
        }, 1500);
      });
    }

    // Attach request form listener
    const requestForm = document.getElementById("book-request-form");
    if (requestForm) {
      requestForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const titleInput = document.getElementById("req-input-title");
        const authorInput = document.getElementById("req-input-author");
        const title = titleInput.value.trim();
        const author = authorInput.value.trim();

        if (!title || !author) return;

        // Check if already requested
        if (requestedTitles.some(r => r.title.toLowerCase() === title.toLowerCase())) {
          showToast(`"${title}" has already been requested! Vote for it below.`, "info");
          return;
        }

        const newId = `req-${Date.now()}`;
        requestedTitles.push({
          id: newId,
          title: title,
          author: author,
          votes: 1,
          voted: true
        });

        titleInput.value = "";
        authorInput.value = "";
        renderCommunityView();
        showToast(`Requested "${title}" successfully!`, "success");
      });
    }

    // Attach vote listeners
    contentArea.querySelectorAll(".btn-vote").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const req = requestedTitles.find(r => r.id === id);
        if (req && !req.voted) {
          req.votes++;
          req.voted = true;
          renderCommunityView();
          showToast(`Voted for "${req.title}"!`, "success");
        }
      });
    });

    // Attach Add to Store listeners
    contentArea.querySelectorAll(".btn-publish").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id;
        const req = requestedTitles.find(r => r.id === id);
        if (req) {
          // Add this book to our catalog store with no cover image (cover: "")
          const newBook = {
            id: `user-add-${Date.now()}`,
            title: req.title,
            author: req.author,
            category: "New Arrivals",
            rating: 5,
            price: 15.99,
            cover: "", // NO COVER IMAGE!
            description: `A reader-requested title added to Lily Bookstore's collection by community vote. Suggested by the reader community.`,
            isTrending: false,
            isHotPick: false,
            publishedYear: 2026,
            reviews: [
              { reviewer: "Community", rating: 5, comment: "Added by popular demand! We voted to make this available." }
            ]
          };

          books.push(newBook);
          // Save to local storage
          localStorage.setItem("lily_imported_books", JSON.stringify(books.filter(b => b.id.startsWith("user-add-") || b.isGoodreadsImport)));
          
          renderCommunityView();
          showToast(`"${req.title}" added to Bookstore catalog with no cover image!`, "success");
        }
      });
    });
  };

  const simulateRecommenderResponse = (userMsg) => {
    let replyText = "That's a nice choice! Have you checked out the other titles in our Browse tab?";
    const msgLower = userMsg.toLowerCase();
    
    if (msgLower.includes("romance") || msgLower.includes("love") || msgLower.includes("cozy")) {
      replyText = "Ooh, if you love romance, you should definitely check out 'Funny Story' by Emily Henry or 'The Seven Husbands of Evelyn Hugo'!";
    } else if (msgLower.includes("thriller") || msgLower.includes("scary") || msgLower.includes("mystery") || msgLower.includes("ending")) {
      replyText = "If you're into mysteries and thrillers, 'The Silent Patient' or 'The Guest List' are perfect page-turners available in the catalog.";
    } else if (msgLower.includes("recommend") || msgLower.includes("what should i read")) {
      replyText = "I highly recommend browsing 'Trending Picks 2026' on our Home page! They represent our best curated releases.";
    } else if (msgLower.includes("pre-order") || msgLower.includes("preorder") || msgLower.includes("release")) {
      replyText = "Upcoming releases like 'The Daisy Chain' are available for pre-order under our Pre-Orders tab!";
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    chatMessages.push({
      username: "BookRecommender_AI",
      text: replyText,
      time: timeStr,
      isUser: false
    });

    if (currentTab === "community") {
      renderCommunityView();
    }
  };

  // RENDER ABOUT VIEW
  const renderAboutView = () => {
    let aboutTab = 'story';

    const updateAboutContent = () => {
      const storyContent = `
        <p style="font-size: 1.15rem; margin-bottom: 1.5rem; line-height: 1.8; text-align: left;">
          Lily Bookstore is a modern digital sanctuary for book lovers. Established in 2026, we curate premium literature across romance, thrillers, and contemporary novels. Our goal is to bring reader communities closer together through beautifully crafted web experiences.
        </p>
        <p style="font-size: 1rem; margin-bottom: 0; color: var(--text-muted); line-height: 1.8; text-align: left;">
          By leveraging Goodreads integrations, Lily Bookstore allows readers to easily carry over their personal shelves and digital libraries, creating a unified showcase of their favorite reading materials.
        </p>
      `;

      const missionContent = `
        <h3 style="font-family: var(--font-serif); font-size: 1.65rem; color: var(--color-sand); margin-bottom: 1.25rem; text-align: left;">Our Mission</h3>
        <p style="font-size: 1.15rem; margin-bottom: 0; line-height: 1.8; text-align: left;">
          Our mission is to prioritize customer comfort and happiness by removing every barrier between a reader and their next favorite book. We are dedicated to making it possible for our customers to get any book they want, exactly how they want it whether it's a standard release from the US or a rare special edition from the UK.
        </p>
      `;

      const visionContent = `
        <h3 style="font-family: var(--font-serif); font-size: 1.65rem; color: var(--color-sand); margin-bottom: 1.25rem; text-align: left;">Our Vision</h3>
        <p style="font-size: 1.15rem; margin-bottom: 0; line-height: 1.8; text-align: left;">
          To become Cambodia's premier literary gateway and community hub, recognized for transforming the way people access knowledge and stories. We envision a future where every reader in Cambodia can curate a world-class home library with ease, supported by a brand that treats their reading journey with the highest level of personal care.
        </p>
      `;

      let activeContent = "";
      if (aboutTab === 'story') activeContent = storyContent;
      else if (aboutTab === 'mission') activeContent = missionContent;
      else if (aboutTab === 'vision') activeContent = visionContent;

      const bodyContainer = document.getElementById("about-tab-body");
      if (bodyContainer) {
        if (document.startViewTransition) {
          document.startViewTransition(() => {
            bodyContainer.innerHTML = activeContent;
          });
        } else {
          bodyContainer.innerHTML = activeContent;
        }
      }
    };

    contentArea.innerHTML = `
      <section class="container fade-in-view" style="padding-block: 8rem 6rem; max-width: 800px; text-align: center;">
        <div class="section-header" style="margin-bottom: 2rem;">
          <span class="section-badge">Our Story</span>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 0.5rem;">About Lily Bookstore</h1>
        </div>

        <!-- Sleek Sub-Tab Switcher inside About Page -->
        <div class="about-tabs-nav" style="display: inline-flex; background: var(--color-brown-alpha-30); border: 1px solid var(--glass-border); border-radius: var(--border-radius-pill); padding: 0.35rem; margin-bottom: 2.5rem; justify-content: center; gap: 0.5rem; backdrop-filter: blur(10px);">
          <button class="about-tab-btn active" data-subtab="story" style="padding: 0.5rem 1.5rem; font-size: 0.9rem; font-weight: 600; border-radius: var(--border-radius-pill); color: var(--color-sand); transition: var(--transition-fast);">Our Story</button>
          <button class="about-tab-btn" data-subtab="mission" style="padding: 0.5rem 1.5rem; font-size: 0.9rem; font-weight: 600; border-radius: var(--border-radius-pill); color: var(--text-muted); transition: var(--transition-fast);">Mission</button>
          <button class="about-tab-btn" data-subtab="vision" style="padding: 0.5rem 1.5rem; font-size: 0.9rem; font-weight: 600; border-radius: var(--border-radius-pill); color: var(--text-muted); transition: var(--transition-fast);">Vision</button>
        </div>

        <!-- Render active subtab content inside a frosted glass panel -->
        <div class="about-tab-content-wrapper" style="min-height: 220px; background: var(--glass-bg); border: 1px solid var(--glass-border); padding: 2.5rem; border-radius: var(--border-radius-lg); backdrop-filter: blur(20px); box-shadow: var(--glass-shadow); margin-bottom: 2.5rem;">
          <div id="about-tab-body">
            <!-- Loaded dynamically by updateAboutContent -->
          </div>
        </div>

        <p style="font-size: 0.95rem; margin-bottom: 2.5rem; color: var(--accent-color); font-weight: 600; line-height: 1.6; border-top: 1px solid var(--glass-border); padding-top: 1.5rem;">
          Created by Ratha Nit. Rights owned by Ratha Nit.
        </p>

        <div style="display: flex; justify-content: center; gap: 1rem;">
          <button class="btn-primary" id="about-browse-btn">Browse the Catalog</button>
        </div>
      </section>
    `;

    // Initialize subtab content
    updateAboutContent();

    // Attach listeners to sub-tabs
    const tabBtns = contentArea.querySelectorAll(".about-tab-btn");
    tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        aboutTab = btn.dataset.subtab;
        tabBtns.forEach(b => {
          b.classList.remove("active");
          b.style.color = "var(--text-muted)";
          b.style.backgroundColor = "transparent";
        });
        btn.classList.add("active");
        btn.style.color = "var(--color-sand)";
        btn.style.backgroundColor = "var(--accent-color)";
        
        updateAboutContent();
      });
    });

    // Make the active button styles correct on initial render
    const activeBtn = contentArea.querySelector(".about-tab-btn.active");
    if (activeBtn) {
      activeBtn.style.color = "var(--color-sand)";
      activeBtn.style.backgroundColor = "var(--accent-color)";
    }

    document.getElementById("about-browse-btn").addEventListener("click", () => navigateTo("browse"));
  };

  // RENDER USER PROFILE VIEW (LOGIN / REGISTER / DASHBOARD)
  const renderProfileView = () => {
    if (!currentUser) {
      renderAuthForms();
      return;
    }

    renderDashboard();
  };

  const renderAuthForms = () => {
    contentArea.innerHTML = `
      <section class="container fade-in-view" style="padding-block: 8rem 6rem;">
        <div class="auth-container">
          <div class="auth-tabs">
            <button class="auth-tab-btn ${authTab === 'login' ? 'active' : ''}" id="tab-login-btn">Log In</button>
            <button class="auth-tab-btn ${authTab === 'register' ? 'active' : ''}" id="tab-register-btn">Register</button>
          </div>

          ${authTab === 'login' ? `
            <form class="auth-form" id="login-form">
              <h2 style="font-family: var(--font-serif); font-size: 1.75rem; text-align: center; margin-bottom: 0.5rem;">Welcome Back</h2>
              <p style="text-align: center; font-size: 0.9rem; margin-bottom: 1.5rem;">Log in to access your library account</p>
              
              <div class="auth-field">
                <label>Username</label>
                <input type="text" class="input-text" id="login-username" required placeholder="Enter username...">
              </div>
              
              <div class="auth-field">
                <label>Password</label>
                <input type="password" class="input-text" id="login-password" required placeholder="Enter password...">
              </div>
              
              <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem; padding-block: 0.75rem;">Log In</button>
            </form>
          ` : `
            <form class="auth-form" id="register-form">
              <h2 style="font-family: var(--font-serif); font-size: 1.75rem; text-align: center; margin-bottom: 0.5rem;">Create Account</h2>
              <p style="text-align: center; font-size: 0.9rem; margin-bottom: 1.5rem;">Join Lily Bookstore community of readers</p>
              
              <div class="auth-field">
                <label>Full Name</label>
                <input type="text" class="input-text" id="reg-name" required placeholder="Enter your full name...">
              </div>
              
              <div class="auth-field">
                <label>Username</label>
                <input type="text" class="input-text" id="reg-username" required placeholder="Choose a username...">
              </div>
              
              <div class="auth-field">
                <label>Email Address</label>
                <input type="email" class="input-text" id="reg-email" required placeholder="Enter email address...">
              </div>
              
              <div class="auth-field">
                <label>Password</label>
                <input type="password" class="input-text" id="reg-password" required placeholder="Choose a password...">
              </div>
              
              <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem; padding-block: 0.75rem;">Create Account</button>
            </form>
          `}
        </div>
      </section>
    `;

    // Attach tab listeners
    document.getElementById("tab-login-btn").addEventListener("click", () => {
      authTab = "login";
      renderProfileView();
    });
    document.getElementById("tab-register-btn").addEventListener("click", () => {
      authTab = "register";
      renderProfileView();
    });

    // Attach form submit listeners
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("login-username").value.trim();
        const pass = document.getElementById("login-password").value;

        // Retrieve registered users from localStorage
        let users = [];
        try {
          const savedUsers = localStorage.getItem("lily_registered_users");
          if (savedUsers) users = JSON.parse(savedUsers);
        } catch (err) {}

        // Fallback user check
        const user = users.find(u => u.username === username);
        if (user || username === "demo") {
          currentUser = user || {
            name: "Demo Reader",
            username: "demo",
            email: "demo@example.com",
            preferences: ["Romance", "Thriller"],
            orders: []
          };
          saveUserState();
          showToast(`Logged in successfully as ${currentUser.name}!`, "success");
          renderProfileView();
        } else {
          showToast("Account not found. Please register first.", "error");
        }
      });
    }

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.getElementById("reg-name").value.trim();
        const username = document.getElementById("reg-username").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const password = document.getElementById("reg-password").value;

        let users = [];
        try {
          const savedUsers = localStorage.getItem("lily_registered_users");
          if (savedUsers) users = JSON.parse(savedUsers);
        } catch (err) {}

        if (users.some(u => u.username === username)) {
          showToast("Username already taken. Choose another.", "error");
          return;
        }

        const newUser = {
          name,
          username,
          email,
          preferences: ["Romance"],
          orders: []
        };

        users.push(newUser);
        localStorage.setItem("lily_registered_users", JSON.stringify(users));

        currentUser = newUser;
        saveUserState();
        showToast("Registration successful!", "success");
        renderProfileView();
      });
    }
  };

  const renderDashboard = () => {
    // Generate avatar initial
    const initial = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U";
    
    // Generate reading preference items
    const availablePrefs = ["Romance", "Thriller", "New Arrivals", "Classics"];
    let prefHtml = "";
    availablePrefs.forEach(pref => {
      const checked = currentUser.preferences && currentUser.preferences.includes(pref);
      prefHtml += `
        <label class="pref-checkbox-wrapper">
          <input type="checkbox" class="pref-cb" data-pref="${pref}" ${checked ? 'checked' : ''}>
          <span>${pref}</span>
        </label>
      `;
    });

    // Generate order history
    let ordersHtml = "";
    const orders = currentUser.orders || [];
    if (orders.length === 0) {
      ordersHtml = `
        <div style="text-align: center; padding: 2rem; border: 1px dashed var(--glass-border); border-radius: var(--border-radius-md); color: var(--text-muted);">
          No purchase or pre-order history yet.
        </div>
      `;
    } else {
      orders.forEach((order, idx) => {
        let itemsListStr = order.items.map(it => `${it.title} (${it.qty})`).join(", ");
        
        const orderTime = parseInt(order.id.replace('ord-', '')) || 0;
        const now = Date.now();
        const elapsed = now - orderTime;

        let activeStep = 1;
        let statusText = "";
        let badgeClass = "";
        
        if (order.isPreOrder) {
          badgeClass = "pre-order";
          if (elapsed < 60000) {
            activeStep = 1;
            statusText = "Pre-Order Confirmed";
          } else {
            activeStep = 2;
            statusText = "Awaiting Release";
          }
        } else {
          badgeClass = "in-stock-order";
          if (elapsed < 30000) {
            activeStep = 2;
            statusText = "Processing";
            badgeClass = "processing";
          } else if (elapsed < 120000) {
            activeStep = 3;
            statusText = "In Transit";
            badgeClass = "transit";
          } else {
            activeStep = 4;
            statusText = "Delivered";
            badgeClass = "delivered";
          }
        }

        ordersHtml += `
          <div class="order-history-item" style="--sibling-index: ${idx + 1}; display: flex; flex-direction: column; gap: 1rem; align-items: stretch; padding: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
              <div class="order-items-detail" style="flex-grow: 1;">
                <span class="profile-info-value" style="font-size: 1.1rem; font-weight: 700; display: block; margin-bottom: 0.5rem; text-align: left;">${itemsListStr}</span>
                <div class="order-date-status" style="font-size: 0.85rem; color: var(--text-muted); display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
                  <span>Date: ${order.date}</span>
                  <span style="opacity: 0.5;">|</span>
                  <span>Payment: ${order.paymentMethod || 'Credit Card'}</span>
                  <span style="opacity: 0.5;">|</span>
                  <span>Delivery: ${order.delivery || 'Phnom Penh'}</span>
                </div>
              </div>
              <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                <span style="font-weight: 700; font-size: 1.25rem; color: var(--color-sand);">$${order.total.toFixed(2)}</span>
                <span class="order-status-badge ${badgeClass}" style="font-size: 0.75rem; padding: 0.25rem 0.75rem; border-radius: var(--border-radius-pill); font-weight: 600; display: inline-block;">
                  ${statusText}
                </span>
              </div>
            </div>
            
            <!-- Tracking Stepper -->
            <div class="order-tracking-stepper">
              <div class="step ${activeStep >= 1 ? 'completed' : ''} ${activeStep === 1 ? 'active' : ''}">
                <span class="step-dot"></span>
                <span class="step-label">Confirmed</span>
              </div>
              <div class="step ${activeStep >= 2 ? 'completed' : ''} ${activeStep === 2 ? 'active' : ''}">
                <span class="step-dot"></span>
                <span class="step-label">${order.isPreOrder ? 'Awaiting Release' : 'Processing'}</span>
              </div>
              <div class="step ${activeStep >= 3 ? 'completed' : ''} ${activeStep === 3 ? 'active' : ''}">
                <span class="step-dot"></span>
                <span class="step-label">${order.isPreOrder ? 'Shipping Soon' : 'In Transit'}</span>
              </div>
              <div class="step ${activeStep >= 4 ? 'completed' : ''} ${activeStep === 4 ? 'active' : ''}">
                <span class="step-dot"></span>
                <span class="step-label">Delivered</span>
              </div>
            </div>
          </div>
        `;
      });
    }

    const totalSpent = calculateTotalSpent(currentUser);
    const tier = getMemberTier(totalSpent);

    let progressHtml = "";
    if (tier.nextTier) {
      const needed = tier.nextMin - totalSpent;
      const progressPercent = Math.min(100, (totalSpent / tier.nextMin) * 100);
      progressHtml = `
        <div class="membership-progress-container">
          <div class="membership-progress-labels">
            <span>Milestone: ${tier.nextTier}</span>
            <span>$${totalSpent.toFixed(2)} / $${tier.nextMin.toFixed(2)}</span>
          </div>
          <div class="membership-progress-bar-bg">
            <div class="membership-progress-bar-fill ${tier.class}" style="width: ${progressPercent}%;"></div>
          </div>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem; margin-bottom: 0;">
            Spend $${needed.toFixed(2)} more to reach ${tier.nextTier}!
          </p>
        </div>
      `;
    } else {
      progressHtml = `
        <div class="membership-progress-container">
          <div class="membership-progress-labels">
            <span>Gold Status Active!</span>
            <span>$${totalSpent.toFixed(2)} spent</span>
          </div>
          <div class="membership-progress-bar-bg">
            <div class="membership-progress-bar-fill gold" style="width: 100%;"></div>
          </div>
          <p style="font-size: 0.75rem; color: #ffd700; margin-top: 0.35rem; margin-bottom: 0; font-weight: 600;">
            Congratulations! You've achieved the highest membership level.
          </p>
        </div>
      `;
    }

    let benefitsHtml = "";
    if (tier.name === "Gold Member") {
      benefitsHtml = `
        <li>10% automatic discount on all book purchases</li>
        <li>FREE standard shipping nationwide</li>
        <li>Priority voting weight for store catalog titles</li>
      `;
    } else if (tier.name === "Silver Member") {
      benefitsHtml = `
        <li>5% automatic discount on all book purchases</li>
        <li>Standard shipping rates apply</li>
        <li>Special Silver member card aesthetic</li>
      `;
    } else {
      benefitsHtml = `
        <li>Earn progress towards 5% Silver discount at $100 spending</li>
        <li>Earn progress towards 10% Gold discount & Free Shipping at $250 spending</li>
      `;
    }

    const cardNum = `LILY-${currentUser.username.toUpperCase().padEnd(4, 'X').substring(0, 4)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const memberCardHtml = `
      <div class="membership-card" style="margin-bottom: 2rem;">
        <div class="membership-card-header">
          <span class="membership-card-title">Lily Bookstore Loyalty Card</span>
          <span class="membership-card-tier-badge ${tier.class}">${tier.name}</span>
        </div>
        <div class="membership-card-number">${cardNum}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Cardholder</div>
        <div style="font-size: 1.1rem; font-family: var(--font-serif); font-weight: 600; color: var(--color-sand); margin-bottom: 1rem;">${currentUser.name}</div>
        
        ${progressHtml}
        
        <ul class="membership-benefits-list">
          ${benefitsHtml}
        </ul>
      </div>
    `;

    contentArea.innerHTML = `
      <section class="container fade-in-view" style="padding-block: 8rem 6rem;">
        <div class="section-header" style="margin-block: 0 3rem; text-align: left;">
          <span class="section-badge">Dashboard</span>
          <h1 style="font-size: clamp(2rem, 4vw, 3rem); margin-bottom: 0.5rem;">Your Profile</h1>
          <p style="max-width: 600px;">Manage your reading preferences, view standard order status, and track upcoming pre-ordered books.</p>
        </div>

        <div class="profile-dashboard">
          <!-- Sidebar Info -->
          <div class="profile-sidebar">
            <div class="profile-avatar-large">${initial}</div>
            <div>
              <h2 style="font-family: var(--font-serif); font-size: 1.5rem; margin-bottom: 0.25rem;">${currentUser.name}</h2>
              <p style="font-size: 0.85rem; color: var(--color-rose); margin-bottom: 0;">@${currentUser.username}</p>
            </div>
            
            <div class="profile-info-list">
              <div class="profile-info-item">
                <span class="profile-info-label">Email Address</span>
                <span class="profile-info-value">${currentUser.email}</span>
              </div>
              <div class="profile-info-item">
                <span class="profile-info-label">Account Tier</span>
                <span class="profile-info-value">${tier.name}</span>
              </div>
            </div>
            
            <button class="btn-primary" id="btn-logout" style="width: 100%; padding-block: 0.65rem; background-color: var(--color-brown); border: 1px solid var(--glass-border);">Log Out</button>
          </div>

          <!-- Main Panel details -->
          <div class="profile-main-panel">
            <!-- Membership loyalty card -->
            ${memberCardHtml}

            <!-- Preferences Section -->
            <div class="dashboard-section">
              <h3 style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-sand); border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; margin-bottom: 1rem;">Reading Preferences</h3>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">Select your favorite genres to customize recommendations in the Community feed:</p>
              <div class="pref-grid">
                ${prefHtml}
              </div>
            </div>

            <!-- Order & Pre-order History Section -->
            <div class="dashboard-section">
              <h3 style="font-family: var(--font-serif); font-size: 1.25rem; color: var(--color-sand); border-bottom: 1px solid var(--glass-border); padding-bottom: 0.5rem; margin-bottom: 1rem;">Order & Pre-Order History</h3>
              <div class="order-history-list">
                ${ordersHtml}
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    // Attach logout click listener
    document.getElementById("btn-logout").addEventListener("click", () => {
      currentUser = null;
      saveUserState();
      showToast("Logged out successfully.", "info");
      renderProfileView();
    });

    // Attach preferences checkbox click listeners
    contentArea.querySelectorAll(".pref-cb").forEach(cb => {
      cb.addEventListener("change", () => {
        const pref = cb.dataset.pref;
        if (!currentUser.preferences) currentUser.preferences = [];
        
        if (cb.checked) {
          if (!currentUser.preferences.includes(pref)) currentUser.preferences.push(pref);
        } else {
          currentUser.preferences = currentUser.preferences.filter(p => p !== pref);
        }
        
        saveUserState();
        // Silently update user preference cache in registered users list
        let users = [];
        try {
          const savedUsers = localStorage.getItem("lily_registered_users");
          if (savedUsers) users = JSON.parse(savedUsers);
          const uIdx = users.findIndex(u => u.username === currentUser.username);
          if (uIdx !== -1) {
            users[uIdx].preferences = currentUser.preferences;
            localStorage.setItem("lily_registered_users", JSON.stringify(users));
          }
        } catch (err) {}
      });
    });
  };

  // Helper function to build Book Card HTML
  const renderBookCardHTML = (book, isExternal = false, index = 0) => {
    const isPreOrder = book.category === "New Arrivals" || book.publishedYear >= 2026;
    const coverHtml = book.cover 
      ? `<img src="${getCoverUrl(book.cover)}" referrerpolicy="no-referrer" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" class="book-card-cover" alt="${book.title} Cover" loading="lazy" />
         <div class="book-card-no-cover" style="display: none;">
           <span class="book-card-no-cover-title">${book.title}</span>
           <span class="book-card-no-cover-author">by ${book.author}</span>
         </div>`
      : `<div class="book-card-no-cover">
          <span class="book-card-no-cover-title">${book.title}</span>
          <span class="book-card-no-cover-author">by ${book.author}</span>
         </div>`;

    const btnClass = isExternal ? "btn-browse-external" : (isPreOrder ? "btn-preorder" : "btn-add-cart");
    const btnText = isExternal ? "Add to Cart" : (isPreOrder ? "Pre-Order" : "Add to Cart");

    return `
      <div class="card-wrapper" style="--sibling-index: ${index + 1};">
        <article class="book-card">
          <div class="book-card-cover-wrapper" style="cursor: pointer;" data-id="${book.id}" data-external="${isExternal}">
            ${coverHtml}
          </div>
          <div class="book-card-info">
            <h3 class="book-card-title" style="cursor: pointer;" data-id="${book.id}" data-external="${isExternal}">${book.title}</h3>
            <p class="book-card-author">by ${book.author}</p>
            <div class="book-card-meta">
              <div class="book-card-stars">
                ${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}
              </div>
              <span class="book-card-price">$${book.price.toFixed(2)}</span>
            </div>
            ${isExternal ? `
              <div class="book-card-stock" style="margin-block: 0.25rem 0.75rem; text-align: left; display: flex; align-items: center; width: 100%;">
                <span class="stock-badge in-stock" style="background: rgba(2, 70, 68, 0.4); color: var(--color-sand);">
                  Web Result
                </span>
              </div>
              <button class="btn-card ${btnClass}" data-id="${book.id}">
                ${btnText}
              </button>
            ` : (isPreOrder ? `
              <button class="btn-card ${btnClass}" data-id="${book.id}" style="background-color: var(--accent-color); color: var(--color-sand);">Pre-Order</button>
            ` : `
              <div class="book-card-stock" style="margin-block: 0.25rem 0.75rem; text-align: left; display: flex; align-items: center; width: 100%;">
                <span class="stock-badge ${book.stock === 0 ? 'out-of-stock' : 'in-stock'}">
                  ${book.stock === 0 ? 'Out of Stock' : `${book.stock} left in stock`}
                </span>
              </div>
              <button class="btn-card ${btnClass}" data-id="${book.id}" ${book.stock === 0 ? 'disabled' : ''}>
                ${book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
            `)}
          </div>
        </article>
      </div>
    `;
  };

  // --- EVENT ATTACHMENTS ---

  // Attach slider controls
  const attachSliderListeners = () => {
    const prevBtn = contentArea.querySelector(".slider-control.prev");
    const nextBtn = contentArea.querySelector(".slider-control.next");
    const dots = contentArea.querySelectorAll(".slider-dot");
    const slides = contentArea.querySelectorAll(".slide");

    const showSlide = (index) => {
      activeSlideIndex = index;
      slides.forEach((slide, i) => {
        if (i === index) {
          slide.classList.add("active");
        } else {
          slide.classList.remove("active");
        }
      });
      dots.forEach((dot, i) => {
        if (i === index) {
          dot.classList.add("active");
        } else {
          dot.classList.remove("active");
        }
      });

      // Update dynamic blurred background opacity
      const bgImages = contentArea.querySelectorAll(".slider-bg-blur-image");
      bgImages.forEach((img, i) => {
        if (i === index) {
          img.classList.add("active");
        } else {
          img.classList.remove("active");
        }
      });
    };

    const nextSlide = () => {
      let idx = activeSlideIndex + 1;
      if (idx >= slides.length) idx = 0;
      showSlide(idx);
    };

    const prevSlide = () => {
      let idx = activeSlideIndex - 1;
      if (idx < 0) idx = slides.length - 1;
      showSlide(idx);
    };

    if (prevBtn) prevBtn.addEventListener("click", prevSlide);
    if (nextBtn) nextBtn.addEventListener("click", nextSlide);
    
    dots.forEach(dot => {
      dot.addEventListener("click", () => {
        showSlide(parseInt(dot.dataset.index));
      });
    });

    // Auto rotate slides every 5 seconds
    sliderInterval = setInterval(nextSlide, 5000);
  };

  // Attach Catalog Book Card Click listeners
  const attachBookCardListeners = () => {
    contentArea.querySelectorAll("[data-id]").forEach(el => {
      if (el.dataset.id && (el.tagName === "DIV" || el.tagName === "H3" || el.classList.contains("btn-explore"))) {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          const bookId = el.dataset.id;
          const isExternal = el.dataset.external === "true";
          
          if (isExternal) {
            const book = browseExternalResults.find(b => b.id === bookId);
            if (book) {
              if (!books.some(b => b.id === book.id)) {
                book.stock = 5;
                books.push(book);
                saveImportedBooks(books);
              }
              showBookDetail(book.id);
            }
          } else {
            showBookDetail(bookId);
          }
        });
      }
    });

    contentArea.querySelectorAll(".btn-add-cart").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(btn.dataset.id);
      });
    });

    contentArea.querySelectorAll(".btn-preorder").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        addToCart(btn.dataset.id, true);
      });
    });

    contentArea.querySelectorAll(".btn-browse-external").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const bookId = btn.dataset.id;
        const book = browseExternalResults.find(b => b.id === bookId);
        if (book) {
          if (!books.some(b => b.id === book.id)) {
            book.stock = 5;
            books.push(book);
            saveImportedBooks(books);
          }
          addToCart(book.id);
          
          btn.disabled = true;
          btn.style.opacity = "0.5";
          btn.textContent = "Added to Cart";
          
          setTimeout(() => {
            if (currentTab === "browse") {
              executeBrowseSearch();
            }
          }, 800);
        }
      });
    });
  };

  // Attach Browse Filters and Local search listeners (Handled locally inside renderBrowseView now)
  const attachBrowseFilterListeners = () => {};

  // Attach Universal "Collect Any Book" Search triggers
  const attachCollectListeners = () => {
    const btnCollectSearch = document.getElementById("btn-collect-search");
    const collectInput = document.getElementById("collect-search-input");
    
    if (btnCollectSearch) {
      btnCollectSearch.addEventListener("click", async () => {
        const queryVal = collectInput.value.trim();
        if (!queryVal) {
          showToast("Please enter a book title, author, or ISBN", "error");
          return;
        }
        
        btnCollectSearch.disabled = true;
        btnCollectSearch.textContent = "Searching...";
        showToast("Searching global databases...", "info");
        
        try {
          const results = await window.GoodreadsSync.searchOpenLibrary(queryVal);
          if (results.length === 0) {
            showToast("No matches found. Try searching for a simpler title.", "error");
          } else {
            olSearchResults = results;
            renderBrowseView();
            showToast(`Found ${results.length} book results!`, "success");
          }
        } catch (err) {
          showToast(`Search error: ${err.message}`, "error");
        } finally {
          btnCollectSearch.disabled = false;
          btnCollectSearch.textContent = "Search Database";
        }
      });
    }

    contentArea.querySelectorAll(".btn-collect-add").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index);
        const book = olSearchResults[index];
        if (book) {
          addImportedBookToStore(book);
          btn.disabled = true;
          btn.style.opacity = "0.5";
          btn.style.backgroundColor = "var(--color-brown)";
          btn.textContent = "Collected";
          
          // Small update delay before reloading Browse Catalog to avoid input resets
          setTimeout(() => {
            renderBrowseView();
          }, 800);
        }
      });
    });
  };



  // --- CART PAGE / CHECKOUT HANDLERS ---
  const attachCartPageListeners = () => {
    // Quantity controls
    contentArea.querySelectorAll(".btn-qty-minus").forEach(btn => {
      btn.addEventListener("click", () => {
        updateCartQty(btn.dataset.id, -1);
        renderCartView(); // redraw
      });
    });
    contentArea.querySelectorAll(".btn-qty-plus").forEach(btn => {
      btn.addEventListener("click", () => {
        updateCartQty(btn.dataset.id, 1);
        renderCartView();
      });
    });
    contentArea.querySelectorAll(".btn-item-remove").forEach(btn => {
      btn.addEventListener("click", () => {
        updateCartQty(btn.dataset.id, -cart.find(i => i.id === btn.dataset.id).qty);
        renderCartView();
      });
    });

    // Delivery selection
    contentArea.querySelectorAll('input[name="delivery-location"]').forEach(radio => {
      radio.addEventListener("change", (e) => {
        selectedDelivery = e.target.value;
        renderCartView();
      });
    });

    // Payment selection
    contentArea.querySelectorAll('input[name="payment-method"]').forEach(radio => {
      radio.addEventListener("change", (e) => {
        selectedPayment = e.target.value;
        renderCartView();
      });
    });

    // Promo code handler
    const btnPromo = document.getElementById("btn-apply-promo");
    const promoInput = document.getElementById("promo-input");
    if (btnPromo) {
      btnPromo.addEventListener("click", () => {
        const val = promoInput.value.trim().toUpperCase();
        if (val === "LILY20") {
          appliedDiscount = 0.20;
          showToast("20% discount applied successfully!", "success");
          renderCartView();
        } else if (val) {
          showToast("Invalid Promo Code", "error");
        } else {
          showToast("Please enter a code", "error");
        }
      });
    }

    // Billing Checkout submit
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        // Save to order history if user is logged in
        if (currentUser) {
          if (!currentUser.orders) currentUser.orders = [];
          
          const totalSpent = calculateTotalSpent(currentUser);
          const tier = getMemberTier(totalSpent);
          
          let deliveryFee = selectedDelivery === "phnom-penh" ? 1.50 : 2.00;
          if (tier.name === "Gold Member") {
            deliveryFee = 0;
          }
          
          const hasPreorder = cart.some(item => item.isPreOrder);
          const dateStr = new Date().toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
          const subtotalVal = cart.reduce((sum, it) => sum + (it.price * it.qty), 0);
          const combinedDiscountRate = appliedDiscount + tier.discount;
          const discountVal = subtotalVal * combinedDiscountRate;
          const totalVal = subtotalVal - discountVal + deliveryFee;
          
          const oldSpent = calculateTotalSpent(currentUser);
          
          currentUser.orders.unshift({
            id: `ord-${Date.now()}`,
            items: cart.map(it => ({ title: it.title + (it.store ? ` (Pre-order via ${it.store})` : ''), qty: it.qty })),
            total: totalVal,
            date: dateStr,
            isPreOrder: hasPreorder,
            delivery: selectedDelivery === "phnom-penh" ? "Phnom Penh" : "Province",
            deliveryFee: deliveryFee,
            paymentMethod: selectedPayment === "credit-card" ? "Credit/Debit Card" : selectedPayment === "aba-pay" ? "ABA Pay" : selectedPayment === "bakong-qr" ? "Bakong QR Scan" : "Cash on Delivery"
          });
          
          saveUserState();
          
          const newSpent = calculateTotalSpent(currentUser);
          const oldTier = getMemberTier(oldSpent);
          const newTier = getMemberTier(newSpent);
          if (oldTier.name !== newTier.name) {
            setTimeout(() => {
              showToast(`🎉 Congratulations! You have unlocked ${newTier.name} status!`, "success");
            }, 1000);
          }
          
          // Silently update user order cache in registered users list
          let users = [];
          try {
            const savedUsers = localStorage.getItem("lily_registered_users");
            if (savedUsers) users = JSON.parse(savedUsers);
            const uIdx = users.findIndex(u => u.username === currentUser.username);
            if (uIdx !== -1) {
              users[uIdx].orders = currentUser.orders;
              localStorage.setItem("lily_registered_users", JSON.stringify(users));
            }
          } catch (err) {}
        }
        
        showToast("Order placed successfully! Thank you for purchasing from Lily Bookstore.", "success");
        cart = [];
        appliedDiscount = 0;
        saveCartState();
        renderCart(); // update sidebar cart
        navigateTo("home");
      });
    }
  };

  // --- SIDEBAR SHOPPING CART DRAW METHODS ---
  const addToCart = (bookId, isPreOrder = false, storeInfo = null) => {
    if (!currentUser) {
      showToast("Please register or log in first to add books to your cart.", "error");
      authTab = "login";
      navigateTo("profile");
      return;
    }
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    // Use store-specific item ID if it's a pre-order with store details
    const cartItemId = storeInfo ? `${bookId}-${storeInfo.store.replace(/\s+/g, '-').toLowerCase()}` : bookId;
    const existing = cart.find(i => i.id === cartItemId);
    
    if (!isPreOrder) {
      const maxStock = typeof book.stock !== 'undefined' ? book.stock : 999;
      const currentQty = existing ? existing.qty : 0;
      if (currentQty >= maxStock) {
        showToast(`Sorry, only ${maxStock} copy/copies of "${book.title}" are available in stock.`, "warning");
        return;
      }
    }

    if (existing) {
      existing.qty++;
    } else {
      cart.push({
        id: cartItemId,
        bookId: book.id,
        title: book.title,
        author: book.author,
        cover: book.cover,
        price: storeInfo ? storeInfo.price : book.price,
        qty: 1,
        isPreOrder: isPreOrder,
        store: storeInfo ? storeInfo.store : null,
        country: storeInfo ? storeInfo.country : null
      });
    }
    saveCartState();
    renderCart();
    openCartDrawer();
    const toastMsg = isPreOrder 
      ? `Added "${book.title}" to pre-orders${storeInfo ? ` via ${storeInfo.store}` : ''}!`
      : `Added "${book.title}" to cart!`;
    showToast(toastMsg, "success");
  };

  const updateCartQty = (bookId, delta) => {
    const item = cart.find(i => i.id === bookId);
    if (!item) return;

    if (delta > 0 && !item.isPreOrder) {
      const book = books.find(b => b.id === item.bookId);
      if (book) {
        const maxStock = typeof book.stock !== 'undefined' ? book.stock : 999;
        if (item.qty + delta > maxStock) {
          showToast(`Sorry, only ${maxStock} copy/copies of "${book.title}" are available in stock.`, "warning");
          return;
        }
      }
    }

    item.qty += delta;
    if (item.qty <= 0) {
      cart = cart.filter(i => i.id !== bookId);
    }
    saveCartState();
    renderCart();
  };

  const openCartDrawer = () => cartOverlay.classList.add("open");
  const closeCartDrawer = () => cartOverlay.classList.remove("open");

  const renderCart = () => {
    cartItemsContainer.innerHTML = "";
    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty-icon">🛒</div>
          <p>Your cart is empty.</p>
        </div>
      `;
      cartSubtotal.textContent = "$0.00";
      return;
    }

    let itemsHtml = "";
    let subtotalVal = 0;
    cart.forEach(item => {
      subtotalVal += item.price * item.qty;
      itemsHtml += `
        <div class="cart-item">
          ${item.cover ? `
            <img src="${item.cover}" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=&quot;cart-item-cover&quot; style=&quot;background: linear-gradient(135deg, var(--color-teal), var(--color-brown)); display: flex; align-items: center; justify-content: center; text-align: center; padding: 4px; font-size: 0.55rem; color: var(--color-sand); font-weight: 700; line-height: 1.1; overflow: hidden;&quot;>${item.title.replace(/'/g, "\\'")}</div>';" class="cart-item-cover" alt="${item.title}" />
          ` : `
            <div class="cart-item-cover" style="background: linear-gradient(135deg, var(--color-teal), var(--color-brown)); display: flex; align-items: center; justify-content: center; text-align: center; padding: 4px; font-size: 0.55rem; color: var(--color-sand); font-weight: 700; line-height: 1.1; overflow: hidden;">
              ${item.title}
            </div>
          `}
          <div class="cart-item-info">
            <div>
              <h4 class="cart-item-title">${item.title} ${item.isPreOrder ? `<span class="order-status-badge pre-order" style="font-size: 0.65rem; padding: 1px 4px; vertical-align: middle; margin-left: 4px;">Pre-Order${item.store ? ` (${item.store})` : ''}</span>` : ''}</h4>
              <p class="cart-item-author">by ${item.author}</p>
            </div>
            <div class="cart-item-controls">
              <div class="cart-qty-selectors">
                <button class="cart-qty-btn btn-qty-minus" data-id="${item.id}">-</button>
                <span class="cart-qty-val">${item.qty}</span>
                <button class="cart-qty-btn btn-qty-plus" data-id="${item.id}">+</button>
              </div>
              <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
            </div>
          </div>
          <button class="cart-item-remove" data-id="${item.id}">✕</button>
        </div>
      `;
    });

    cartItemsContainer.innerHTML = itemsHtml;
    cartSubtotal.textContent = `$${subtotalVal.toFixed(2)}`;

    // Sidebar listeners
    cartItemsContainer.querySelectorAll(".btn-qty-minus").forEach(btn => {
      btn.addEventListener("click", () => updateCartQty(btn.dataset.id, -1));
    });
    cartItemsContainer.querySelectorAll(".btn-qty-plus").forEach(btn => {
      btn.addEventListener("click", () => updateCartQty(btn.dataset.id, 1));
    });
    cartItemsContainer.querySelectorAll(".cart-item-remove").forEach(btn => {
      btn.addEventListener("click", () => updateCartQty(btn.dataset.id, -cart.find(i => i.id === btn.dataset.id).qty));
    });
  };

  const updateCartCount = () => {
    const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCountBadges.forEach(badge => {
      badge.textContent = totalItems;
      badge.style.display = totalItems > 0 ? "flex" : "none";
    });
  };

  // --- PRE-ORDER DIALOG MODAL ---
  const showPreOrderOptions = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const amazonUrl = `https://www.amazon.com/s?k=${encodeURIComponent(book.title + " " + book.author)}`;
    const worksUrl = `https://www.theworks.co.uk/search?q=${encodeURIComponent(book.title)}`;

    bookDialog.innerHTML = `
      <div class="dialog-modal-content" style="background-color: var(--color-brown-alpha-90); border: 1px solid var(--color-sand-alpha-15); backdrop-filter: blur(24px); box-shadow: var(--glass-shadow); max-width: 450px;">
        <button class="dialog-close-btn" aria-label="Close pre-order options">✕</button>
        <div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; padding-block: 1rem;">
          <img src="${book.cover}" referrerpolicy="no-referrer" onerror="this.outerHTML='<div class=&quot;book-detail-cover-placeholder&quot; style=&quot;height: 180px; width: 120px;&quot;><span class=&quot;book-card-no-cover-title&quot;>${book.title.replace(/'/g, "\\'")}</span></div>';" style="height: 180px; width: auto; border-radius: var(--border-radius-md); box-shadow: 0 8px 24px var(--color-brown-alpha-90);" alt="${book.title}" />
          <div>
            <h2 class="book-detail-title" style="text-align: center; margin-bottom: 0.25rem; font-size: 1.6rem; color: var(--color-sand);">${book.title}</h2>
            <p class="book-detail-author" style="text-align: center; margin-bottom: 1rem; color: var(--text-muted);">by ${book.author}</p>
            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.4; margin-bottom: 0;">This title is an upcoming release. Choose a retailer below to pre-order:</p>
          </div>
          <div style="display: flex; flex-direction: column; gap: 0.75rem; width: 100%; max-width: 300px;">
            <a href="${amazonUrl}" target="_blank" class="btn-primary" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; text-decoration: none; padding-block: 0.75rem; font-size: 0.9rem; width: 100%;">
              🛒 Pre-Order on Amazon
            </a>
            <a href="${worksUrl}" target="_blank" class="btn-primary" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; background-color: var(--color-brown); border: 1px solid var(--glass-border); text-decoration: none; padding-block: 0.75rem; font-size: 0.9rem; width: 100%;">
              📚 Pre-Order on The Works (UK)
            </a>
          </div>
        </div>
      </div>
    `;

    bookDialog.querySelector(".dialog-close-btn").addEventListener("click", () => bookDialog.close());
    bookDialog.showModal();
  };

  // --- DETAIL DIALOG MODAL ---
  const showBookDetail = (bookId) => {
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    const hasPurchasedBook = (username, bookTitle) => {
      const user = currentUser && currentUser.username === username ? currentUser : null;
      if (!user || !user.orders) return false;
      const baseTitle = bookTitle.toLowerCase().trim();
      return user.orders.some(order => 
        order.items.some(item => {
          const itemTitle = item.title.toLowerCase();
          return itemTitle.includes(baseTitle);
        })
      );
    };

    const isPreOrder = book.category === "New Arrivals" || book.publishedYear >= 2026;

    const defaultReviews = [
      { reviewer: "Sarah K.", rating: 5, comment: "Absolutely loved the pace and chemistry! A fantastic read.", tier: "Silver Member", isVerified: true },
      { reviewer: "Michael D.", rating: 4, comment: "Great character development and very engaging style.", tier: "Bronze Reader", isVerified: false },
      { reviewer: "Sophia L.", rating: 5, comment: "One of the best books I've read this year! Highly recommended.", tier: "Gold Member", isVerified: true },
      { reviewer: "David P.", rating: 4, comment: "Very well written, kept me turning the pages late into the night.", tier: "Bronze Reader", isVerified: true },
      { reviewer: "Emma W.", rating: 3, comment: "It was a decent read. Good pacing, though some plot points felt predictable.", tier: "Guest", isVerified: false }
    ];
    const reviewsToRender = (book.reviews && book.reviews.length > 0) ? book.reviews : defaultReviews;
    let reviewsHtml = "";
    reviewsToRender.forEach(rev => {
      const userTier = rev.tier || "Bronze Reader";
      const tierClass = userTier.toLowerCase().replace(" ", "-");
      const verified = (typeof rev.isVerified !== 'undefined')
        ? rev.isVerified
        : hasPurchasedBook(rev.reviewer, book.title);
        
      const verifiedBadgeHtml = verified
        ? `<span class="verified-buyer-badge">✓ Verified Buyer</span>`
        : `<span class="community-reviewer-badge">Community Reviewer</span>`;
        
      reviewsHtml += `
        <div class="review-item" style="margin-bottom: 0.75rem;">
          <div class="review-header" style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <div style="display: flex; align-items: center; flex-wrap: wrap; gap: 0.35rem;">
              <span class="reviewer-name" style="font-weight: 700;">${rev.reviewer}</span>
              <span class="reviewer-tier-badge ${tierClass}">${userTier}</span>
              ${verifiedBadgeHtml}
            </div>
            <span class="review-rating" style="color: var(--accent-color); font-size: 0.85rem;">${'★'.repeat(rev.rating)}${'☆'.repeat(5 - rev.rating)}</span>
          </div>
          <p class="review-comment" style="font-size: 0.9rem; color: var(--color-sand-alpha-80); margin-top: 0.35rem; line-height: 1.4; font-style: italic;">"${rev.comment}"</p>
        </div>
      `;
    });

    let reviewFormHtml = `
      <div class="add-review-form">
        <h4 class="add-review-title">Write a Review</h4>
        ${!currentUser ? `
          <div style="background: rgba(231, 215, 193, 0.03); border: 1px dashed var(--glass-border); border-radius: var(--border-radius-md); padding: 0.75rem 1.25rem; text-align: left; margin-bottom: 1rem; width: 100%;">
            <span style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">You are commenting as a Guest. Or <a href="#profile" id="link-modal-login" style="color: var(--accent-color); font-weight: 700; text-decoration: underline;">log in / register</a> to review with your loyalty membership benefits.</span>
            <input type="text" class="input-text" id="review-guest-name" placeholder="Your Name (Optional, defaults to Guest Reader)" style="width: 100%; max-width: 320px; padding: 0.45rem 1rem; border-radius: var(--border-radius-pill); border: 1px solid var(--glass-border); background-color: var(--color-brown-alpha-30); color: var(--color-sand); font-size: 0.85rem; outline: none; margin-top: 0.25rem;">
          </div>
        ` : ''}
        <div class="rating-input-row">
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--text-muted);">Your Rating:</span>
          <div class="star-rating-input" id="star-rating-selector">
            <span class="star-btn" data-value="1" style="font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">☆</span>
            <span class="star-btn" data-value="2" style="font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">☆</span>
            <span class="star-btn" data-value="3" style="font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">☆</span>
            <span class="star-btn" data-value="4" style="font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">☆</span>
            <span class="star-btn" data-value="5" style="font-size: 1.4rem; color: var(--text-muted); cursor: pointer;">☆</span>
          </div>
        </div>
        <textarea class="review-textarea" id="review-comment-input" required placeholder="Write your review and share your reading experience with the community..."></textarea>
        <button class="btn-primary" id="btn-submit-review" style="padding: 0.5rem 1.25rem; font-size: 0.85rem; border-radius: var(--border-radius-pill); cursor: pointer; align-self: flex-start; margin-top: 0.25rem;">Submit Review</button>
      </div>
    `;

    bookDialog.innerHTML = `
      <div class="dialog-modal-content">
        <button class="dialog-close-btn" aria-label="Close details">✕</button>
        <div class="book-detail-layout">
          <div class="book-detail-cover-column" style="display: flex; flex-direction: column; gap: 1.25rem; align-items: center; width: 100%;">
            <div style="position: relative; width: 100%; display: flex; align-items: center; justify-content: center;">
              <img src="${book.cover ? getCoverUrl(book.cover) : ''}" 
                   referrerpolicy="no-referrer" 
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" 
                   class="book-detail-cover" 
                   alt="${book.title} Cover" 
                   style="${book.cover ? '' : 'display: none;'}" />
              <div class="book-detail-cover-placeholder" style="${book.cover ? 'display: none;' : 'display: flex;'}">
                <span class="book-card-no-cover-title" style="font-size: 1.4rem; margin-bottom: 0.75rem;">${book.title}</span>
                <span class="book-card-no-cover-author" style="font-size: 0.95rem;">by ${book.author}</span>
              </div>
            </div>
          </div>
          <div class="book-detail-body">
            <h2 class="book-detail-title" style="text-align: left; margin-bottom: 0.5rem;">${book.title}</h2>
            <p class="book-detail-author">by ${book.author}</p>
            <div class="book-detail-meta" style="display: flex; align-items: center; gap: 1rem;">
              <div class="book-card-stars" style="font-size: 1.1rem;">
                ${'★'.repeat(book.rating)}${'☆'.repeat(5 - book.rating)}
              </div>
              <span class="book-card-price" style="font-size: 1.4rem;">$${book.price.toFixed(2)}</span>
              ${!isPreOrder ? `
                <span class="detail-stock-badge ${book.stock === 0 ? 'out-of-stock' : 'in-stock'}">
                  ${book.stock === 0 ? 'Out of Stock' : `${book.stock} left in stock`}
                </span>
              ` : ''}
            </div>
            <div class="book-detail-actions" style="display: flex; gap: 1rem; margin-block: 1rem 1.5rem;">
              ${isPreOrder ? `
                <button class="btn-primary btn-modal-preorder" data-id="${book.id}">
                  Pre-Order
                </button>
              ` : `
                <button class="btn-primary btn-modal-add-cart" data-id="${book.id}" ${book.stock === 0 ? 'disabled' : ''}>
                  ${book.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              `}
            </div>
            <p class="book-detail-desc">${book.description}</p>
          </div>
        </div>

        <div class="book-reviews-section">
          <h3 class="book-reviews-title">Reader Reviews</h3>
          ${reviewFormHtml}
          <div class="reviews-list">
            ${reviewsHtml}
          </div>
        </div>
      </div>
    `;

    bookDialog.querySelector(".dialog-close-btn").addEventListener("click", () => bookDialog.close());
    
    const loginLink = bookDialog.querySelector("#link-modal-login");
    if (loginLink) {
      loginLink.addEventListener("click", (e) => {
        e.preventDefault();
        bookDialog.close();
        authTab = "login";
        navigateTo("profile");
      });
    }

    if (currentUser) {
      let selectedRating = 5;
      const stars = bookDialog.querySelectorAll(".star-btn");
      
      const updateStarDisplay = (val) => {
        stars.forEach(s => {
          const v = parseInt(s.dataset.value);
          if (v <= val) {
            s.textContent = "★";
            s.style.color = "var(--accent-color)";
          } else {
            s.textContent = "☆";
            s.style.color = "var(--text-muted)";
          }
        });
      };
      
      updateStarDisplay(selectedRating);
      
      stars.forEach(s => {
        s.addEventListener("click", () => {
          selectedRating = parseInt(s.dataset.value);
          updateStarDisplay(selectedRating);
        });
        s.addEventListener("mouseover", () => {
          updateStarDisplay(parseInt(s.dataset.value));
        });
        s.addEventListener("mouseout", () => {
          updateStarDisplay(selectedRating);
        });
      });
      
      const btnSubmit = bookDialog.querySelector("#btn-submit-review");
      const commentInput = bookDialog.querySelector("#review-comment-input");
      
      if (btnSubmit) {
        btnSubmit.addEventListener("click", () => {
          const commentVal = commentInput.value.trim();
          if (!commentVal) {
            showToast("Please enter a review comment", "error");
            return;
          }
          
          let reviewerName = "Guest Reader";
          let userTierName = "Guest";
          let verified = false;
          
          if (currentUser) {
            reviewerName = currentUser.username;
            const userSpent = calculateTotalSpent(currentUser);
            const userTier = getMemberTier(userSpent);
            userTierName = userTier.name;
            verified = hasPurchasedBook(currentUser.username, book.title);
          } else {
            const nameInput = bookDialog.querySelector("#review-guest-name");
            if (nameInput && nameInput.value.trim()) {
              reviewerName = nameInput.value.trim();
            }
          }
          
          if (!book.reviews) book.reviews = [];
          
          book.reviews.unshift({
            reviewer: reviewerName,
            rating: selectedRating,
            comment: commentVal,
            tier: userTierName,
            isVerified: verified
          });
          
          const savedReviews = localStorage.getItem("lily_book_reviews");
          const customReviews = savedReviews ? JSON.parse(savedReviews) : {};
          customReviews[book.id] = book.reviews;
          localStorage.setItem("lily_book_reviews", JSON.stringify(customReviews));
          
          if (currentTab === "browse") {
            renderBrowseResults();
          } else if (currentTab === "home") {
            renderHomeView();
          }
          
          showToast("Review submitted successfully!", "success");
          showBookDetail(book.id);
        });
      }
    }

    if (isPreOrder) {
      bookDialog.querySelector(".btn-modal-preorder").addEventListener("click", () => {
        addToCart(book.id, true);
        bookDialog.close();
      });
    } else {
      bookDialog.querySelector(".btn-modal-add-cart").addEventListener("click", () => {
        addToCart(book.id);
        bookDialog.close();
      });
    }
    bookDialog.showModal();
  };

  // --- TOAST NOTIFICATION CREATOR ---
  const showToast = (message, type = "info") => {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    let icon = "ℹ️";
    if (type === "success") icon = "✓";
    if (type === "error") icon = "⚠️";
    toast.innerHTML = `
      <span style="font-weight: 700;">${icon}</span>
      <span>${message}</span>
    `;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("fade-out");
      toast.addEventListener("animationend", () => {
        toast.remove();
      });
    }, 3000);
  };

  // --- INITIALIZATION ---
  loadState();
  renderCart();
  updateCartCount();
  navigateTo("home");

  window.addEventListener("resize", updateNavIndicator);
  window.addEventListener("load", updateNavIndicator);



  // Connect global static triggers
  const logoBrand = document.getElementById("brand-logo");
  if (logoBrand) {
    logoBrand.addEventListener("click", (e) => {
      e.preventDefault();
      navigateTo("home");
    });
  }
  floatingCart.addEventListener("click", openCartDrawer);
  document.querySelector(".cart-close").addEventListener("click", closeCartDrawer);
  cartOverlay.addEventListener("click", (e) => {
    if (e.target === cartOverlay) closeCartDrawer();
  });
  
  // Checkout button redirect to Cart Page
  document.querySelector(".btn-checkout").addEventListener("click", () => {
    closeCartDrawer();
    navigateTo("cart");
  });

  // Newsletter subscribe
  const newsletterForm = document.querySelector(".subscribe-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      showToast("Thank you for subscribing to Lily Bookstore newsletters!", "success");
      e.target.reset();
    });
  }

  // Connect footer links
  document.querySelectorAll(".footer-links-col a").forEach(link => {
    link.addEventListener("click", (e) => {
      const tab = link.getAttribute("href");
      if (tab.startsWith("#")) {
        e.preventDefault();
        navigateTo(tab.substring(1));
      }
    });
  });

  // --- PROGRESSIVE WEB APP (PWA) INSTALL BANNER LOGIC ---
  let deferredPrompt = null;
  const pwaBanner = document.getElementById("pwa-banner");
  const btnPwaInstall = document.getElementById("btn-pwa-install");
  const btnPwaDismiss = document.getElementById("btn-pwa-dismiss");

  const showInstallUI = () => {
    if (localStorage.getItem("pwa-dismissed") === "true") return;
    if (pwaBanner) {
      pwaBanner.classList.add("show");
    }
  };

  const hideInstallUI = () => {
    if (pwaBanner) {
      pwaBanner.classList.remove("show");
    }
  };

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI to show the install button/option
    showInstallUI();
  });

  if (btnPwaInstall) {
    btnPwaInstall.addEventListener("click", () => {
      if (!deferredPrompt) return;
      // Show the install prompt
      deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }
        deferredPrompt = null;
        hideInstallUI();
      });
    });
  }

  if (btnPwaDismiss) {
    btnPwaDismiss.addEventListener("click", () => {
      hideInstallUI();
      localStorage.setItem("pwa-dismissed", "true");
    });
  }

  window.addEventListener("appinstalled", (e) => {
    console.log("PWA was installed");
    hideInstallUI();
    deferredPrompt = null;
  });

  // Register Service Worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js")
        .then((reg) => console.log("Service Worker registered successfully!", reg))
        .catch((err) => console.error("Service Worker registration failed:", err));
    });
  }

  // --- CONNECTION STATUS MONITORS ---
  window.addEventListener("online", () => {
    showToast("Internet connection restored. Back online!", "success");
  });

  window.addEventListener("offline", () => {
    showToast("Connection lost. Working offline using cached pages.", "error");
  });

  if (!navigator.onLine) {
    // Small delay to allow the layout components to mount first
    setTimeout(() => {
      showToast("You are currently offline. Served from local cache.", "error");
    }, 1500);
  }
});
