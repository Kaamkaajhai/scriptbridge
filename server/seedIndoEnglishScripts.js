import "dotenv/config";
import connectDB from "./config/db.js";
import Script from "./models/Script.js";
import User from "./models/User.js";

const WRITERS = [
  {
    name: "Yash Chichad",
    email: "yashchichad04@gmail.com",
    role: "writer",
    bio: "Indo-English storyteller focused on cinematic hooks, grounded emotions, and commercially viable genre scripts.",
    skills: ["drama", "thriller", "commercial"],
  },
  {
    name: "Writer Buddy",
    email: "writer.buddy@gmail.com",
    role: "writer",
    bio: "Collaborative writer profile for multi-genre Indo-English stories with strong visual treatment and pitch-ready packaging.",
    skills: ["genre", "pitching", "screenplay"],
  },
];

const PROJECT_BLUEPRINTS = [
  {
    title: "Monsoon Protocol",
    genre: "Thriller",
    contentType: "movie",
    format: "feature_film",
    primaryGenre: "Thriller",
    subGenres: ["Political", "Action"],
    budget: "medium",
    price: 1499,
    pageCount: 46,
    logline: "A data analyst in Mumbai discovers election sabotage and has one stormy weekend to leak the truth.",
    description: "A high-tension Mumbai thriller with political stakes, emotional conflict, and a race against time.",
    tones: ["tense", "urgent", "gritty"],
    themes: ["truth", "power", "public trust"],
    settings: ["Mumbai", "media rooms", "rainy nights"],
    tags: ["mumbai", "political", "thriller", "hacker", "monsoon"],
  },
  {
    title: "Gully Startup",
    genre: "Drama",
    contentType: "web_series",
    format: "web_series",
    primaryGenre: "Drama",
    subGenres: ["Coming-of-age", "Business"],
    budget: "low",
    price: 950,
    pageCount: 38,
    logline: "Three lane friends turn a neighborhood tiffin idea into a startup while family pressure keeps rising.",
    description: "Heartfelt and aspirational drama blending hustle culture with old-school mohalla values.",
    tones: ["hopeful", "warm", "real"],
    themes: ["friendship", "ambition", "family duty"],
    settings: ["small lanes", "local trains", "co-working spaces"],
    tags: ["startup", "friends", "indie", "food-tech", "youth"],
  },
  {
    title: "Raaz in Ring Road",
    genre: "Mystery",
    contentType: "tv_series",
    format: "tv_1hour",
    primaryGenre: "Mystery",
    subGenres: ["Crime", "Noir"],
    budget: "medium",
    price: 1300,
    pageCount: 44,
    logline: "A suspended cop and a podcast host decode a pattern of staged accidents around Delhi ring roads.",
    description: "A noir mystery with layered clues, urban paranoia, and socially grounded crime arcs.",
    tones: ["dark", "smart", "brooding"],
    themes: ["justice", "memory", "urban fear"],
    settings: ["Delhi", "highways", "newsrooms"],
    tags: ["mystery", "delhi", "crime", "podcast", "noir"],
  },
  {
    title: "Campus Kaand 3 AM",
    genre: "Horror",
    contentType: "movie",
    format: "feature",
    primaryGenre: "Horror",
    subGenres: ["Supernatural", "Psychological"],
    budget: "low",
    price: 899,
    pageCount: 35,
    logline: "After a hostel challenge at 3 AM, five students start seeing versions of themselves from future regrets.",
    description: "A youth horror built around guilt, superstition, and unsettling campus lore.",
    tones: ["creepy", "uneasy", "intense"],
    themes: ["guilt", "fear", "consequence"],
    settings: ["campus", "hostels", "abandoned labs"],
    tags: ["campus", "horror", "hostel", "3am", "psych"],
  },
  {
    title: "Ishq on Installments",
    genre: "Romance",
    contentType: "movie",
    format: "movie",
    primaryGenre: "Romance",
    subGenres: ["Comedy", "Family"],
    budget: "low",
    price: 780,
    pageCount: 32,
    logline: "A wedding planner and debt collector fake an engagement to close loans and accidentally build real love.",
    description: "A breezy urban romance-comedy with family pressure, finance jokes, and emotional sincerity.",
    tones: ["light", "fun", "heartfelt"],
    themes: ["trust", "family", "second chances"],
    settings: ["Jaipur", "wedding venues", "old markets"],
    tags: ["romcom", "jaipur", "wedding", "family", "finance"],
  },
  {
    title: "Code Swades",
    genre: "Sci-Fi",
    contentType: "movie",
    format: "feature_film",
    primaryGenre: "Sci-Fi",
    subGenres: ["Drama", "Tech"],
    budget: "high",
    price: 2000,
    pageCount: 50,
    logline: "An NRI engineer returns to India and builds a civic AI that starts predicting crimes before they happen.",
    description: "High concept sci-fi with social relevance, ethical dilemmas, and large canvas visuals.",
    tones: ["thoughtful", "epic", "emotional"],
    themes: ["ethics", "belonging", "technology"],
    settings: ["Bengaluru", "smart city hubs", "public squares"],
    tags: ["ai", "nri", "sci-fi", "india", "future"],
  },
  {
    title: "Dabba Detectives",
    genre: "Comedy",
    contentType: "tv_series",
    format: "tv_halfhour",
    primaryGenre: "Comedy",
    subGenres: ["Detective", "Family"],
    budget: "micro",
    price: 550,
    pageCount: 31,
    logline: "Two lunch delivery riders solve neighborhood crimes using tiffin patterns and street gossip.",
    description: "A fun detective-comedy with hyperlocal flavor and strong recurring side characters.",
    tones: ["quirky", "playful", "street-smart"],
    themes: ["community", "wit", "everyday heroes"],
    settings: ["Pune", "local lanes", "canteens"],
    tags: ["comedy", "detective", "tiffin", "pune", "family"],
  },
  {
    title: "Partition 2.0",
    genre: "Historical",
    contentType: "documentary",
    format: "documentary",
    primaryGenre: "Historical",
    subGenres: ["Docudrama", "Political"],
    budget: "medium",
    price: 1700,
    pageCount: 42,
    logline: "A journalist uncovers a forgotten 1947 audio archive that mirrors present-day border propaganda.",
    description: "A hybrid docu-thriller framing history through modern media manipulation.",
    tones: ["serious", "investigative", "urgent"],
    themes: ["history", "identity", "media influence"],
    settings: ["archives", "border towns", "news studios"],
    tags: ["history", "partition", "documentary", "archive", "journalism"],
  },
  {
    title: "Raat Ki Metro",
    genre: "Action",
    contentType: "movie",
    format: "feature_film",
    primaryGenre: "Action",
    subGenres: ["Thriller", "Survival"],
    budget: "high",
    price: 1850,
    pageCount: 48,
    logline: "When a metro line is hijacked after midnight, a rookie guard becomes the only line between chaos and dawn.",
    description: "Contained high-energy action thriller with emotional backstory and night-time urban visuals.",
    tones: ["fast", "adrenaline", "gritty"],
    themes: ["courage", "sacrifice", "public safety"],
    settings: ["metro stations", "underground tunnels", "control rooms"],
    tags: ["action", "metro", "hijack", "night", "survival"],
  },
  {
    title: "NaniVerse",
    genre: "Fantasy",
    contentType: "anime",
    format: "anime",
    primaryGenre: "Fantasy",
    subGenres: ["Adventure", "Family"],
    budget: "medium",
    price: 1200,
    pageCount: 37,
    logline: "A teenager enters his grandmother's bedtime universe to recover lost memories before she forgets him forever.",
    description: "A colorful emotional fantasy with Indian folklore beats and family-driven stakes.",
    tones: ["magical", "nostalgic", "adventurous"],
    themes: ["memory", "love", "legacy"],
    settings: ["mythic kingdoms", "old homes", "dream bridges"],
    tags: ["fantasy", "anime", "family", "folklore", "memory"],
  },
  {
    title: "Sarkari Matchmaking",
    genre: "Satire",
    contentType: "web_series",
    format: "limited_series",
    primaryGenre: "Satire",
    subGenres: ["Comedy", "Political"],
    budget: "low",
    price: 600,
    pageCount: 34,
    logline: "A government pilot app tries to match citizens by values and accidentally pairs activists with ministers.",
    description: "Sharp political satire with absurd humor and layered social commentary.",
    tones: ["satirical", "witty", "chaotic"],
    themes: ["bureaucracy", "freedom", "social engineering"],
    settings: ["state offices", "tv debates", "public hearings"],
    tags: ["satire", "politics", "comedy", "app", "society"],
  },
  {
    title: "The Last Tabla",
    genre: "Musical",
    contentType: "movie",
    format: "feature_film",
    primaryGenre: "Musical",
    subGenres: ["Drama", "Sports"],
    budget: "medium",
    price: 1100,
    pageCount: 40,
    logline: "A failing percussion school enters an underground beat-battle league to save their institute from demolition.",
    description: "A rhythmic underdog drama with music battles, mentor arcs, and youth emotion.",
    tones: ["energetic", "uplifting", "emotional"],
    themes: ["art", "legacy", "team spirit"],
    settings: ["old music schools", "city stages", "street festivals"],
    tags: ["music", "underdog", "drama", "battle", "youth"],
  },
];

