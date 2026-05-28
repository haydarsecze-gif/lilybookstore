// Goodreads Scraper and OpenLibrary Search Module
const GoodreadsSync = {
  CORS_PROXY: "https://api.allorigins.win/get?url=",

  /**
   * RFC 4180 compliant CSV parser
   */
  parseCSV(text) {
    const lines = [];
    let row = [""];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push('');
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') { i++; }
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += char;
      }
    }
    if (row.length > 1 || row[0] !== '') {
      lines.push(row);
    }
    return lines;
  },

  /**
   * Parse uploaded CSV file content
   */
  processGoodreadsCSV(csvData) {
    if (csvData.length < 2) return [];
    
    const headers = csvData[0].map(h => h.trim().toLowerCase());
    const bookIdIndex = headers.indexOf("book id");
    const titleIndex = headers.indexOf("title");
    const authorIndex = headers.indexOf("author");
    const isbnIndex = headers.indexOf("isbn");
    const isbn13Index = headers.indexOf("isbn13");
    const myRatingIndex = headers.indexOf("my rating");
    const avgRatingIndex = headers.indexOf("average rating");
    const exclusiveShelfIndex = headers.indexOf("exclusive shelf");
    const reviewIndex = headers.indexOf("my review");
    
    const books = [];
    for (let i = 1; i < csvData.length; i++) {
      const row = csvData[i];
      if (row.length < headers.length) continue;
      
      const bookId = row[bookIdIndex] || `gr-${i}`;
      const title = row[titleIndex] || "Unknown Title";
      const author = row[authorIndex] || "Unknown Author";
      const isbn = (row[isbn13Index] || row[isbnIndex] || "").replace(/[^0-9X]/g, "");
      
      let cover = "";
      if (isbn) {
        cover = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
      }
      
      const ratingVal = parseInt(row[myRatingIndex]) || parseFloat(row[avgRatingIndex]) || 4;
      const shelf = row[exclusiveShelfIndex] || "read";
      const price = parseFloat((12.99 + (i % 6) * 1.50).toFixed(2));
      
      // Determine category based on title keyword or round-robin
      const categories = ["Romance", "Thriller", "New Arrivals"];
      const category = categories[i % categories.length];
      
      books.push({
        id: `gr-${bookId}`,
        title: title,
        author: author,
        category: category,
        rating: Math.round(ratingVal) || 4,
        price: price,
        cover: cover,
        description: row[reviewIndex] || `A book imported from your Goodreads shelf: ${shelf}. Written by ${author}.`,
        isGoodreadsImport: true,
        shelf: shelf
      });
    }
    return books;
  },

  /**
   * Sync from Goodreads RSS Feed
   */
  async syncGoodreadsRSS(userIdOrUrl) {
    let url = userIdOrUrl.trim();
    if (/^\d+$/.test(url)) {
      url = `https://www.goodreads.com/review/list_rss/${url}?shelf=read`;
    }
    if (url.includes("goodreads.com/review/list/") && !url.includes("list_rss")) {
      url = url.replace("goodreads.com/review/list/", "goodreads.com/review/list_rss/");
    }
    
    const targetUrl = this.CORS_PROXY + encodeURIComponent(url);
    const response = await fetch(targetUrl);
    if (!response.ok) throw new Error("CORS proxy connection error");
    
    const data = await response.json();
    const rawXml = data.contents;
    if (!rawXml) throw new Error("Received empty XML from Goodreads feed");
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(rawXml, "text/xml");
    
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) throw new Error("Invalid RSS Feed XML format. Check if your profile is public.");
    
    const items = xmlDoc.querySelectorAll("item");
    const books = [];
    
    items.forEach((item, index) => {
      const getCDATAText = (selector) => {
        const el = item.querySelector(selector);
        return el ? el.textContent.trim() : "";
      };
      
      const bookId = item.querySelector("book_id")?.textContent || `rss-${index}`;
      const title = getCDATAText("title");
      const author = getCDATAText("author_name");
      
      let cover = getCDATAText("book_large_image_url") || 
                  getCDATAText("book_image_url") || 
                  getCDATAText("book_medium_image_url");
      
      // Clean cover to high resolution original
      if (cover) {
        cover = cover.replace(/\._S[XY]\d+_\./, ".");
      }
      
      if (!cover || cover.includes("nophoto")) {
        const isbn = item.querySelector("isbn")?.textContent || "";
        if (isbn) {
          cover = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
        } else {
          cover = "";
        }
      }
      
      const ratingVal = parseInt(item.querySelector("user_rating")?.textContent) || 4;
      const description = getCDATAText("book_description") || `A reading recommendation: ${title}.`;
      const price = parseFloat((12.99 + (index % 6) * 1.50).toFixed(2));
      
      const categories = ["Romance", "Thriller", "New Arrivals"];
      
      books.push({
        id: `gr-${bookId}`,
        title: title,
        author: author,
        category: categories[index % categories.length],
        rating: ratingVal || 4,
        price: price,
        cover: cover,
        description: description.replace(/<[^>]*>/g, ""),
        isGoodreadsImport: true,
        shelf: "read"
      });
    });
    
    return books;
  },

  /**
   * SCRAPE PUBLIC GOODREADS LIST PAGE (DOM Selector parser)
   * Scrapes HTML from a public book list (like Best Books Ever)
   */
  async fetchGoodreadsList(listUrl) {
    const targetUrl = this.CORS_PROXY + encodeURIComponent(listUrl);
    try {
      const response = await fetch(targetUrl);
      if (!response.ok) throw new Error("Connection failed");
      
      const data = await response.json();
      const htmlText = data.contents;
      if (!htmlText) throw new Error("Empty list returned");
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      
      // Find rows
      let rows = doc.querySelectorAll('tr[itemtype="http://schema.org/Book"]');
      if (rows.length === 0) {
        rows = doc.querySelectorAll('.tableList tr');
      }
      
      const books = [];
      const categories = ["Romance", "Thriller", "New Arrivals"];
      
      rows.forEach((row, index) => {
        if (books.length >= 60) return; // Cap at 60 books for layout stability
        
        try {
          const titleEl = row.querySelector('.bookTitle');
          const authorEl = row.querySelector('.authorName');
          const coverEl = row.querySelector('img.bookCover') || row.querySelector('img');
          const ratingEl = row.querySelector('.minirating');
          
          if (!titleEl || !authorEl) return;
          
          const title = titleEl.textContent.trim();
          const author = authorEl.textContent.trim();
          
          let cover = coverEl ? (coverEl.getAttribute('src') || coverEl.getAttribute('data-lazy-src') || "") : "";
          if (cover) {
            // Convert Goodreads thumbnail suffix to high-resolution original image
            cover = cover.replace(/\._S[XY]\d+_\./, ".");
            // Match older formats
            cover = cover.replace(/\._S[XY]\d+_/, "");
          }
          
          if (!cover || cover.includes("nophoto")) {
            cover = "";
          }
          
          // Parse rating: e.g. "4.12 avg rating — 2,123,456 ratings"
          let rating = 4;
          if (ratingEl) {
            const ratingText = ratingEl.textContent;
            const match = ratingText.match(/(\d+\.\d+)/);
            if (match) {
              rating = Math.round(parseFloat(match[1])) || 4;
            }
          }
          
          const id = "gr-list-" + title.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + index;
          const price = parseFloat((10.99 + (index % 7) * 1.50).toFixed(2));
          
          books.push({
            id: id,
            title: title,
            author: author,
            category: categories[index % categories.length],
            rating: rating,
            price: price,
            cover: cover,
            description: `A highly-rated classic featured on Goodreads: ${title}. A must-read recommendation by ${author}.`,
            isGoodreadsImport: false
          });
        } catch (e) {
          console.error("Error parsing row: ", e);
        }
      });
      
      return books;
    } catch (err) {
      console.error("Goodreads list scrape error:", err);
      throw err;
    }
  },

  /**
   * SEARCH OPENLIBRARY API FOR UNIVERSAL "COLLECT ANY BOOK"
   */
  async searchOpenLibrary(query) {
    if (!query) return [];
    
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Search API failure");
    
    const data = await response.json();
    const docs = data.docs || [];
    const books = [];
    const categories = ["Romance", "Thriller"];
    
    docs.forEach((doc, index) => {
      if (!doc.title || !doc.author_name) return;
      
      const title = doc.title;
      const author = doc.author_name[0];
      
      let cover = "";
      if (doc.cover_i) {
        cover = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      } else if (doc.isbn && doc.isbn.length > 0) {
        cover = `https://covers.openlibrary.org/b/isbn/${doc.isbn[0]}-L.jpg`;
      }
      
      const id = "ol-" + doc.key.replace("/works/", "");
      const rating = Math.round(doc.ratings_average) || 4;
      const price = parseFloat((11.99 + (index % 5) * 2.00).toFixed(2));
      
      const publishedYear = doc.first_publish_year || 2024;
      const isPre = (publishedYear >= 2026);
      
      books.push({
        id: id,
        title: title,
        author: author,
        category: isPre ? "New Arrivals" : categories[index % categories.length],
        rating: rating,
        price: price,
        cover: cover,
        description: doc.first_sentence ? doc.first_sentence[0] : `A literary work found via OpenLibrary search: ${title} by ${author}.`,
        isGoodreadsImport: true,
        isbns: doc.isbn || [],
        cover_i: doc.cover_i,
        publishedYear: publishedYear,
        isPreorder: isPre
      });
    });
    
    return books;
  }
};

window.GoodreadsSync = GoodreadsSync;
