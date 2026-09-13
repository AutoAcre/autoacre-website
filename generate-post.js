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
  'commercial-golf.jpg':    'Autonomous mower on golf course grounds',
  'commercial-school.jpg':  'Autonomous mowing on school grounds',
  'commercial-council.jpg': 'Autonomous mowing on council parks and reserves',
  'commercial-park.jpg':    'Autonomous mowing in park and reserve',
  'commercial-resort.jpg':  'Autonomous mowing at resort grounds',
  'commercial-hero.jpg':    'Autonomous mowing for commercial grounds',
  'aerial-prestige.jpg':    'Aerial view of prestige lifestyle property',
  'hinterland-aerial.jpg':  'Northern Rivers hinterland lifestyle property',
  'g1-wide-paddock.jpg':    'PANDAG G1 autonomous mower working open paddock',
  'g1-striping.jpg':        'Mowing stripes cut by PANDAG G1 autonomous mower',
  'g1-closeup.png':         'PANDAG G1 autonomous mower detail',
  'hilux-trailer.jpg':      'AutoAcre Hilux and trailer with autonomous mowing equipment',
  'demo-scene.jpg':         'AutoAcre autonomous mowing demonstration',
  'problem.jpg':            'Overgrown property showing acreage mowing challenge',
  'result.jpg':             'Well-maintained acreage after autonomous mowing',
  'residential-hero.jpg':   'Residential acreage lifestyle property',
  'veranda-view.jpg':       'View from lifestyle property veranda',
  'hero.jpg':               'Northern Rivers acreage property',
};

function pickImage(topic) {
  const s = ((topic.title || '') + ' ' + (topic.keyword || '')).toLowerCase();
  const has = re => re.test(s);
  const suburb = SUBURB_RE.test(s);
  const location = suburb || has(/\bbyron\b|\bhinterland|northern rivers|\bshire\b/);

  if (has(/solar/)) return 'commercial-solar.jpg';
  if (has(/\bgolf\b/)) return 'commercial-golf.jpg';
  if (has(/\bschool/)) return 'commercial-school.jpg';
  if (has(/\bcouncil/) || has(/parks and reserves/)) return 'commercial-council.jpg';
  if (has(/\bparks?\b/) || has(/\breserves?\b/)) return 'commercial-park.jpg';
  if (has(/\bresort/)) return 'commercial-resort.jpg';
  if (has(/\bairport/) || has(/\bcommercial\b/)) return 'commercial-hero.jpg';
  if (has(/\bdealer/)) return 'hilux-trailer.jpg';
  if (has(/holiday rental/) || has(/\babsentee/) || has(/without living/)) return 'aerial-prestige.jpg';
  if (has(/\bprestige/) || has(/\bestate\b/)) return 'aerial-prestige.jpg';
  if (has(/\bsteep/) || has(/\bslopes?\b/)) return 'hinterland-aerial.jpg';
  if (has(/\bpandag\b/) || has(/\bg1\b/) || has(/\blymow\b/) || has(/\bluba\b/) || has(/\bmammotion\b/) || has(/\bbuy(er|ing)?\b/)) return 'g1-closeup.png';
  if (has(/\bdemo(nstration)?s?\b/)) return 'demo-scene.jpg';
  if (has(/how it works|how .* works|explained|explainer/) || (has(/\bguide\b/) && !location)) return 'demo-scene.jpg';
  if (has(/\binternet|\bconnectivity|\brtk\b|\bsignal\b|\bwifi\b/)) return 'demo-scene.jpg';
  if (has(/acres (a|per) day|\bcapacity\b|hectares (a|per) day/)) return 'g1-wide-paddock.jpg';
  if (has(/\btrials?\b/) && has(/\bfail/)) return 'problem.jpg';
  if (has(/\bproblems?\b/) || has(/\bsigns?\b/) || has(/\bissues?\b/)) return 'problem.jpg';
  if (has(/\bresults?\b/) || has(/before and after/)) return 'result.jpg';
  if (has(/\bcost/) || has(/\bprices?\b|\bpricing\b/) || has(/\bspend/) || has(/\bbudget/) || has(/worth it/) || has(/\bsubscription/)) return 'hero.jpg';
  if (has(/zero[- ]turn/) || has(/ride[- ]on/) || has(/\bdiy\b/)) return 'result.jpg';
  if (has(/\bpaddock/) || has(/\bpasture/)) return 'g1-wide-paddock.jpg';
  if (suburb) return 'hinterland-aerial.jpg';
  if (has(/\bveranda/) || has(/\bview\b/) || has(/\blifestyle\b/)) return 'veranda-view.jpg';
  if (has(/\bhinterland/) || has(/\bbyron\b/) || suburb) return 'hinterland-aerial.jpg';
  if (has(/\bfire\b|\bbushfire\b|\bhazard/)) return 'hinterland-aerial.jpg';
  if (has(/\bacreage/) || has(/\bfarm/)) return 'g1-wide-paddock.jpg';
  return 'hero.jpg';
}

function altFor(img, fallback) {
  return IMAGE_ALT[img] || fallback;
}

