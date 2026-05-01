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

// ── Generate 3 FAQ Q&A pairs for the post (for FAQPage schema) ───────────────
// Returns an array of {q, a} objects. Returns [] on any failure so the post
// still publishes — graceful degradation.
async function generateFaqs(topic) {
  try {
    const result = await httpsPost(
      'https://api.anthropic.com/v1/messages',
      {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      {
        model: 'claude-sonnet-4-5',
        max_tokens: 1200,
        system: `You write FAQ pairs for AutoAcre, an autonomous acreage mowing service in Byron Bay & the Northern Rivers, NSW. Brand: premium, grounded, Australian, NOT tech startup. Owner Ben Bonifant, 0499 649 094. AutoAcre's offer is Buy + Manage: customer buys the PANDAG G1 robotic mower outright at $33,490, then pays a tiered monthly management fee from $260/month (4 acres) to $650/month (10 acres) for scheduled maintenance, monitoring and repair coordination. PANDAG G1 specs: 25 acres/day, 38° slopes, GPS-RTK navigation. Do NOT describe it as a "subscription" or claim "$600-$800/month". Do NOT claim AutoAcre is the authorised PANDAG G1 dealer. Australian spelling. Each answer is 2-3 sentences, factual, specific, and self-contained. Output ONLY a JSON array of exactly 3 objects: [{"q":"...","a":"..."},{"q":"...","a":"..."},{"q":"...","a":"..."}]. No markdown. No code fences. No prose around the JSON.`,
        messages: [{
          role: 'user',
          content: `Write 3 FAQ pairs that an AI answer engine could cite for this blog post. The questions must be the kinds of questions real Northern Rivers acreage owners ask. Make them specific to the post topic so they reinforce the post's authority.\n\nTitle: ${topic.title}\nTarget keyword: ${topic.keyword}\nCategory: ${topic.tag}\n\nOutput the JSON array directly with no code fences and no surrounding prose.`
        }]
      }
    );
    if (result.error) throw new Error('Anthropic FAQ error: ' + result.error.message);
    let txt = (result.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    // Strip code fences if the model added them anyway
    if (txt.startsWith('```')) {
      const lines = txt.split('\n');
      lines.shift();
      if (lines[lines.length - 1].trim().startsWith('```')) lines.pop();
      txt = lines.join('\n').trim();
    }
    const parsed = JSON.parse(txt);
    if (!Array.isArray(parsed)) throw new Error('FAQ response not an array');
    return parsed
      .filter(x => x && typeof x.q === 'string' && typeof x.a === 'string')
      .slice(0, 3);
  } catch (e) {
    console.warn('FAQ generation failed (post will still publish without FAQ schema):', e.message);
    return [];
  }
}

// ── Escape a string for safe embedding in a JSON-LD <script> block ───────────
function jsonLdEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, ' ')
    .replace(/<\/script/gi, '<\\/script');
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
      system: `You are a senior SEO content writer for AutoAcre, an autonomous acreage mowing business in Byron Bay, Northern Rivers NSW. Brand: premium rural property, trustworthy, grounded, Australian hinterland. NOT tech startup. Owner Ben Bonifant, 0499 649 094, autoacre.com.au. AutoAcre's offer is Buy + Manage: customer buys the PANDAG G1 robotic mower outright at $33,490, then pays a tiered monthly management fee from $260/month (4 acres) to $650/month (10 acres) for ongoing scheduled maintenance, blade replacements, firmware updates, monitoring and repair coordination. The customer owns the asset; AutoAcre runs the management service. PANDAG G1 specs: 25 acres/day capacity, 38° slope handling, GPS-RTK precision navigation. Service area: Byron Bay, Bangalow, Newrybar, Ewingsdale, Mullumbimby, Federal, Myocum, Tyagarah, Brooklet, Clunes, Eureka, Nashua, Alstonville, Teven, Tintenbar, Northern Rivers NSW. Do NOT describe AutoAcre as a "subscription" service or claim "$600-$800/month all-inclusive" — that was a previous model. Do NOT claim AutoAcre is the authorised PANDAG G1 dealer (relationship is not yet formal). Output clean HTML using only h2, p, ul, li, strong tags. No h1. No divs. 900-1100 words. Australian spelling. Target keyword in first paragraph and 2+ h2s. End with CTA linking to autoacre.com.au/quote.html or demo.html. Output HTML directly with no code fences, no backticks, no markdown.`,
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
  const SITE_HEADER = `  <div class="prelaunch-banner" role="region" aria-label="Pre-launch announcement">
    <p>AutoAcre is launching managed-service operations in Q1 2027. The calculator and Buyer's Guide are open now — <a href="register-interest.html">join the launch list</a>.</p>
  </div>
  <header class="site-header" role="banner">
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
  <meta property="og:image" content="./img/og-image.png"><meta property="og:url" content="https://autoacre.com.au/${post.slug}.html"><meta property="og:type" content="article">
  <script type="application/ld+json">${(() => {
    const articleId = `https://autoacre.com.au/${post.slug}.html#article`;
    const pageId = `https://autoacre.com.au/${post.slug}.html#webpage`;
    const orgId = "https://autoacre.com.au/#organization";
    const personId = "https://autoacre.com.au/#ben-bonifant";
    const websiteId = "https://autoacre.com.au/#website";
    const graph = [
      {
        "@type": "WebPage",
        "@id": pageId,
        "url": `https://autoacre.com.au/${post.slug}.html`,
        "name": post.title,
        "description": post.excerpt,
        "inLanguage": "en-AU",
        "isPartOf": { "@id": websiteId },
        "primaryImageOfPage": `https://autoacre.com.au/img/${post.img}`,
        "speakable": {
          "@type": "SpeakableSpecification",
          "cssSelector": [".page-hero-text h1", ".page-hero-text p", ".pb h2", ".pb p"]
        }
      },
      {
        "@type": "Article",
        "@id": articleId,
        "headline": post.title,
        "description": post.excerpt,
        "articleSection": post.tag,
        "keywords": post.keyword,
        "wordCount": post.wordCount || undefined,
        "datePublished": post.date,
        "dateModified": post.date,
        "inLanguage": "en-AU",
        "image": `https://autoacre.com.au/img/${post.img}`,
        "author": { "@id": personId },
        "publisher": { "@id": orgId },
        "mainEntityOfPage": { "@id": pageId },
        "isPartOf": { "@id": websiteId },
        "about": { "@id": orgId },
        "mentions": [
          { "@id": orgId },
          { "@id": "https://autoacre.com.au/#service-residential" },
          { "@id": "https://autoacre.com.au/#service-commercial" },
          { "@id": "https://autoacre.com.au/#product-pandag-g1" }
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://autoacre.com.au/" },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": "https://autoacre.com.au/blog.html" },
          { "@type": "ListItem", "position": 3, "name": post.title, "item": `https://autoacre.com.au/${post.slug}.html` }
        ]
      }
    ];
    if (Array.isArray(post.faqs) && post.faqs.length) {
      graph.push({
        "@type": "FAQPage",
        "@id": `https://autoacre.com.au/${post.slug}.html#faq`,
        "isPartOf": { "@id": pageId },
        "about": { "@id": orgId },
        "mainEntity": post.faqs.map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": { "@type": "Answer", "text": f.a }
        }))
      });
    }
    return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  })()}<\/script>
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
    <div class="section-image"><img src="./img/${post.img}" alt="${post.title}" width="1200" height="400" loading="eager"></div>
    <section class="section"><div class="container">
      <div style="max-width:740px;margin:0 auto;line-height:1.85;font-size:17px;">
        <style>.pb h2{font-size:22px;font-weight:700;margin:2em 0 0.5em;line-height:1.3;color:#2D2D2D}.pb p{margin:0 0 1.3em;line-height:1.85}.pb ul{margin:0 0 1.3em 1.5em}.pb li{margin-bottom:0.5em;line-height:1.7}.pb a{color:#7A8B2D}.pb strong{font-weight:600}</style>
        <div class="pb">${post.content}</div>
      </div>
    </div></section>
    ${(Array.isArray(post.faqs) && post.faqs.length) ? `<section class="section section--alt"><div class="container">
      <div style="max-width:780px;margin:0 auto;">
        <h2 style="font-size:26px;font-weight:600;margin:0 0 1em;color:#2D2D2D;">Frequently asked questions</h2>
        <style>.post-faq{padding:1.3em 0;border-bottom:1px solid #E8E8E0}.post-faq:last-child{border-bottom:none}.post-faq .q{font-size:18px;font-weight:600;margin:0 0 0.4em;color:#2D2D2D}.post-faq .a{font-size:16px;line-height:1.7;color:#444;margin:0}</style>
        ${post.faqs.map(f => `<div class="post-faq"><p class="q">${f.q}</p><p class="a">${f.a}</p></div>`).join('')}
        <p style="margin-top:1.6em;font-size:15px;color:#666;">More answers in the <a href="faq.html" style="color:#7A8B2D;">AutoAcre FAQ</a>, or browse the <a href="glossary.html" style="color:#7A8B2D;">glossary</a>.</p>
      </div>
    </div></section>` : ''}
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
      <div class="blog-card-image"><img src="./img/${featured.img}" alt="${featured.title}" width="800" height="450" loading="lazy"></div>
      <div class="blog-card-body">
        <div class="blog-card-meta"><span class="blog-card-tag">${featured.tag}</span><time datetime="${featured.date}">${fmtDate(featured.date)}</time><span>${featured.readTime} min read</span></div>
        <h3>${featured.title}</h3><p>${featured.excerpt}</p>
        <div style="margin-top:var(--space-4);"><a href="${featured.slug}.html" class="btn btn--primary btn--small">Read Article</a></div>
      </div>
    </article>` : '';

  const gridHtml = rest.length ? `<div class="card-grid card-grid--3 reveal">${rest.map(p => `
    <article class="blog-card">
      <div class="blog-card-image"><img src="./img/${p.img}" alt="${p.title}" width="400" height="225" loading="lazy"></div>
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
      <p>See frequent autonomous mowing on your property.</p>
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
    ['https://autoacre.com.au/faq.html', '0.9', 'monthly'],
    ['https://autoacre.com.au/glossary.html', '0.8', 'monthly'],
    ['https://autoacre.com.au/facts.html', '0.8', 'monthly'],
    ['https://autoacre.com.au/autonomous-vs-ride-on.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/autoacre-vs-husqvarna.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/daily-vs-fortnightly-mowing.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/holiday-rental-mowing.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/absentee-owner-mowing.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/steep-block-mowing.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/how-to-prepare-acreage-for-autonomous-mowing.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/how-to-assess-if-your-property-is-right-for-autonomous-mowing.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/how-to-switch-from-a-fortnightly-contractor.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/service-area.html', '0.9', 'monthly'],
    ['https://autoacre.com.au/solar-farm-mowing.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/council-mowing-northern-rivers.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/resort-grounds-maintenance.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/school-grounds-maintenance.html', '0.85', 'monthly'],
    ['https://autoacre.com.au/golf-course-robot-mower.html', '0.85', 'monthly'],
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

  // Generate content + paired FAQs (for FAQPage schema)
  const content = await generateContent(topic);
  const faqs = await generateFaqs(topic);
  console.log(`Generated ${faqs.length} FAQ pair(s) for schema enrichment`);

  // Build post object
  const today = new Date().toISOString().split('T')[0];
  const words = content.replace(/<[^>]+>/g, ' ').trim().split(/\s+/);
  const post = {
    title: topic.title,
    keyword: topic.keyword,
    tag: topic.tag,
    img: topic.img,
    slug: slugify(topic.title),
    content,
    excerpt: words.slice(0, 30).join(' ') + '…',
    readTime: Math.max(4, Math.round(words.length / 200)),
    wordCount: words.length,
    faqs,
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
