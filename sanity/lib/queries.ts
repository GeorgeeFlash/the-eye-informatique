import { defineQuery } from "next-sanity"

// ---------------------------------------------------------------------------
// Hero Banner (singleton)
// ---------------------------------------------------------------------------
export const HERO_BANNER_QUERY = defineQuery(`
  *[_type == "heroBanner" && _id == "heroBanner"][0]{
    title,
    subtitle,
    image,
    ctaPrimary,
    ctaSecondary
  }
`)

// ---------------------------------------------------------------------------
// About Page (singleton)
// ---------------------------------------------------------------------------
export const ABOUT_PAGE_QUERY = defineQuery(`
  *[_type == "aboutPage" && _id == "aboutPage"][0]{
    title,
    subtitle,
    bannerImage,
    mission{
      title,
      body
    },
    story{
      title,
      body,
      image
    },
    services[]{
      _key,
      title,
      description,
      icon,
      image
    },
    stats[]{
      _key,
      value,
      label
    },
    team[]{
      _key,
      name,
      role,
      image
    },
    branches[]{
      _key,
      name,
      city,
      address,
      phone,
      email,
      isHQ
    },
    seo
  }
`)

// ---------------------------------------------------------------------------
// Affiliate Landing Page (singleton)
// ---------------------------------------------------------------------------
export const AFFILIATE_LANDING_QUERY = defineQuery(`
  *[_type == "affiliateLanding" && _id == "affiliateLanding"][0]{
    title,
    subtitle,
    heroDescription,
    howItWorks,
    benefits,
    commissionNote,
    faq,
    cta,
    seo
  }
`)

// ---------------------------------------------------------------------------
// Legal Pages
// ---------------------------------------------------------------------------
export const LEGAL_PAGE_QUERY = defineQuery(`
  *[_type == "legalPage" && slug.current == $slug][0]{
    title,
    slug,
    content,
    lastUpdated,
    seo
  }
`)

export const LEGAL_PAGES_LIST_QUERY = defineQuery(`
  *[_type == "legalPage"]{ "slug": slug.current }
`)