const STORY_LOCATIONS = [
  "Rain-soaked flyover",
  "By-lane tea stall",
  "Crowded local train",
  "Newsroom bullpen",
  "Rooftop under sodium lights",
  "Half-shuttered market",
  "Municipal archive basement",
  "Apartment staircase",
  "Metro platform edge",
  "Police canteen",
  "College corridor",
  "Old single-screen cinema",
  "Co-working cafe",
  "Temple ghat at dawn",
  "Control room",
  "Warehouse near docks",
  "Night bus depot",
  "Cricket ground boundary",
  "Recording studio",
  "Government office floor",
];

const CONFLICT_BEATS = [
  "A leaked file points to an insider in the team.",
  "A trusted ally goes missing without warning.",
  "One call recording changes the meaning of every previous scene.",
  "A family secret collides with the mission timeline.",
  "The team realizes they are being tracked through public CCTV trails.",
  "A public speech creates backlash that explodes overnight.",
  "The protagonist must choose between legal safety and moral truth.",
  "A rival group offers help, but only at a dangerous cost.",
  "A critical witness refuses to talk unless old wounds are addressed.",
  "An unexpected betrayal turns a safe location into a trap.",
];

const DIALOGUE_LINES = [
  "Yeh sirf case nahi hai, yeh hamari zimmedari hai.",
  "If we stay silent tonight, kal subah sab kuch badal jayega.",
  "Plan simple hai: no panic, no ego, only execution.",
  "Tum sach bol do, baaki main handle kar lunga.",
  "Public ko story nahi, proof chahiye.",
  "Mujhe hero nahi banna, bas system ko mirror dikhana hai.",
  "Hum darrenge toh woh jeetenge.",
  "This city never sleeps, but it remembers everything.",
  "Main fail ho sakta hoon, par bikunga nahi.",
  "Aaj raat risk high hai, par return usse bhi high.",
];

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const htmlWordCount = (html) =>
  String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

