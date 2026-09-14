const fs = require('fs');
const https = require('https');
const path = require('path');

// ── Helpers ───────────────────────────────────────────────────────────────────
function slugify(title) {
  return 'blog-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch (e) { reject(new Error('Invalid JSON response: ' + raw.slice(0, 200))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── Image selection ───────────────────────────────────────────────────────────
// Picks the hero image from the post's title + keyword, not the queue's tag.
// First match wins. Filenames match what is actually in /img (jpg, except g1-closeup.png).
const SUBURBS = ['bangalow','newrybar','ewingsdale','mullumbimby','federal','myocum','alstonville','tintenbar','brooklet','tyagarah','clunes','teven','nashua','eureka','lennox head','ballina'];
const SUBURB_RE = new RegExp('\\b(' + SUBURBS.join('|') + ')\\b');

const IMAGE_ALT = {
  'commercial-solar.jpg':   'Autonomous mower working solar farm vegetation',
  'commercial-solar-2.jpg': 'Aerial view of solar farm rows with grass between panels',
  'commercial-solar-3.jpg': 'Solar panel rows over grass, seen from above',
  'commercial-solar-4.jpg': 'Grass strips between solar arrays on a utility-scale site',
  'commercial-golf-2.jpg':  'Mower on a golf green beside a bunker, drone view',
  'commercial-golf-3.jpg':  'Aerial view of golf course fairways',
  'commercial-school-2.jpg':'School building with playing field in front',
  'commercial-school-3.jpg':'School sports oval from above',
  'commercial-resort-2.jpg':'Palm trees over resort lawn',
  'commercial-airport-1.jpg':'Aircraft landing over grass beside a runway',
  'commercial-airport-2.jpg':'Airport runway and grass verges from the air',
  'commercial-golf.jpg':    'Autonomous mower on golf course grounds',
  'commercial-school.jpg':  'Autonomous mowing on school grounds',
  'commercial-council.jpg': 'Autonomous mowing on council parks and reserves',
  'commercial-park.jpg':    'Autonomous mowing in park and reserve',
  'commercial-resort.jpg':  'Autonomous mowing at resort grounds',
  'commercial-hero.jpg':    'Autonomous mowing for commercial grounds',
  'aerial-prestige.jpg':    'Aerial view of prestige lifestyle property',
  'hinterland-aerial.jpg':  'Northern Rivers hinterland lifestyle property',
  'g1-wide-paddock.jpg':    'Autonomous mower working an open paddock',
  'g1-striping.jpg':        'Mowing stripes cut by an autonomous mower',
  'g1-closeup.png':         'Autonomous mower detail, tracked deck and sensors',
  'hilux-trailer.jpg':      'AutoAcre Hilux and trailer with autonomous mowing equipment',
  'demo-scene.jpg':         'AutoAcre autonomous mowing demonstration',
  'problem.jpg':            'Overgrown property showing acreage mowing challenge',
  'result.jpg':             'Well-maintained acreage after autonomous mowing',
  'residential-hero.jpg':   'Residential acreage lifestyle property',
  'veranda-view.jpg':       'View from lifestyle property veranda',
  'hero.jpg':               'Northern Rivers acreage property',
  'acreage-aerial-1.jpg':   'Aerial view of forested hills and paddocks at sunrise',
  'acreage-aerial-2.jpg':   'Green paddock on a hilltop with farmland beyond',
  'acreage-aerial-3.jpg':   'Rural properties across rolling farmland from the air',
  'acreage-road-1.jpg':     'Country road through acreage properties, drone view',
  'acreage-valley-1.jpg':   'Green valley with scattered rural homes from above',
  'acreage-paddock-aerial-1.jpg': 'Paddock and tree lines from directly above',
  'acreage-valley-sunset-1.jpg': 'Farm valley at sunset with sheds and mountains',
  'paddock-dusk-2.jpg':     'Grass seed heads against an evening sky',
  'rideon-1.jpg':           'Zero-turn mower cutting a large lawn',
  'rideon-2.jpg':           'Ride-on mower working an acreage lawn',
  'lifestyle-driveway-1.jpg': 'Tree-lined driveway to a gated rural property',
};

// Pools: when a rule has several suitable images, one is chosen deterministically from the
// post title so the same post always gets the same image but neighbouring posts differ.
const POOLS = {
  solar:   ['commercial-solar.jpg', 'commercial-solar-2.jpg', 'commercial-solar-3.jpg', 'commercial-solar-4.jpg'],
  golf:    ['commercial-golf.jpg', 'commercial-golf-2.jpg', 'commercial-golf-3.jpg'],
  school:  ['commercial-school.jpg', 'commercial-school-2.jpg', 'commercial-school-3.jpg'],
  council: ['commercial-council.jpg'],
  park:    ['commercial-park.jpg'],
  resort:  ['commercial-resort.jpg', 'commercial-resort-2.jpg'],
  airport: ['commercial-airport-1.jpg', 'commercial-airport-2.jpg'],
  commercial: ['commercial-hero.jpg', 'commercial-school-2.jpg'],
  hinterland: ['hinterland-aerial.jpg', 'acreage-aerial-1.jpg', 'acreage-aerial-2.jpg', 'acreage-aerial-3.jpg', 'acreage-road-1.jpg', 'acreage-valley-1.jpg', 'acreage-paddock-aerial-1.jpg'],
  steep:   ['hinterland-aerial.jpg'],
  paddock: ['g1-wide-paddock.jpg', 'acreage-paddock-aerial-1.jpg', 'acreage-valley-sunset-1.jpg'],
  prestige: ['aerial-prestige.jpg', 'lifestyle-driveway-1.jpg'],
  lifestyle: ['veranda-view.jpg', 'lifestyle-driveway-1.jpg', 'acreage-valley-sunset-1.jpg'],
  rideon:  ['result.jpg', 'rideon-1.jpg', 'rideon-2.jpg'],
  fire:    ['hinterland-aerial.jpg', 'paddock-dusk-2.jpg'],
  cost:    ['hero.jpg', 'acreage-aerial-2.jpg', 'acreage-valley-1.jpg'],
  night:   ['paddock-dusk-2.jpg'],
};
function hashStr(str) { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
// Least-recently-used pick: prefer a pool image no published post has used yet, otherwise the one
// used longest ago. Falls back to a title hash when nothing is published. Keeps neighbours different.
let _recentImages = [];
function setRecentImages(published) { _recentImages = published.map(p => p.img); }
function fromPool(name, topic) {
  const p = POOLS[name];
  const lastIdx = img => _recentImages.lastIndexOf(img);
  const unused = p.filter(img => lastIdx(img) === -1);
  if (unused.length) return unused[hashStr((topic.title || '') + (topic.keyword || '')) % unused.length];
  return p.slice().sort((a, b) => lastIdx(a) - lastIdx(b))[0];
}

function pickImage(topic) {
  const s = ((topic.title || '') + ' ' + (topic.keyword || '')).toLowerCase();
  const has = re => re.test(s);
  const suburb = SUBURB_RE.test(s);
  const location = suburb || has(/\bbyron\b|\bhinterland|northern rivers|\bshire\b/);

  if (has(/solar/)) return fromPool('solar', topic);
  if (has(/\bgolf\b/)) return fromPool('golf', topic);
  if (has(/\bschool/)) return fromPool('school', topic);
  if (has(/\bcouncil/) || has(/parks and reserves/)) return fromPool('council', topic);
  if (has(/\bparks?\b/) || has(/\breserves?\b/)) return fromPool('park', topic);
  if (has(/\bresort/)) return fromPool('resort', topic);
  if (has(/\bairport/)) return fromPool('airport', topic);
  if (has(/\bcommercial\b/)) return fromPool('commercial', topic);
  if (has(/\bdealer/)) return 'hilux-trailer.jpg';
  if (has(/holiday rental/) || has(/\babsentee/) || has(/without living/)) return fromPool('prestige', topic);
  if (has(/\bprestige/) || has(/\bestate\b/)) return fromPool('prestige', topic);
  if (has(/\bsteep/) || has(/\bslopes?\b/)) return fromPool('steep', topic);
  if (has(/\bnight\b|\bovernight\b|\b2am\b|\bdusk\b/)) return fromPool('night', topic);
  if (has(/\bpandag\b/) || has(/\bg1\b/) || has(/\blymow\b/) || has(/\bluba\b/) || has(/\bmammotion\b/) || has(/\bbuy(er|ing)?\b/)) return 'g1-closeup.png';
  if (has(/\bdemo(nstration)?s?\b/)) return 'demo-scene.jpg';
  if (has(/how it works|how .* works|explained|explainer/) || (has(/\bguide\b/) && !location)) return 'demo-scene.jpg';
  if (has(/\binternet|\bconnectivity|\brtk\b|\bsignal\b|\bwifi\b/)) return 'demo-scene.jpg';
  if (has(/acres (a|per) day|\bcapacity\b|hectares (a|per) day/)) return fromPool('paddock', topic);
  if (has(/\btrials?\b/) && has(/\bfail/)) return 'problem.jpg';
  if (has(/\bproblems?\b/) || has(/\bsigns?\b/) || has(/\bissues?\b/)) return 'problem.jpg';
  if (has(/\bresults?\b/) || has(/before and after/)) return 'result.jpg';
  if (has(/\bcost/) || has(/\bprices?\b|\bpricing\b/) || has(/\bspend/) || has(/\bbudget/) || has(/worth it/) || has(/\bsubscription/)) return fromPool('cost', topic);
  if (has(/zero[- ]turn/) || has(/ride[- ]on/) || has(/\bdiy\b/)) return fromPool('rideon', topic);
  if (has(/\bpaddock/) || has(/\bpasture/)) return fromPool('paddock', topic);
  if (suburb) return fromPool('hinterland', topic);
  if (has(/\bveranda/) || has(/\bview\b/) || has(/\blifestyle\b/)) return fromPool('lifestyle', topic);
  if (has(/\bhinterland/) || has(/\bbyron\b/) || suburb) return fromPool('hinterland', topic);
  if (has(/\bfire\b|\bbushfire\b|\bhazard/)) return fromPool('fire', topic);
  if (has(/\bacreage/) || has(/\bfarm/)) return fromPool('paddock', topic);
  return 'hero.jpg';
}

function altFor(img, fallback) {
  return IMAGE_ALT[img] || fallback;
}

// CLI check: node generate-post.js --check-images  → prints what each queued topic would get
if (process.argv.includes('--check-images')) {
  const q = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts-queue.json'), 'utf8'));
  const pubPath = path.join(__dirname, 'published-posts.json');
  const sim = fs.existsSync(pubPath) ? JSON.parse(fs.readFileSync(pubPath, 'utf8')) : [];
  q.topics.forEach((t, i) => {
    if (i < q.nextIndex) { const img = t.img; console.log(`${String(i).padStart(2)}   ${(img||'-').padEnd(22)} published`); return; }
    setRecentImages(sim);
    const img = pickImage(t);
    sim.push({ img });
    const flag = img === t.img ? ' ' : '*';
    console.log(`${String(i).padStart(2)} ${flag} ${img.padEnd(22)} (queue: ${(t.img || '-').padEnd(22)}) ${t.title}`);
  });
  process.exit(0);
}

// ── Content Queue v2 rules ────────────────────────────────────────────────────
// Source of truth: AutoAcre_Content_Queue_v2.md Sections 2.1 to 2.5.
// Change the doc first, then mirror it here. Never soften a rule in one place only.

// Section 2.5 check 4. Names that must never appear in a published post.
const BLOCKED_NAMES = [
  // Manufacturer and machine models. Describe the machine by class and spec instead.
  'PANDAG', 'Pandag', 'G1', 'M1500', 'Taurus80E',
  // Suppliers and supplier parent companies.
  'AllyNav', 'Lianshi', 'Yifei', 'Franklin Xu',
  // Competitor brands and their models.
  'Yarbo', 'Renu Robotics', 'Renubot', 'Swap Robotics', 'Directed Machines',
  'FJD', 'RM21', 'Husqvarna', 'CEORA', 'Echo Robotics', 'TM-2050', 'Raymo',
  // Clients, prospects and their sites. Nothing said in private appears in public.
  'RES Group', 'Emerald Solar', 'Wolff', 'Stockland', 'Misty Mountain',
  'Aura', 'Burdekin', 'Chinchilla', 'Western Downs', 'McLeans Ridges', 'Kunghur',
  'Gracewood',
  // People. Clients, contacts, advisers.
  'Macpherson', 'Reece McDonald', "O'Rorke", 'Niraj', 'Peter Crabb',
  'Camilla', 'Collins Hume',
  // Dead or internal brand names that must not surface publicly.
  'AcreIQ', 'Lark',
];

const SIGN_OFF = '<p><em>AutoAcre is an autonomous mowing operator based in the Northern Rivers, NSW, focused on solar-farm and commercial vegetation management. ben@autoacre.com.au</em></p>';

const SYSTEM_PROMPT = [
  'You write blog posts for AutoAcre, an autonomous mowing service in the Northern Rivers NSW, run by Ben Bonifant. AutoAcre is the service brand. Write as Ben.',
  '',
  'VOICE',
  'Plain, short sentences. Contractions. Honest limits stated before anyone asks. Sentence fragments are fine. No corporate polish, no marketing adjectives, no "premium", no "transform", no "unlock", no "seamless", no "game-changing". Australian spelling. 350 to 600 words total, and 600 is a hard ceiling.',
  '',
  'DRAFTING LAWS (hard)',
  '- Never use an em-dash. Use commas, full stops or brackets.',
  '- Never use an en-dash number range. Write "eight to twelve" in words.',
  '- Label money as AUD. State no dollar figure at all unless ALLOWED NUMBERS below names it.',
  '',
  'HONESTY RULES (hard)',
  '- Planning capacity is about 8 acres (3 hectares) a day. Never 12, never 25. If a manufacturer peak figure comes up, name it as a peak and correct it to the planning figure in the same sentence.',
  '- Mowing slope is 30 degrees proven. Climbing is 42 degrees. Never conflate them and never average them.',
  '- Close-in work is 60 to 70 percent autonomous. The machine does the bulk, people do edges, posts and structures. Never call a whole site fully autonomous.',
  '- The machine has no spark or fire detection. Fire risk is managed operationally: no-go zones on gravel and high-risk margins, charging siting, no charging on total fire ban days.',
  '- Certification is in progress. Never write certified, complies, compliant, or approved for public spaces.',
  '- Wet or waterlogged ground is excluded. It gets mapped out, not driven through.',
  '- There is no live multi-site telemetry this year. Do not describe a dashboard as if it exists.',
  '- Overseas references are the previous generation of the platform. Say "the platform class" or "the previous generation of this platform". Never present them as the current machine.',
  "- Brisbane Airport's 70 percent figure is the airport's own estimate from their own trial. Always attribute it that way, and note the machine class differs (small contained units, not heavy RTK deck mowers).",
  '- Never name a manufacturer, supplier or machine model. Describe machines by class and spec, for example "a 48-inch tracked RTK mower", or just "the machine".',
  '- Never name a client, site, farm, solar operator or developer. Nothing said in private appears in public.',
  '- Never present the service as an existing track record. "Our model is to operate" is allowed. "We operate X sites" is not.',
  '- The machine creates a skilled local technician role. Never say it replaces the crew or removes labour.',
  '- Sheep and grazing are a complement, not a competitor. Never disparage grazing, contractors or any competitor product.',
  '',
  'STRUCTURE (every post, in this order)',
  '1. First line: the meta description alone, wrapped exactly as <!--META: your text here-->. 140 to 155 characters, contains the primary keyword, states the honest answer, no hype.',
  '2. An H2 phrased as the search question matching the target keyword. The paragraph under it answers that question directly in two sentences. This is the featured snippet target.',
  '3. The body: two to four more H2 sections. Primary keyword appears in the first 100 words and once more naturally. Do not stuff it.',
  '4. At least two internal links with descriptive link text, chosen from the INTERNAL LINKS list below. Never "click here".',
  '5. An H2 reading exactly: Common questions. Under it, three to five H3 questions phrased the way people search, each answered in one to three sentences in one following paragraph.',
  '',
  'OUTPUT',
  'Clean HTML using only h2, h3, p, ul, li, strong and a tags. No h1, no divs, no code fences, no backticks, no markdown. Do not write a sign-off or contact line, one is appended automatically.',
].join('\n');

// Offer the model real, existing posts to link to (Section 2.4 internal links).
function linkMenu() {
  const p = path.join(__dirname, 'published-posts.json');
  const published = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
  return published.slice(-14).map(x => '- ' + x.slug + '.html : ' + x.title).join('\n');
}

// Section 2.5 self-check. Returns failure strings; empty array means pass.
function selfCheck(post) {
  const fails = [];
  const html = post.content || '';
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = text.split(/(?<=[.!?])\s+/);

  // 1. em-dash
  const emDashes = (html.match(/—/g) || []).length;
  if (emDashes) fails.push('em-dash present (' + emDashes + ')');

  // 2. capacity and slope figures
  for (const sen of sentences) {
    if (/\b12 acres\b/i.test(sen) && !/\bpeak\b|\bplanning\b/i.test(sen)) {
      fails.push('"12 acres" stated without peak or planning context');
      break;
    }
  }
  if (/\b25 acres\b/i.test(text)) fails.push('"25 acres" present (inflated capacity)');
  if (/\b38\s*(degree|deg|°)/i.test(text)) fails.push('"38 degrees" present (conflated slope figure)');

  // 3. compliance language
  for (const sen of sentences) {
    const m = sen.match(/\b(complies|compliant|certified|approved)\b/i);
    if (m && !new RegExp('not yet[^.]{0,20}' + m[1], 'i').test(sen)) {
      fails.push('compliance claim "' + m[1] + '" without "not yet"');
      break;
    }
  }

  // 4. blocked names
  for (const name of BLOCKED_NAMES) {
    const re = new RegExp('\\b' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
    if (re.test(html)) fails.push('blocked name "' + name + '" present');
  }

  // 5. structure
  if (!post.slug) fails.push('no slug');
  const metaLen = (post.excerpt || '').length;
  if (metaLen < 120 || metaLen > 165) fails.push('meta description ' + metaLen + ' chars (want 140 to 155)');
  if (!/<h2[^>]*>/i.test(html)) fails.push('no H2');
  if (!/<h2[^>]*>\s*Common questions\s*<\/h2>/i.test(html)) fails.push('no FAQ block');
  else if ((html.split(/<h3/i).length - 1) < 3) fails.push('FAQ block has fewer than three questions');
  const internalLinks = (html.match(/href="(?!https?:|mailto:|tel:)[^"]+"/g) || []).length;
  if (internalLinks < 2) fails.push('only ' + internalLinks + ' internal links (want two or more)');
  if (!post.img || !fs.existsSync(path.join(__dirname, 'img', post.img))) fails.push('header image missing: ' + post.img);

  // 6. word count
  const words = text ? text.split(/\s+/).length : 0;
  if (words < 350 || words > 600) fails.push('word count ' + words + ' (want 350 to 600)');

  return fails;
}

// Belt and braces: strip characters the drafting laws forbid before the check
// runs. The check still fails the post if anything got through.
function stripForbidden(html) {
  return html
    .replace(/\s*—\s*/g, ', ')
    .replace(/(\d)\s*–\s*(\d)/g, '$1 to $2')
    .replace(/–/g, '-');
}

// Pull the <!--META: ...--> line out of the generated body.
function extractMeta(html) {
  const m = html.match(/<!--\s*META:\s*([\s\S]*?)-->/i);
  return { meta: m ? m[1].trim() : '', body: html.replace(/<!--\s*META:[\s\S]*?-->/i, '').trim() };
}

// Build FAQPage entities from the "Common questions" block (Gate 3).
function extractFaq(html) {
  const idx = html.search(/<h2[^>]*>\s*Common questions\s*<\/h2>/i);
  if (idx === -1) return [];
  const tail = html.slice(idx);
  const out = [];
  const re = /<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = re.exec(tail)) !== null) {
    const q = m[1].replace(/<[^>]+>/g, '').trim();
    const a = m[2].replace(/<[^>]+>/g, '').trim();
    if (q && a) out.push({ q, a });
  }
  return out;
}

// CLI audit: node generate-post.js --check-posts  runs the Section 2.5 self-check
// over every published post, so a rule change can be tested without calling the API.
if (process.argv.includes('--check-posts')) {
  const published = JSON.parse(fs.readFileSync(path.join(__dirname, 'published-posts.json'), 'utf8'));
  let bad = 0;
  for (const p of published) {
    const file = path.join(__dirname, p.slug + '.html');
    if (!fs.existsSync(file)) { console.log('MISSING FILE ' + p.slug); bad++; continue; }
    const html = fs.readFileSync(file, 'utf8');
    const m = html.match(/<div class="pb">([\s\S]*?)<\/div>/);
    const metaM = html.match(/<meta name="description" content="([^"]*)"/);
    const fails = selfCheck({
      content: m ? m[1] : html,
      slug: p.slug,
      img: p.img,
      excerpt: metaM ? metaM[1] : '',
    });
    const hard = fails.filter(x => !x.startsWith('word count'));
    const soft = fails.filter(x => x.startsWith('word count'));
    if (hard.length || soft.length) {
      if (hard.length) bad++;
      console.log('\n' + p.slug);
      hard.forEach(x => console.log('   - ' + x));
      soft.forEach(x => console.log('   ~ ' + x + '  [advisory for published posts: Section 3 does not require re-cutting]'));
    }
  }
  console.log('\n' + bad + ' of ' + published.length + ' published posts fail the Section 3 retrofit checks.');
  process.exit(0);
}

// ── Generate post content via Anthropic ──────────────────────────────────────
async function generateContent(topic) {
  console.log(`Generating: ${topic.title}`);
  const result = await httpsPost(
    'https://api.anthropic.com/v1/messages',
    {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    {
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          'Write the blog post body for AutoAcre.',
          'H1 (already on the page, do not repeat it): ' + topic.title,
          'Primary keyword: ' + topic.keyword,
          'Slug: ' + (topic.slug || slugify(topic.title)),
          topic.must_say ? 'MUST SAY (your outline, cover every point):\n- ' + [].concat(topic.must_say).join('\n- ') : '',
          topic.never_say ? 'NEVER SAY:\n- ' + [].concat(topic.never_say).join('\n- ') : '',
          'ALLOWED NUMBERS (no other figure may appear anywhere in the post): ' + (topic.allowed_numbers || 'none, write the post with no numeric figures at all'),
          'INTERNAL LINKS available (use at least two, descriptive link text):\n' + linkMenu(),
          'Output the HTML directly. No code fences, no backticks, no markdown.',
        ].filter(Boolean).join('\n\n')
      }]
    }
  );

  if (result.error) throw new Error('Anthropic error: ' + result.error.message);

  let content = (result.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  if (!content) throw new Error('Empty response from Anthropic');

  // Strip code fences
  content = content.trim();
  const lines = content.split('\n');
  if (lines[0].trim().startsWith('```')) lines.shift();
  if (lines[lines.length - 1].trim() === '```') lines.pop();
  content = lines.join('\n').trim();

  return content;
}

