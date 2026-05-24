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
    reviews: [
      { reviewer: "Sarah K.", rating: 5, comment: "Absolutely loved the pace and chemistry! Elsie Silver never misses." },
      { reviewer: "Michael D.", rating: 5, comment: "A solid romance with fantastic character depth." }
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
    reviews: [
      { reviewer: "Liam J.", rating: 5, comment: "I couldn't put this down! The plot twist at the end blew my mind." },
      { reviewer: "Emma W.", rating: 4, comment: "Freida McFadden is the queen of quick thrillers. Very fast-paced." }
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
    reviews: [
      { reviewer: "Clara M.", rating: 5, comment: "Brings back all the nostalgia of summer love. Beautifully written." },
      { reviewer: "Dan H.", rating: 5, comment: "The setting felt so alive. A wonderful second-chance romance." }
    ]
  },
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
    reviews: [
      { reviewer: "Jason K.", rating: 5, comment: "One of the best psychological thrillers I have ever read in my life." },
      { reviewer: "Grace T.", rating: 4, comment: "Mind-bending twist. The pacing was absolutely perfect." }
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
    reviews: [
      { reviewer: "Elena B.", rating: 5, comment: "Disturbing, twisted, and completely addictive. I read it in one sitting!" },
      { reviewer: "Tom F.", rating: 5, comment: "Colleen Hoover shows a completely different side here. Brilliant thriller." }
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
    reviews: [
      { reviewer: "Olivia M.", rating: 4, comment: "A powerful and emotional story. It handles difficult topics with care." },
      { reviewer: "Chris G.", rating: 4, comment: "Very emotional. Highly recommend for any romance fan." }
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
    reviews: [
      { reviewer: "Lily P.", rating: 5, comment: "Emily Henry did it again! The banter is unmatched." },
      { reviewer: "Zoe C.", rating: 5, comment: "Funny, emotional, and so romantic. A true masterpiece." }
    ]
  },
  {
    id: "the-reappearance-of-rachel-price",
    title: "The Reappearance of Rachel Price",
    author: "Holly Jackson",
    category: "New Arrivals",
    rating: 5,
    price: 19.99,
    cover: "https://covers.openlibrary.org/b/isbn/9780593374238-L.jpg",
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
    reviews: [
      { reviewer: "Philip W.", rating: 4, comment: "Molly is such a unique and lovable protagonist. Very entertaining mystery." },
      { reviewer: "Nancy L.", rating: 4, comment: "Charming, cozy, and keeps you guessing. A great weekend read." }
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
    reviews: [
      { reviewer: "FeyreFan", rating: 5, comment: "The romance, the magic, the world! I was absolutely hooked." },
      { reviewer: "Reader99", rating: 4, comment: "A solid fantasy romance that builds up beautifully." }
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
    reviews: [
      { reviewer: "MysteryBuff", rating: 4, comment: "Loved the shifting perspectives. Keeps you guessing who the victim is!" },
      { reviewer: "GroomedToKill", rating: 4, comment: "Very atmospheric setting and solid thriller elements." }
    ]
  },
  {
    id: "seven-husbands-evelyn-hugo",
    title: "The Seven Husbands of Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    category: "Romance",
    rating: 5,
    price: 17.00,
    cover: "https://covers.openlibrary.org/b/isbn/9781501161933-L.jpg",
    description: "Aging and reclusive Hollywood movie icon Evelyn Hugo is finally ready to tell the truth about her glamorous and scandalous life. But when she chooses unknown magazine reporter Monique Monique for the job, no one in the journalism community is more astounded than Monique herself. Summoned to Evelyn's luxurious apartment, Monique listens as the actress spins a tale of ruthless ambition, unexpected friendship, and a great forbidden love. As Evelyn's story nears its conclusion, it becomes clear that her life intersects with Monique's own in tragic and irreversible ways.",
    isTrending: true,
    isHotPick: true,
    publishedYear: 2017,
    reviews: [
      { reviewer: "OldHollywood", rating: 5, comment: "One of the most mesmerizing characters ever written. Simply glorious." },
      { reviewer: "HeartBroken", rating: 5, comment: "I cried so much! Evelyn Hugo will live in my heart forever." }
    ]
  },
  {
    id: "couple-next-door",
    title: "The Couple Next Door",
    author: "Shari Lapena",
    category: "Thriller",
    rating: 4,
    price: 14.99,
    cover: "https://covers.openlibrary.org/b/isbn/9780735221109-L.jpg",
    description: "Anne and Marco Conti seem to have it all: a loving relationship, a wonderful home, and their beautiful baby daughter, Cora. But one night, when they are at a dinner party next door, a terrible crime is committed. The suspicion immediately falls on the parents. But the truth is a much more complicated story. In the investigations that follow, secrets start to unravel as the couple is forced to face what really happened, revealing a web of deception, duplicity, and betrayal that lurks right next door.",
    isTrending: false,
    isHotPick: false,
    publishedYear: 2016,
    reviews: [
      { reviewer: "SuspenseLover", rating: 4, comment: "Fast-paced domestic thriller that makes you double check your locks." },
      { reviewer: "TwistyTurny", rating: 4, comment: "Suspenseful and engaging. Great quick read." }
    ]
  }
];

// Helper to get all categories
const CATEGORIES = ["All Books", "Romance", "Thriller", "New Arrivals"];

// Export data to global scope so it's easily accessible in other scripts
window.BookStore = {
  INITIAL_BOOKS,
  CATEGORIES
};