const makeCoverImage = (title) => `https://picsum.photos/seed/${slugify(title)}-cover/900/1200`;

const makeInlineImage = (title, sceneIndex) =>
  `https://picsum.photos/seed/${slugify(title)}-scene-${sceneIndex}/1280/720`;

const generateSynopsis = (project) => {
  const sections = [
    `${project.title} starts in ${project.settings[0]} where an ordinary decision triggers an extraordinary chain reaction. The lead thinks this is one more routine day, but the city has already moved three steps ahead. Streets, screens, and whispers all begin to align toward one hidden agenda. The first act plants emotional stakes through family tension, old responsibilities, and a public system that looks stable but is cracking from inside.`,
    `As the middle stretch opens, alliances shift every few hours. Jo dost lagte the, unke motives bhi test hote hain. The hero and team chase proof through offices, local neighborhoods, archives, and midnight meetings where every sentence can become evidence later. Personal relationships deepen the pressure. Parents demand safety, partners demand honesty, and colleagues demand speed. This makes each move feel expensive. One wrong step can destroy both mission and personal life.`,
    `The second phase escalates with layered reveals. A confidential record, a digital trail, and one eyewitness account expose the real architecture of the conflict. Instead of a single villain, the script reveals a network that survives because good people compromise in small moments. The protagonist faces legal threats, public smear campaigns, and emotional manipulation. Still, the team keeps moving because the cost of silence is now larger than the cost of failure.`,
    `Final act resolves through a high-pressure sequence built around ${project.settings[1]}. The hero chooses accountability over comfort. Public truth arrives not as a clean victory but as a hard-earned shift where institutions are forced to respond. Relationships are repaired selectively, some bridges burn, and a few scars remain by design. The ending keeps commercial momentum while leaving meaningful aftertaste: system badalna mushkil hai, lekin impossible nahi.`,
    `Overall, this is an Indo-English narrative with cinematic visuals, emotional relatability, and strong pitchability for premium buyers. The script balances genre thrills with grounded social detail, making it suitable for mainstream platforms and global diaspora audiences alike. It is designed for readers who want both entertainment value and cultural texture in one package.`,
  ];

  return sections.join("\n\n");
};