// Escape a string for use inside an HTML attribute or JSON-LD value.
function esc(v) {
  return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Gate 3: Article plus FAQPage on every post.
function buildSchema(post) {
  const graph = [{
    '@type': 'Article',
    headline: post.title,
    description: post.meta,
    image: 'https://autoacre.com.au/img/' + post.img,
    author: { '@type': 'Person', name: 'Ben Bonifant' },
    publisher: { '@type': 'Organization', name: 'AutoAcre', url: 'https://autoacre.com.au' },
    datePublished: post.date,
    mainEntityOfPage: 'https://autoacre.com.au/' + post.slug + '.html',
    keywords: post.keyword,
  }];
  if (post.faq && post.faq.length) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: post.faq.map(x => ({
        '@type': 'Question', name: x.q,
        acceptedAnswer: { '@type': 'Answer', text: x.a },
      })),
    });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

// ── Build blog post HTML ──────────────────────────────────────────────────────
function buildPostHtml(post) {
  const SITE_HEADER = `  <header class="site-header" role="banner">
    <div class="header-inner">
      <a href="index.html" class="header-logo" aria-label="AutoAcre home">
        <img src="./img/logo.png" alt="AutoAcre, autonomous acreage management" height="52" style="height:52px;width:auto;">
      </a>
      <nav class="header-nav" aria-label="Main navigation">
        <a href="index.html">Home</a>
        <a href="residential.html">Residential</a>
        <a href="commercial.html">Commercial</a>
        <a href="about.html">About</a>
        <a href="blog.html" class="active">Blog</a>
      </nav>
      <div class="header-actions">
        <a href="tel:0499649094" class="header-phone"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>0499 649 094</a>
        <a href="demo.html" class="btn btn--primary header-cta">Book a Demo</a>
        <button class="theme-toggle" data-theme-toggle aria-label="Toggle dark mode"></button>
        <button class="mobile-menu-btn" aria-label="Open menu"><span></span></button>
      </div>
    </div>
  </header>
  <nav class="mobile-nav"><a href="index.html">Home</a><a href="residential.html">Residential</a><a href="commercial.html">Commercial</a><a href="about.html">About</a><a href="blog.html">Blog</a><div class="mobile-nav-cta"><a href="demo.html" class="btn btn--primary btn--large">Book a Demo</a><a href="quote.html" class="btn btn--secondary btn--large">Get a Quote</a></div></nav>`;

  const SITE_FOOTER = `  <footer class="site-footer" role="contentinfo">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand"><a href="index.html"><img src="./img/logo.png" alt="AutoAcre" height="48" style="height:48px;width:auto;filter:brightness(0) invert(1);"></a><p>Autonomous grounds management across the Northern Rivers.</p></div>
        <div class="footer-col"><h4>Services</h4><ul><li><a href="residential.html">Residential</a></li><li><a href="commercial.html">Commercial</a></li><li><a href="demo.html">Book a Demo</a></li><li><a href="quote.html">Get a Quote</a></li></ul></div>
        <div class="footer-col"><h4>Company</h4><ul><li><a href="about.html">About</a></li><li><a href="blog.html">Blog</a></li></ul></div>
        <div class="footer-col"><h4>Contact</h4><div class="footer-contact-item"><a href="tel:0499649094">0499 649 094</a></div><div class="footer-contact-item"><a href="mailto:ben@autoacre.com.au">ben@autoacre.com.au</a></div></div>
      </div>
      <div class="footer-bottom"><span>&copy; 2026 AutoAcre. All rights reserved.</span></div>
    </div>
  </footer>
  <script src="./app.js" defer></script>`;

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${post.title} | AutoAcre Blog</title>
  <meta name="description" content="${esc(post.meta)}">
  <link rel="canonical" href="https://autoacre.com.au/${post.slug}.html">
  <meta property="og:title" content="${esc(post.title)}"><meta property="og:description" content="${esc(post.meta)}">
  <meta property="og:image" content="https://autoacre.com.au/img/${post.img}"><meta property="og:url" content="https://autoacre.com.au/${post.slug}.html"><meta property="og:type" content="article">
  <script type="application/ld+json">${buildSchema(post)}<\/script>
  <link href="https://api.fontshare.com/v2/css?f[]=zodiak@400,500,600&display=swap" rel="stylesheet">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./base.css"><link rel="stylesheet" href="./style.css">
</head>
<body>
${SITE_HEADER}
  <main>
    <section class="page-hero"><div class="container">
      <nav class="breadcrumb"><a href="index.html">Home</a> <span>/</span> <a href="blog.html">Blog</a> <span>/</span> ${post.title}</nav>
      <div class="page-hero-inner" style="grid-template-columns:1fr;max-width:780px;">
        <div class="page-hero-text">
          <div class="blog-card-meta" style="margin-bottom:var(--space-4);">
            <span class="blog-card-tag">${post.tag}</span>
            <time datetime="${post.date}">${fmtDate(post.date)}</time>
            <span>${post.readTime} min read</span>
          </div>
          <h1>${post.title}</h1>
          <p style="font-size:var(--text-lg);color:var(--color-text-muted);line-height:1.7;">${esc(post.meta)}</p>
        </div>
      </div>
    </div></section>
    <div class="section-image"><img src="./img/${post.img}" alt="${altFor(post.img, post.title)}" width="1200" height="400" loading="eager"></div>
    <section class="section"><div class="container">
      <div style="max-width:740px;margin:0 auto;line-height:1.85;font-size:17px;">
        <style>.pb h2{font-size:22px;font-weight:700;margin:2em 0 0.5em;line-height:1.3;color:#2D2D2D}.pb p{margin:0 0 1.3em;line-height:1.85}.pb ul{margin:0 0 1.3em 1.5em}.pb li{margin-bottom:0.5em;line-height:1.7}.pb a{color:#7A8B2D}.pb strong{font-weight:600}</style>
        <div class="pb">${post.content}</div>
      </div>
    </div></section>
    <section class="cta-banner"><div class="container">
      <h2>See it on your ground</h2>
      <p>Book an on-site demonstration and see how the machine handles your ground.</p>
      <div class="cta-banner-actions"><a href="demo.html" class="btn btn--primary btn--large">Book a Demo</a><a href="quote.html" class="btn btn--secondary btn--large" style="border-color:rgba(255,255,255,0.3);color:#fff;">Get a Quote</a></div>
    </div></section>
  </main>
${SITE_FOOTER}
</body></html>`;
}

// ── Build blog index HTML ─────────────────────────────────────────────────────
function buildBlogHtml(published) {
  const sorted = [...published].sort((a, b) => new Date(b.date) - new Date(a.date));
  const featured = sorted[0];
  const rest = sorted.slice(1);

  const featuredHtml = featured ? `
    <article class="blog-card blog-featured reveal" style="margin-bottom:var(--space-8);">
      <div class="blog-card-image"><img src="./img/${featured.img}" alt="${altFor(featured.img, featured.title)}" width="800" height="450" loading="lazy"></div>
      <div class="blog-card-body">
        <div class="blog-card-meta"><span class="blog-card-tag">${featured.tag}</span><time datetime="${featured.date}">${fmtDate(featured.date)}</time><span>${featured.readTime} min read</span></div>
        <h3>${featured.title}</h3><p>${featured.excerpt}</p>
        <div style="margin-top:var(--space-4);"><a href="${featured.slug}.html" class="btn btn--primary btn--small">Read Article</a></div>
      </div>
    </article>` : '';

  const gridHtml = rest.length ? `<div class="card-grid card-grid--3 reveal">${rest.map(p => `
    <article class="blog-card">
      <div class="blog-card-image"><img src="./img/${p.img}" alt="${altFor(p.img, p.title)}" width="400" height="225" loading="lazy"></div>
      <div class="blog-card-body">
        <div class="blog-card-meta"><span class="blog-card-tag">${p.tag}</span><time datetime="${p.date}">${fmtDate(p.date)}</time><span>${p.readTime} min read</span></div>
        <h3>${p.title}</h3><p>${p.excerpt}</p>
        <div style="margin-top:var(--space-4);"><a href="${p.slug}.html" class="btn btn--secondary btn--small">Read Article</a></div>
      </div>
    </article>`).join('')}</div>` : '';

  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Blog — Acreage Mowing &amp; Property Maintenance | AutoAcre</title>
  <meta name="description" content="Expert guides on acreage mowing costs, autonomous vs traditional mowing, and lifestyle property maintenance across Byron Bay and the Northern Rivers.">
  <link rel="canonical" href="https://autoacre.com.au/blog.html">
  <link href="https://api.fontshare.com/v2/css?f[]=zodiak@400,500,600&display=swap" rel="stylesheet">
  <link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./base.css"><link rel="stylesheet" href="./style.css">
</head>
<body>
  <header class="site-header"><div class="header-inner"><a href="index.html" class="header-logo"><img src="./img/logo.png" alt="AutoAcre" height="52" style="height:52px;width:auto;"></a><nav class="header-nav"><a href="index.html">Home</a><a href="residential.html">Residential</a><a href="commercial.html">Commercial</a><a href="about.html">About</a><a href="blog.html" class="active">Blog</a></nav><div class="header-actions"><a href="demo.html" class="btn btn--primary header-cta">Book a Demo</a><button class="theme-toggle" data-theme-toggle></button><button class="mobile-menu-btn"><span></span></button></div></div></header>
  <nav class="mobile-nav"><a href="index.html">Home</a><a href="residential.html">Residential</a><a href="commercial.html">Commercial</a><a href="about.html">About</a><a href="blog.html">Blog</a><div class="mobile-nav-cta"><a href="demo.html" class="btn btn--primary btn--large">Book a Demo</a><a href="quote.html" class="btn btn--secondary btn--large">Get a Quote</a></div></nav>
  <main>
    <section class="page-hero"><div class="container">
      <nav class="breadcrumb"><a href="index.html">Home</a> <span>/</span> Blog</nav>
      <div class="page-hero-inner" style="grid-template-columns:1fr;"><div class="page-hero-text"><span class="section-label">Knowledge Base</span><h1>Guides for acreage property owners</h1><p>Practical advice on autonomous mowing, grounds management, and getting the most from your Northern Rivers lifestyle property.</p></div></div>
    </div></section>
    <section class="section"><div class="container">
      <h2 class="sr-only">Articles</h2>
      ${featuredHtml}
      ${gridHtml}
    </div></section>
    <section class="cta-banner"><div class="container">
      <h2>Don't wait for another fortnightly visit</h2>
      <p>See daily autonomous mowing on your property.</p>
      <div class="cta-banner-actions"><a href="demo.html" class="btn btn--primary btn--large">Book a Demo</a><a href="quote.html" class="btn btn--secondary btn--large" style="border-color:rgba(255,255,255,0.3);color:#fff;">Get a Quote</a></div>
    </div></section>
  </main>
  <footer class="site-footer"><div class="container"><div class="footer-bottom"><span>&copy; 2026 AutoAcre. All rights reserved.</span></div></div></footer>
  <script src="./app.js" defer></script>
</body></html>`;
}

// ── Build sitemap ─────────────────────────────────────────────────────────────
// Lists every real page on the site. Utility pages are skipped, and so is any
// path that _redirects sends elsewhere, since a sitemap should never list a URL
// that only redirects. Blog posts come from published-posts.json.
function buildSitemap(published) {
  const today = new Date().toISOString().split('T')[0];
  const SKIP = /^(404|thank-you.*|privacy|terms|blog-.*)\.html$/;
  const redirected = new Set();
  const rp = path.join(__dirname, '_redirects');
  if (fs.existsSync(rp)) {
    for (const line of fs.readFileSync(rp, 'utf8').split('\n')) {
      const m = line.trim().match(/^(\/\S+)\s+\S+\s+\d{3}/);
      if (m) redirected.add(m[1].replace(/^\//, ''));
    }
  }
  const PRIORITY = {
    'index.html': ['1.0', 'weekly'], 'commercial.html': ['0.9', 'monthly'], 'residential.html': ['0.9', 'monthly'],
    'solar-farm-mowing.html': ['0.9', 'monthly'], 'commercial-robotic-mower-buyers-guide-australia.html': ['0.9', 'monthly'],
    'best-robot-mower-for-large-properties.html': ['0.9', 'monthly'], 'blog.html': ['0.9', 'weekly'],
    'about.html': ['0.8', 'monthly'], 'demo.html': ['0.8', 'monthly'], 'quote.html': ['0.8', 'monthly'],
    'service-area.html': ['0.8', 'monthly'],
  };
  const pages = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.html') && !SKIP.test(f) && !redirected.has(f))
    .sort();
  const urls = pages.map(f => {
    const [p, c] = PRIORITY[f] || ['0.7', 'monthly'];
    return [f === 'index.html' ? 'https://autoacre.com.au/' : 'https://autoacre.com.au/' + f, p, c];
  });
  for (const p of published) urls.push(['https://autoacre.com.au/' + p.slug + '.html', '0.7', 'monthly']);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([u, p, f]) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${f}</changefreq>\n    <priority>${p}</priority>\n  </url>`).join('\n')}\n</urlset>`;
}

// CLI: node generate-post.js --sitemap  rewrites sitemap.xml without publishing anything
if (process.argv.includes('--sitemap')) {
  const published = JSON.parse(fs.readFileSync(path.join(__dirname, 'published-posts.json'), 'utf8'));
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), buildSitemap(published));
  console.log('sitemap.xml rebuilt');
  process.exit(0);
}

// Section 1: the four publishing gates. All four must be true or nothing publishes.
function openGates(queue) {
  const g = queue.gates || {};
  const required = {
    inflated_post_fixed: 'the old 25 acres / 38 degree post is fixed or unpublished',
    generator_instructions_corrected: 'generator instructions match Content Queue v2 Section 2',
    schema_restored: 'post template emits Article + FAQPage schema',
    fifteen_retrofitted: 'the fifteen queued posts have the Section 3 retrofit applied',
  };
  return Object.keys(required).filter(k => g[k] !== true).map(k => k + ' (' + required[k] + ')');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Load queue
  const queuePath = path.join(__dirname, 'posts-queue.json');
  const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

  const open = openGates(queue);
  if (open.length && !process.argv.includes('--ignore-gates')) {
    console.error('HOLDING SLOT. Open gates:');
    open.forEach(o => console.error('  - ' + o));
    console.error('Set them true in posts-queue.json "gates" when each is genuinely done.');
    process.exit(1);
  }

  if (queue.nextIndex >= queue.topics.length) {
    console.log('All topics published — queue complete!');
    return;
  }

  while (queue.topics[queue.nextIndex] &&
         (queue.topics[queue.nextIndex].status === 'held' || queue.topics[queue.nextIndex].gate)) {
    const skipped = queue.topics[queue.nextIndex];
    console.log('Skipping ' + skipped.title + ' (' + (skipped.gate || 'held') + ')');
    queue.nextIndex += 1;
  }
  if (queue.nextIndex >= queue.topics.length) { console.log('No clear entry left in the queue.'); return; }

  const topic = queue.topics[queue.nextIndex];
  console.log(`Publishing topic ${queue.nextIndex + 1}/${queue.topics.length}: ${topic.title}`);

  // Pick the hero image from the topic content (title + keyword), not the queue's tag-based img.
  // Runs for customBody posts too.
  const publishedPath = path.join(__dirname, 'published-posts.json');
  const published = fs.existsSync(publishedPath) ? JSON.parse(fs.readFileSync(publishedPath, 'utf8')) : [];
  setRecentImages(published);
  const image = pickImage(topic);
  if (image !== topic.img) console.log(`Image: ${image} (queue had ${topic.img || 'none'})`);

  // Use custom body if provided, otherwise generate via AI
  let content;
  if (topic.customBody) {
    console.log('Using pre-written custom body (skipping AI generation)');
    // Convert plain text paragraphs to HTML — split by double newlines
    const paragraphs = topic.customBody.split(/\n+/).filter(p => p.trim());
    content = paragraphs.map(p => {
      const trimmed = p.trim();
      // If it starts with **, treat as h2 heading with bold text (Ben uses **bold** for section headers)
      if (trimmed.startsWith('**') && trimmed.indexOf('**', 2) > 0) {
        const boldEnd = trimmed.indexOf('**', 2);
        const heading = trimmed.slice(2, boldEnd);
        const rest = trimmed.slice(boldEnd + 2).trim();
        return `<h2>${heading}</h2>${rest ? `\n<p>${rest}</p>` : ''}`;
      }
      // If wrapped in *italic*, treat as italic sign-off paragraph
      if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('**')) {
        return `<p><em>${trimmed.slice(1, -1)}</em></p>`;
      }
      // Regular paragraph — convert inline **bold** to <strong>
      const withBold = trimmed.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return `<p>${withBold}</p>`;
    }).join('\n');
  } else {
    content = await generateContent(topic);
  }

  // Build post object
  const today = new Date().toISOString().split('T')[0];
  const extracted = extractMeta(content);
  let body = stripForbidden(extracted.body);
  if (!body.includes('ben@autoacre.com.au')) body = body + '\n' + SIGN_OFF;
  const words = body.replace(/<[^>]+>/g, ' ').trim().split(/\s+/);
  // A hand-written entry can carry its own meta in the queue; otherwise use the
  // model's <!--META:--> line. Falling back to truncated body text fails the check,
  // which is the point: a post without a real meta description is not ready.
  const meta = topic.meta || extracted.meta || (words.slice(0, 22).join(' ') + '.');
  const post = {
    title: topic.title,
    keyword: topic.keyword,
    tag: topic.tag,
    img: image,
    slug: topic.slug || slugify(topic.title),
    content: body,
    meta,
    excerpt: meta,
    faq: extractFaq(body),
    readTime: Math.max(3, Math.round(words.length / 200)),
    date: today
  };

  // Section 2.5 self-check. On any failure the slot is held, not filled.
  const fails = selfCheck(post);
  if (fails.length) {
    console.error('SELF-CHECK FAILED for "' + post.title + '". Slot held, nothing written.');
    fails.forEach(x => console.error('  - ' + x));
    process.exit(1);
  }
  console.log('Self-check passed (' + words.length + ' words, ' + post.faq.length + ' FAQ entries).');

  // Add to published list (loaded above)
  published.push(post);

  // Write files
  console.log(`Writing ${post.slug}.html...`);
  fs.writeFileSync(path.join(__dirname, `${post.slug}.html`), buildPostHtml(post));

  console.log('Updating blog.html...');
  fs.writeFileSync(path.join(__dirname, 'blog.html'), buildBlogHtml(published));

  console.log('Updating sitemap.xml...');
  fs.writeFileSync(path.join(__dirname, 'sitemap.xml'), buildSitemap(published));

  // Save published list
  fs.writeFileSync(publishedPath, JSON.stringify(published, null, 2));

  // Update queue
  queue.nextIndex += 1;
  queue.lastPublished = queue.nextIndex - 1;
  queue.lastPublishedDate = today;
  queue.published.push({ slug: post.slug, date: today, title: post.title });
  fs.writeFileSync(queuePath, JSON.stringify(queue, null, 2));

  console.log(`✓ Published: ${post.title}`);
  console.log(`✓ Live at: https://autoacre.com.au/${post.slug}.html`);
  console.log(`Next up (${queue.nextIndex + 1}/${queue.topics.length}): ${queue.topics[queue.nextIndex]?.title || 'Queue complete'}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
