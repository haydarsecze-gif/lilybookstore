// Book Database Store
const INITIAL_BOOKS = [
  {
    id: "fever-dream",
    title: "Fever Dream",
    author: "Elsie Silver",
    category: "Romance",
    rating: 5,
    price: 18.90,
    cover: "assets/fever_dream.png",
    description: "A handpicked community favorite curated for Lily Bookstore's digital selection. Follow a passionate and emotional journey in this top-trending romance novel.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2024,
    stock: 8,
    reviews: [
      { reviewer: "Sarah K.", rating: 5, comment: "Absolutely loved the pace and chemistry! Elsie Silver never misses.", tier: "Silver Member", isVerified: true },
      { reviewer: "Michael D.", rating: 5, comment: "A solid romance with fantastic character depth.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "the-divorce",
    title: "The Divorce",
    author: "Freida McFadden",
    category: "Thriller",
    rating: 5,
    price: 15.50,
    cover: "assets/the_divorce.png",
    description: "A gripping and suspenseful thriller that will keep you guessing until the very end. The Divorce is an intense domestic thriller about secrets, marriage, and betrayal.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2024,
    stock: 5,
    reviews: [
      { reviewer: "Liam J.", rating: 5, comment: "I couldn't put this down! The plot twist at the end blew my mind.", tier: "Gold Member", isVerified: true },
      { reviewer: "Emma W.", rating: 4, comment: "Freida McFadden is the queen of quick thrillers. Very fast-paced.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "our-perfect-storm",
    title: "Our Perfect Storm",
    author: "Carley Fortune",
    category: "Romance",
    rating: 5,
    price: 17.20,
    cover: "assets/our_perfect_storm.png",
    description: "A heartwarming summer romance about second chances, surfing, and finding love where you least expect it. Perfect for fans of beachside stories.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2025,
    stock: 4,
    reviews: [
      { reviewer: "Clara M.", rating: 5, comment: "Brings back all the nostalgia of summer love. Beautifully written.", tier: "Silver Member", isVerified: true },
      { reviewer: "Dan H.", rating: 5, comment: "The setting felt so alive. A wonderful second-chance romance.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "the-silent-patient",
    title: "The Silent Patient",
    author: "Alex Michaelides",
    category: "Thriller",
    rating: 5,
    price: 16.99,
    cover: "https://covers.openlibrary.org/b/isbn/9781250301703-L.jpg",
    description: "Alicia Berenson's life is seemingly perfect. A famous painter married to an in-demand fashion photographer, she lives in a grand house with big windows overlooking a park in London. One evening, she shoots her husband Gabriel five times in the face, and then never speaks another word. Alicia's refusal to talk, or give any kind of explanation, turns a domestic tragedy into something far grander, a mystery that captures the public imagination and casts Alicia into notoriety. Theo Faber is a criminal psychotherapist who has waited a long time for the opportunity to work with Alicia, determined to uncover the truth behind her silence.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2019,
    stock: 2,
    reviews: [
      { reviewer: "Jason K.", rating: 5, comment: "One of the best psychological thrillers I have ever read in my life.", tier: "Gold Member", isVerified: true },
      { reviewer: "Grace T.", rating: 4, comment: "Mind-bending twist. The pacing was absolutely perfect.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "verity",
    title: "Verity",
    author: "Colleen Hoover",
    category: "Thriller",
    rating: 5,
    price: 15.99,
    cover: "https://covers.openlibrary.org/b/isbn/9781538724736-L.jpg",
    description: "Lowen Ashleigh is a struggling writer on the brink of financial ruin when she accepts the job offer of a lifetime. Jeremy Crawford, husband of bestselling author Verity Crawford, has hired Lowen to complete the remaining books in a successful series his injured wife is unable to finish. Upon arriving at the Crawford home, Lowen finds an unfinished autobiography Verity wrote, containing spine-chilling admissions about her family's dark past and secrets. Lowen decides to keep the manuscript hidden from Jeremy, but as her feelings for him intensify, she realizes the horrifying truth could tear them apart.",
    isTrending: true,
    isHotPick: false,
    publishedYear: 2018,
    stock: 1,
    reviews: [
      { reviewer: "Elena B.", rating: 5, comment: "Disturbing, twisted, and completely addictive. I read it in one sitting!", tier: "Silver Member", isVerified: true },
      { reviewer: "Tom F.", rating: 5, comment: "Colleen Hoover shows a completely different side here. Brilliant thriller.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "it-ends-with-us",
    title: "It Ends with Us",
    author: "Colleen Hoover",
    category: "Romance",
    rating: 4,
    price: 14.50,
    cover: "https://covers.openlibrary.org/b/isbn/9781501110368-L.jpg",
    description: "Lily hasn't always had it easy, but that's never stopped her from working hard for the life she wants. She's come a long way from the small town in Maine where she grew up—she graduated from college, moved to Boston, and started her own floral business. When she feels a spark with a gorgeous, assertive neurosurgeon named Ryle Kincaid, everything in Lily's life suddenly seems almost too good to be true. But Ryle's complete aversion to relationships is disturbing, and as Lily finds herself becoming the exception to his 'no dating' rule, she can't help but wonder what made him that way in the first place.",
    isTrending: false,
    isHotPick: true,
    publishedYear: 2016,
    stock: 7,
    reviews: [
      { reviewer: "Olivia M.", rating: 4, comment: "A powerful and emotional story. It handles difficult topics with care.", tier: "Silver Member", isVerified: true },
      { reviewer: "Chris G.", rating: 4, comment: "Very emotional. Highly recommend for any romance fan.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "funny-story",
    title: "Funny Story",
    author: "Emily Henry",
    category: "Romance",
    rating: 5,
    price: 18.00,
    cover: "https://covers.openlibrary.org/b/isbn/9780593441213-L.jpg",
    description: "Daphne always loved the way her fiancé Peter told their story. How they met, fell in love, and moved back to his lakeside hometown to start their life together. He was really good at telling it... right up until he realized he was actually in love with his childhood best friend, Petra. Daphne is stranded in Waning Bay, Michigan, without friends or family but with a dream job as a children's librarian. Now she has to share an apartment with the only person who could possibly understand her predicament: Petra's ex-fiancé, Miles Nowak.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2024,
    stock: 9,
    reviews: [
      { reviewer: "Lily P.", rating: 5, comment: "Emily Henry did it again! The banter is unmatched.", tier: "Gold Member", isVerified: true },
      { reviewer: "Zoe C.", rating: 5, comment: "Funny, emotional, and so romantic. A true masterpiece.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "the-maid",
    title: "The Maid",
    author: "Nita Prose",
    category: "Thriller",
    rating: 4,
    price: 15.00,
    cover: "https://covers.openlibrary.org/b/isbn/9780593356159-L.jpg",
    description: "Molly Gray is not like everyone else. She struggles with social skills and misinterprets the intentions of others. Her gran used to interpret the world for her, codifying it into simple rules that Molly could live by. Since Gran died, twenty-five-year-old Molly has been navigating life's complexities all by herself. As a hotel maid, her orderly life is upended when she enters the suite of the infamous and wealthy Charles Black, only to find him dead in his bed. Before she knows what's happening, her unusual demeanor has the police suspecting her of the murder.",
    isTrending: true,
    isHotPick: false,
    publishedYear: 2022,
    stock: 3,
    reviews: [
      { reviewer: "Philip W.", rating: 4, comment: "Molly is such a unique and lovable protagonist. Very entertaining mystery.", tier: "Silver Member", isVerified: true },
      { reviewer: "Nancy L.", rating: 4, comment: "Charming, cozy, and keeps you guessing. A great weekend read.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "court-thorns-roses",
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    category: "Romance",
    rating: 5,
    price: 16.50,
    cover: "https://covers.openlibrary.org/b/isbn/9781635575569-L.jpg",
    description: "Feyre's survival rests upon her ability to hunt and kill—the forest where she lives is a cold, bleak place in the long winter months. When she spots a deer in the forest being pursued by a wolf, she cannot resist fighting it for the flesh. To do so, she must kill a predator, and killing something so precious comes with a high price. Dragged to a treacherous magical land she only knows about from legends, Feyre discovers that her captor is not an animal, but Tamlin—one of the lethal, immortal faeries who once ruled their world.",
    isTrending: false,
    isHotPick: true,
    publishedYear: 2015,
    stock: 6,
    reviews: [
      { reviewer: "FeyreFan", rating: 5, comment: "The romance, the magic, the world! I was absolutely hooked.", tier: "Silver Member", isVerified: true },
      { reviewer: "Reader99", rating: 4, comment: "A solid fantasy romance that builds up beautifully.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "guest-list",
    title: "The Guest List",
    author: "Lucy Foley",
    category: "Thriller",
    rating: 4,
    price: 15.99,
    cover: "https://covers.openlibrary.org/b/isbn/9780062868947-L.jpg",
    description: "On an island off the coast of Ireland, guests gather to celebrate two people joining their lives together as one. The cell phone service may be spotty and the waves may be rough, but every detail of this glamorous wedding has been expertly planned. But as the champagne begins to flow and the resentment starts to build, secrets and old grudges begin to mingle with the festivities. And then, a dead body is found. Who was the victim? Who was the killer? In this isolated setting, everyone has a motive, and someone won't make it off the island alive.",
    isTrending: true,
    isHotPick: false,
    publishedYear: 2020,
    stock: 10,
    reviews: [
      { reviewer: "MysteryBuff", rating: 4, comment: "Loved the shifting perspectives. Keeps you guessing who the victim is!", tier: "Silver Member", isVerified: true },
      { reviewer: "GroomedToKill", rating: 4, comment: "Very atmospheric setting and solid thriller elements.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "seven-husbands-evelyn-hugo",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    category: "Romance",
    rating: 5,
    price: 17.00,
    cover: "https://covers.openlibrary.org/b/id/15199344-L.jpg",
    description: "Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life. But when she chooses unknown magazine reporter Monique Monique for the job, no one in the journalism community is more astounded than Monique herself. Summoned to Evelyn's luxurious apartment, Monique listens as the actress spins a tale of ruthless ambition, unexpected friendship, and a great forbidden love. As Evelyn's story nears its conclusion, it becomes clear that her life intersects with Monique's own in tragic and irreversible ways.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2017,
    stock: 5,
    reviews: [
      { reviewer: "OldHollywood", rating: 5, comment: "One of the most mesmerizing characters ever written. Simply glorious.", tier: "Silver Member", isVerified: true },
      { reviewer: "HeartBroken", rating: 5, comment: "I cried so much! Evelyn Hugo will live in my heart forever.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "couple-next-door",
    title: "The Couple Next Door",
    author: "Shari Lapena",
    category: "Thriller",
    rating: 4,
    price: 14.99,
    cover: "https://covers.openlibrary.org/b/id/11530562-L.jpg",
    description: "Anne and Marco Conti seem to have it all: a loving relationship, a wonderful home, and their beautiful baby daughter, Cora. But one night, when they are at a dinner party next door, a terrible crime is committed. The suspicion immediately falls on the parents. But the truth is a much more complicated story. In the investigations that follow, secrets start to unravel as the couple is forced to face what really happened, revealing a web of deception, duplicity, and betrayal that lurks right next door.",
    isTrending: false,
    isHotPick: false,
    publishedYear: 2016,
    stock: 2,
    reviews: [
      { reviewer: "SuspenseLover", rating: 4, comment: "Fast-paced domestic thriller that makes you double check your locks.", tier: "Silver Member", isVerified: true },
      { reviewer: "TwistyTurny", rating: 4, comment: "Suspenseful and engaging. Great quick read.", tier: "Bronze Reader", isVerified: false }
    ]
  },
  {
    id: "love-hypothesis",
    title: "The Love Hypothesis",
    author: "Ali Hazelwood",
    category: "Romance",
    rating: 5,
    price: 15.00,
    cover: "https://covers.openlibrary.org/b/isbn/9780593336823-L.jpg",
    description: "When a third-year Ph.D. candidate encounters a sudden relationship crisis, she fake-dates a young, hot tempestuous professor. A viral sensation exploring academic romance, fake dating, and unexpected attraction.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2021,
    stock: 0, // OUT OF STOCK
    reviews: [
      { reviewer: "PhysicsGrad", rating: 5, comment: "Hilarious and smart! The academic setting is spot-on.", tier: "Silver Member", isVerified: false }
    ]
  },
  {
    id: "book-lovers",
    title: "Book Lovers",
    author: "Emily Henry",
    category: "Romance",
    rating: 5,
    price: 16.50,
    cover: "https://covers.openlibrary.org/b/id/11567819-L.jpg",
    description: "One summer. Two rivals. A plot twist they didn't see coming. A competitive literary agent and a brooding editor find themselves in the same small town, forcing them to re-evaluate their lives.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2022,
    stock: 6,
    reviews: []
  },
  {
    id: "happy-place",
    title: "Happy Place",
    author: "Emily Henry",
    category: "Romance",
    rating: 5,
    price: 17.50,
    cover: "https://covers.openlibrary.org/b/id/13233403-L.jpg",
    description: "A couple who broke up months ago make a pact to pretend to still be together for their annual weeklong vacation with their best friends in this heart-wrenching second-chance romance.",
    isTrending: true,
    isHotPick: false,
    publishedYear: 2023,
    stock: 4,
    reviews: []
  },
  {
    id: "icebreaker",
    title: "Icebreaker",
    author: "Hannah Grace",
    category: "Romance",
    rating: 4,
    price: 18.00,
    cover: "https://covers.openlibrary.org/b/isbn/9781668013571-L.jpg",
    description: "A competitive figure skater and the captain of the hockey team are forced to share a rink, leading to sparks, friction, and an intense enemies-to-lovers story.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2022,
    stock: 8,
    reviews: []
  },
  {
    id: "wildfire",
    title: "Wildfire",
    author: "Hannah Grace",
    category: "Romance",
    rating: 4,
    price: 18.00,
    cover: "https://covers.openlibrary.org/b/isbn/9781668026274-L.jpg",
    description: "Two summer camp counselors who had a passionate one-night stand try to keep their distance in this fun, flirty, and emotional contemporary romance.",
    isTrending: false,
    isHotPick: false,
    publishedYear: 2023,
    stock: 3,
    reviews: []
  },
  {
    id: "things-we-never-got-over",
    title: "Things We Never Got Over",
    author: "Lucy Score",
    category: "Romance",
    rating: 5,
    price: 16.99,
    cover: "https://covers.openlibrary.org/b/id/15134406-L.jpg",
    description: "A runaway bride escapes to a small town, only to end up helping her estranged twin sister, while dealing with a grumpy, bearded local barber who can't stand her but can't stay away.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2022,
    stock: 5,
    reviews: []
  },
  {
    id: "red-white-royal-blue",
    title: "Red, White & Royal Blue",
    author: "Casey McQuiston",
    category: "Romance",
    rating: 5,
    price: 15.99,
    cover: "https://covers.openlibrary.org/b/isbn/9781250316776-L.jpg",
    description: "What happens when the First Son of the United States falls in love with the Prince of Wales? A heartwarming royal romance exploring public life, secret relationships, and identity.",
    isTrending: false,
    isHotPick: false,
    publishedYear: 2019,
    stock: 7,
    reviews: []
  },
  {
    id: "spanish-love-deception",
    title: "The Spanish Love Deception",
    author: "Elena Armas",
    category: "Romance",
    rating: 4,
    price: 16.00,
    cover: "https://covers.openlibrary.org/b/isbn/9781668002179-L.jpg",
    description: "A young woman needs a date for her sister's wedding in Spain, and her insufferable colleague offers to step in. A slow-burn office romance full of banter and fake dating.",
    isTrending: true,
    isHotPick: false,
    publishedYear: 2021,
    stock: 9,
    reviews: []
  },
  {
    id: "ugly-love",
    title: "Ugly Love",
    author: "Colleen Hoover",
    category: "Romance",
    rating: 4,
    price: 14.99,
    cover: "https://covers.openlibrary.org/b/isbn/9781476753188-L.jpg",
    description: "When Tate meets airline pilot Miles, they agree to a strict no-strings-attached arrangement. An emotional, heavy romance exploring grief, past trauma, and healing.",
    isTrending: false,
    isHotPick: false,
    publishedYear: 2014,
    stock: 4,
    reviews: []
  },
  {
    id: "november-9",
    title: "November 9",
    author: "Colleen Hoover",
    category: "Romance",
    rating: 5,
    price: 15.00,
    cover: "https://covers.openlibrary.org/b/isbn/9781501110344-L.jpg",
    description: "A young writer and his muse meet on the same day every year, leading to a decade of romance, heartbreak, and a shocking revelation that threatens their connection.",
    isTrending: true,
    isHotPick: false,
    publishedYear: 2015,
    stock: 6,
    reviews: []
  },
  {
    id: "the-housemaid",
    title: "The Housemaid",
    author: "Freida McFadden",
    category: "Thriller",
    rating: 5,
    price: 14.99,
    cover: "https://covers.openlibrary.org/b/id/15105883-L.jpg",
    description: "Every day I clean the Winchesters' beautiful house. I wash their laundry, cook for them, and look after their daughter. But Millie, the wife, makes my life a living nightmare. And then I discover the dark secrets lurking in their home.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2022,
    stock: 0, // OUT OF STOCK
    reviews: [
      { reviewer: "ThrillerLover", rating: 5, comment: "Omg, the twist is absolutely insane! Must read!", tier: "Silver Member", isVerified: true }
    ]
  },
  {
    id: "housemaids-secret",
    title: "The Housemaid's Secret",
    author: "Freida McFadden",
    category: "Thriller",
    rating: 5,
    price: 15.50,
    cover: "https://covers.openlibrary.org/b/id/15125117-L.jpg",
    description: "As a housemaid with a dark past, I take a new job cleaning a luxurious penthouse. But I am warned never to open the guest room door. What is hidden inside? An intense psychological thriller about secrets and survival.",
    isTrending: true,
    isHotPick: false,
    publishedYear: 2023,
    stock: 5,
    reviews: []
  },
  {
    id: "none-of-this-is-true",
    title: "None of This Is True",
    author: "Lisa Jewell",
    category: "Thriller",
    rating: 5,
    price: 16.99,
    cover: "https://covers.openlibrary.org/b/id/13300169-L.jpg",
    description: "While celebrating her birthday, popular podcaster Alix meets a strange woman who claims to share the same birthday. Soon, this woman becomes the subject of Alix's new podcast, leading to a dark, unsettling obsession.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2023,
    stock: 4,
    reviews: []
  },
  {
    id: "family-upstairs",
    title: "The Family Upstairs",
    author: "Lisa Jewell",
    category: "Thriller",
    rating: 4,
    price: 15.99,
    cover: "https://covers.openlibrary.org/b/isbn/9781501190100-L.jpg",
    description: "Twenty-five years after a horrific tragedy, a young woman inherits a multimillion-dollar mansion in London. But as she uncovers her family's dark history, she realizes she is not the only one who has been waiting for this day.",
    isTrending: false,
    isHotPick: false,
    publishedYear: 2019,
    stock: 8,
    reviews: []
  },
  {
    id: "paris-apartment",
    title: "The Paris Apartment",
    author: "Lucy Foley",
    category: "Thriller",
    rating: 4,
    price: 16.50,
    cover: "https://covers.openlibrary.org/b/isbn/9780063003057-L.jpg",
    description: "Jess needs a fresh start and moves in with her half-brother Ben in his luxury Paris apartment. But when she arrives, Ben is missing. Jess begins to investigate, realizing that every resident in the building has something to hide.",
    isTrending: true,
    isHotPick: false,
    publishedYear: 2022,
    stock: 3,
    reviews: []
  },
  {
    id: "hunting-party",
    title: "The Hunting Party",
    author: "Lucy Foley",
    category: "Thriller",
    rating: 4,
    price: 15.00,
    cover: "https://covers.openlibrary.org/b/isbn/9780062868909-L.jpg",
    description: "A group of thirty-something college friends spend New Year's Eve at a remote estate in the Scottish Highlands. When a blizzard traps them, old resentments flare, and a body is found in the snow.",
    isTrending: false,
    isHotPick: false,
    publishedYear: 2018,
    stock: 6,
    reviews: []
  },
  {
    id: "the-teacher",
    title: "The Teacher",
    author: "Freida McFadden",
    category: "Thriller",
    rating: 5,
    price: 16.99,
    cover: "https://covers.openlibrary.org/b/id/15211764-L.jpg",
    description: "A math teacher at a local high school finds himself caught in a web of rumors, lies, and a forbidden obsession when a student goes missing. A fast-paced, twisty psychological thriller.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2024,
    stock: 7,
    reviews: []
  },
  {
    id: "the-inmate",
    title: "The Inmate",
    author: "Freida McFadden",
    category: "Thriller",
    rating: 4,
    price: 15.99,
    cover: "https://covers.openlibrary.org/b/id/15125020-L.jpg",
    description: "A nurse takes a job at a high-security prison, only to find herself working in the same facility as the inmate she helped put away years ago—a man who claims he is innocent and seeks revenge.",
    isTrending: false,
    isHotPick: false,
    publishedYear: 2022,
    stock: 9,
    reviews: []
  },
  {
    id: "good-girls-guide",
    title: "A Good Girl's Guide to Murder",
    author: "Holly Jackson",
    category: "Thriller",
    rating: 5,
    price: 13.99,
    cover: "https://covers.openlibrary.org/b/isbn/9781524764722-L.jpg",
    description: "The case is closed. Five years ago, schoolgirl Andie Bell was murdered by her boyfriend, Sal Singh. Everyone in town knows he did it. But growing up in the same small town, Pippa Fitz-Amobi isn't so sure. When she chooses the case as the topic for her final project, she starts to uncover secrets that someone in town desperately wants to stay hidden.",
    isTrending: true,
    isHotPick: false,
    publishedYear: 2019,
    stock: 6,
    reviews: []
  },
  {
    id: "fourth-wing",
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    category: "Romance",
    rating: 5,
    price: 20.00,
    cover: "https://covers.openlibrary.org/b/isbn/9781649374042-L.jpg",
    description: "Enter the brutal world of a military college for dragon riders, where the only rule is: graduate or die. Twenty-year-old Violet was supposed to live a quiet life among books. Now, the commanding general—also her mother—has ordered Violet to join the hundreds of candidates striving to become dragon riders.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2023,
    stock: 7,
    reviews: []
  },
  
  // PRE-ORDER TITLES (NOT IN BROWSE CATALOG, ONLY IN PRE-ORDERS TAB)
  {
    id: "the-daisy-chain",
    title: "The Daisy Chain",
    author: "Laurie Gilmore",
    category: "New Arrivals",
    rating: 5,
    price: 14.99,
    cover: "assets/the_daisy_chain.png",
    description: "A cozy romance centered around a charming small-town flower shop. Fall in love with the quirky characters and heartwarming relationships in this new arrival.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2026,
    reviews: [
      { reviewer: "Sophia R.", rating: 5, comment: "The ultimate cozy read. Felt like a warm hug!" },
      { reviewer: "Ben S.", rating: 4, comment: "Lovely town setting and very charming characters." }
    ]
  },
  {
    id: "the-reappearance-of-rachel-price",
    title: "The Reappearance of Rachel Price",
    author: "Holly Jackson",
    category: "New Arrivals",
    rating: 5,
    price: 19.99,
    cover: "https://covers.openlibrary.org/b/id/14605870-L.jpg",
    description: "Rachel Price vanished sixteen years ago. Her young daughter, Bel, was the only witness, but she has no memory of what happened. Bel has lived her whole life in the shadow of Rachel's disappearance, and now a true-crime documentary is being filmed about the case. But when Rachel suddenly reappears, with a shocking story of how she survived, Bel's world is turned upside down. As she watches her mother, she begins to suspect that Rachel is lying. If Rachel is lying, then where has she been all this time? And who is she really?",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2026,
    reviews: [
      { reviewer: "Hannah V.", rating: 5, comment: "A thrilling mystery from start to finish. Holly Jackson is a genius!" },
      { reviewer: "Lucas N.", rating: 4, comment: "Full of twists and turns. Keeps you guessing till the final page." }
    ]
  },
  {
    id: "iron-flame",
    title: "Iron Flame",
    author: "Rebecca Yarros",
    category: "New Arrivals",
    rating: 5,
    price: 21.00,
    cover: "https://covers.openlibrary.org/b/isbn/9781649374172-L.jpg",
    description: "She survived her first year at Basgiath War College—but the real test begins now. Violet Sorrengail has always been expected to die during her first year, but the Threshing was only the first impossible test meant to weed out the weak-willed. Now, the real training begins as Violet is forced to push her body and mind beyond their limits. A new Vice Commandant has made it his personal mission to break Violet, unless she betrays the man she loves. Even as her body is weaker than everyone else's, Violet has her wits—and iron determination.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2026,
    reviews: [
      { reviewer: "Arthur K.", rating: 5, comment: "Even better than Fourth Wing! The dragon action is epic." },
      { reviewer: "Sienna J.", rating: 5, comment: "Stunning fantasy world-building. A perfect sequel." }
    ]
  },
  {
    id: "house-of-flame-and-shadow",
    title: "House of Flame and Shadow",
    author: "Sarah J. Maas",
    category: "New Arrivals",
    rating: 5,
    price: 22.00,
    cover: "https://covers.openlibrary.org/b/isbn/9781635574104-L.jpg",
    description: "The stunning third installment in the Crescent City series. Bryce Quinlan is stranded in a strange new world, desperate to find her way back to Midgard. Hunt Athalar is trapped in the Asteri's dungeons, his freedom stripped away once more. In this sweeping fantasy saga, Bryce must use her wits and magic to navigate a court filled with fae, monsters, and gods, while Hunt seeks to escape and spark a rebellion. Together, they must unite their forces to save their world from total destruction.",
    isTrending: false,
    isHotPick: true,
    publishedYear: 2026,
    reviews: [
      { reviewer: "Morgan D.", rating: 5, comment: "Mind-blowing crossover elements. Sarah J. Maas does it again!" },
      { reviewer: "Kate R.", rating: 4, comment: "An epic conclusion to the trilogy, packed with emotional stakes." }
    ]
  }
];

// Helper to get all categories in browse (excluding New Arrivals which is pre-order only)
const CATEGORIES = ["All Books", "Romance", "Thriller"];

// Export data to global scope so it's easily accessible in other scripts
window.BookStore = {
  INITIAL_BOOKS,
  CATEGORIES
};