const generateMainContent = (project) => {
  const targetWords = Math.max(30, Math.min(50, Number(project.pageCount || 36))) * 250;
  const protagonist = project.title.split(" ")[0].toUpperCase();
  let sceneIndex = 1;

  const chunks = [
    `<h1>${project.title}</h1>`,
    `<p><strong>Genre:</strong> ${project.genre} | <strong>Format:</strong> ${project.format} | <strong>Primary:</strong> ${project.primaryGenre}</p>`,
    `<p><u>ACT I - SETUP</u></p>`,
    `<figure><img src="${makeInlineImage(project.title, 0)}" alt="Opening cover visual" /></figure>`,
    `<p><mark>Opening Beat:</mark> City rhythm builds while key characters enter from opposite corners of the same crisis.</p>`,
  ];

  while (htmlWordCount(chunks.join("\n")) < targetWords) {
    const location = STORY_LOCATIONS[sceneIndex % STORY_LOCATIONS.length];
    const conflict = CONFLICT_BEATS[sceneIndex % CONFLICT_BEATS.length];
    const lineA = DIALOGUE_LINES[sceneIndex % DIALOGUE_LINES.length];
    const lineB = DIALOGUE_LINES[(sceneIndex + 4) % DIALOGUE_LINES.length];

    chunks.push(`<h3>SCENE ${String(sceneIndex).padStart(2, "0")} - ${location}</h3>`);
    chunks.push(
      `<p>${protagonist} enters ${location.toLowerCase()} with a clear objective but unclear trust map. ${conflict} The atmosphere carries equal parts urgency and fatigue, because everyone in this world has already fought smaller battles before this larger one. The sequence is written in Indo-English texture so dialogue feels lived-in, local, and sharply cinematic.</p>`
    );
    chunks.push(
      `<p><strong>${protagonist}:</strong> ${lineA} <strong>ALLY:</strong> ${lineB} The team quickly re-prioritizes. Someone handles digital trails, someone negotiates access, and someone protects the emotional center of the group. This rhythm keeps pace high while character arcs stay visible scene by scene.</p>`
    );
    chunks.push(
      `<p><span style="color:#1d4ed8">Visual Note:</span> rain reflections, traffic echoes, and handheld movement to create realism. The beat ends with a forward hook that pushes into next scene without dropping tension.</p>`
    );

    if (sceneIndex % 6 === 0) {
      chunks.push(`<figure><img src="${makeInlineImage(project.title, sceneIndex)}" alt="Scene visual ${sceneIndex}" /></figure>`);
    }

    if (sceneIndex === 10) {
      chunks.push(`<p><u>ACT II - CONFRONTATION</u></p>`);
    }

    if (sceneIndex === 22) {
      chunks.push(`<p><u>ACT III - RESOLUTION</u></p>`);
      chunks.push(`<p><mark>Climax Build:</mark> Choices now have irreversible public impact.</p>`);
    }

    sceneIndex += 1;

    if (sceneIndex > 70) {
      break;
    }
  }

  chunks.push(`<h3>ENDING IMAGE</h3>`);
  chunks.push(
    `<p>Morning breaks over ${project.settings[2]}. Damage is real, but so is progress. The final frame lands on resilient hope: system ko challenge karna risky hai, par silence aur bhi risky hai.</p>`
  );

  return chunks.join("\n");
};