// CLI check: node generate-post.js --check-images  → prints what each queued topic would get
if (process.argv.includes('--check-images')) {
  const q = JSON.parse(fs.readFileSync(path.join(__dirname, 'posts-queue.json'), 'utf8'));
  q.topics.forEach((t, i) => {
    const img = pickImage(t);
    const flag = img === t.img ? ' ' : '*';
    console.log(`${String(i).padStart(2)} ${flag} ${img.padEnd(22)} (queue: ${(t.img || '-').padEnd(22)}) ${t.title}`);
  });
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
      system: `You are a senior SEO content writer for AutoAcre, a premium autonomous acreage mowing business in Byron Bay, Northern Rivers NSW. Brand: premium rural property, trustworthy, grounded, Australian hinterland. NOT tech startup. Owner Ben Bonifant, 0499 649 094, autoacre.com.au. PANDAG G1 mower (25 acres/day, 38° slopes), $600-$800/month. Service area: Byron Bay, Bangalow, Newrybar, Ewingsdale, Mullumbimby, Northern Rivers NSW. Output clean HTML using only h2, p, ul, li, strong tags. No h1. No divs. 900-1100 words. Australian spelling. Target keyword in first paragraph and 2+ h2s. End with CTA linking to autoacre.com.au/quote.html or demo.html. Output HTML directly with no code fences, no backticks, no markdown.`,
      messages: [{
        role: 'user',
        content: `Write the full SEO blog post body for AutoAcre.\nTitle: ${topic.title}\nTarget keyword: ${topic.keyword}\nCategory: ${topic.tag}\n\nOutput the HTML directly with no code fences, no backticks, no markdown wrapping.`
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

// ── Build blog post HTML ──────────────────────────────────────────────────────
function buildPostHtml(post) {
  const SITE_HEADER = `  <header class="site-header" role="banner">
    <div class="header-inner">
      <a href="index.html" class="header-logo" aria-label="AutoAcre home">
        <img src="./img/logo.png" alt="AutoAcre — Autonomous Acreage Management" height="52" style="height:52px;width:auto;">
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
  <meta name="description" content="${post.excerpt}">
  <link rel="canonical" href="https://autoacre.com.au/${post.slug}.html">
  <meta property="og:title" content="${post.title}"><meta property="og:description" content="${post.excerpt}">
  <meta property="og:image" content="https://autoacre.com.au/img/${post.img}"><meta property="og:url" content="https://autoacre.com.au/${post.slug}.html"><meta property="og:type" content="article">
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"${post.title}","description":"${post.excerpt}","author":{"@type":"Person","name":"Ben Bonifant"},"publisher":{"@type":"Organization","name":"AutoAcre","url":"https://autoacre.com.au"},"datePublished":"${post.date}","keywords":"${post.keyword}"}<\/script>
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
          <p style="font-size:var(--text-lg);color:var(--color-text-muted);line-height:1.7;">${post.excerpt}</p>
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
      <h2>Ready to transform your property?</h2>
      <p>Book an on-site demonstration and see the PANDAG G1 handle your terrain. $350–$450 credited to your first month.</p>
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
function buildSitemap(published) {
  const today = new Date().toISOString().split('T')[0];
  const staticUrls = [
    ['https://autoacre.com.au/', '1.0', 'weekly'],
    ['https://autoacre.com.au/residential.html', '0.9', 'monthly'],
    ['https://autoacre.com.au/commercial.html', '0.9', 'monthly'],
    ['https://autoacre.com.au/about.html', '0.8', 'monthly'],
    ['https://autoacre.com.au/blog.html', '0.9', 'weekly'],
    ['https://autoacre.com.au/demo.html', '0.8', 'monthly'],
    ['https://autoacre.com.au/quote.html', '0.8', 'monthly'],
  ];
  const suburbs = ['bangalow','ewingsdale','newrybar','alstonville','teven','tintenbar','brooklet','clunes','nashua','eureka','federal','myocum','tyagarah','mullumbimby'];
  const suburbUrls = suburbs.map(s => [`https://autoacre.com.au/mowing-${s}.html`, '0.8', 'monthly']);
  const postUrls = published.map(p => [`https://autoacre.com.au/${p.slug}.html`, '0.7', 'monthly']);
  const all = [...staticUrls, ...suburbUrls, ...postUrls];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${all.map(([u, p, f]) => `  <url>\n    <loc>${u}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${f}</changefreq>\n    <priority>${p}</priority>\n  </url>`).join('\n')}\n</urlset>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Load queue
  const queuePath = path.join(__dirname, 'posts-queue.json');
  const queue = JSON.parse(fs.readFileSync(queuePath, 'utf8'));

  if (queue.nextIndex >= queue.topics.length) {
    console.log('All topics published — queue complete!');
    return;
  }

  const topic = queue.topics[queue.nextIndex];
  console.log(`Publishing topic ${queue.nextIndex + 1}/${queue.topics.length}: ${topic.title}`);

  // Pick the hero image from the topic content (title + keyword), not the queue's tag-based img.
  // Runs for customBody posts too.
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
  const words = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/);
  const post = {
    title: topic.title,
    keyword: topic.keyword,
    tag: topic.tag,
    img: image,
    slug: slugify(topic.title),
    content,
    excerpt: words.slice(0, 30).join(' ') + '…',
    readTime: Math.max(4, Math.round(words.length / 200)),
    date: today
  };

  // Load existing published list
  const publishedPath = path.join(__dirname, 'published-posts.json');
  const published = fs.existsSync(publishedPath) ? JSON.parse(fs.readFileSync(publishedPath, 'utf8')) : [];
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