const buildClassification = (project) => ({
  primaryGenre: project.primaryGenre,
  secondaryGenre: project.subGenres[0] || project.genre,
  tones: project.tones.slice(0, 3),
  themes: project.themes.slice(0, 3),
  settings: project.settings.slice(0, 3),
});

const ensureWriter = async (writer) => {
  const existing = await User.findOne({ email: writer.email });
  if (existing) {
    return existing;
  }

  const user = await User.create({
    name: writer.name,
    email: writer.email,
    password: "Demo1234!",
    role: writer.role,
    bio: writer.bio,
    skills: writer.skills,
    isVerified: true,
    emailVerified: true,
  });

  return user;
};

async function seedIndoEnglishScripts() {
  await connectDB();

  console.log("Starting Indo-English premium script seed...");

  const writerDocs = [];
  for (const writer of WRITERS) {
    const user = await ensureWriter(writer);
    writerDocs.push(user);
    console.log(`Writer ready: ${user.email}`);
  }

  let created = 0;
  let updated = 0;

  for (let i = 0; i < PROJECT_BLUEPRINTS.length; i += 1) {
    const blueprint = PROJECT_BLUEPRINTS[i];
    const creator = writerDocs[i % writerDocs.length];

    const synopsis = generateSynopsis(blueprint);
    const textContent = generateMainContent(blueprint);
    const finalWordCount = htmlWordCount(textContent);
    const estimatedPages = Math.max(30, Math.min(50, Math.ceil(finalWordCount / 250)));

    const payload = {
      creator: creator._id,
      title: blueprint.title,
      genre: blueprint.genre,
      logline: blueprint.logline,
      description: blueprint.description,
      synopsis,
      textContent,
      pageCount: estimatedPages,
      coverImage: makeCoverImage(blueprint.title),
      trailerThumbnail: makeCoverImage(`${blueprint.title}-trailer`),
      contentType: blueprint.contentType,
      format: blueprint.format,
      primaryGenre: blueprint.primaryGenre,
      subGenres: blueprint.subGenres,
      budget: blueprint.budget,
      premium: true,
      price: Math.max(500, Math.min(2000, Number(blueprint.price || 1000))),
      tags: blueprint.tags,
      classification: buildClassification(blueprint),
      services: {
        hosting: true,
        evaluation: true,
        aiTrailer: true,
        spotlight: true,
      },
      legal: {
        agreedToTerms: true,
        timestamp: new Date(),
        termsVersion: "seed-v1",
      },
      status: "published",
      adminApproved: true,
      publishedAt: new Date(),
      isFeatured: true,
      rating: 4.2 + (i % 6) * 0.1,
      reviewCount: 18 + i * 3,
      readsCount: 250 + i * 47,
      views: 1000 + i * 150,
    };

    const existing = await Script.findOne({ title: blueprint.title, creator: creator._id });
    if (existing) {
      Object.assign(existing, payload);
      await existing.save();
      updated += 1;
      console.log(`Updated: ${blueprint.title} | ${creator.email} | ${estimatedPages} pages`);
      continue;
    }

    await Script.create(payload);
    created += 1;
    console.log(`Created: ${blueprint.title} | ${creator.email} | ${estimatedPages} pages`);
  }

  console.log(`Done. Created ${created}, updated ${updated}, total templates ${PROJECT_BLUEPRINTS.length}.`);
  process.exit(0);
}

seedIndoEnglishScripts().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
