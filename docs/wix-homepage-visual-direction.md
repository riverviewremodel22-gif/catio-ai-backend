# Homepage Visual Direction — Approved November 15, 2026

**Target:** Existing editable Wix Editor draft **The Catio Company 2** (site ID `148bc4c3-3959-451e-a251-634f05e36d41`).

**Do not change:** production/original site `thecatiocompany.com`, domain routing, SEO URLs, checkout and bookings. This is an approved visual *direction*, not evidence of an implemented Wix Editor page.

## Brand design tokens

- Headline typography: **Quicksand** Bold / Semibold.
- Paragraph typography: **Manrope** Regular / Medium.
- Main text: rich dark cocoa `#2C1E19`.
- Headline / wood accent: warm cedar brown `#704225`.
- Brand action: deep moss olive `#465B1D`.
- Background: warm cream `#FBF7F1`; card backgrounds `#F2E8D9`.
- Thin divider line: `#A47A55`, with **small centered paw icon**, sparingly between major content sections.
- Corners: 12–20 px for photography and cards; generously rounded pill CTAs.
- No excessive animation or icons. Responsive mobile layouts and accessibility contrast required.

## Homepage sections (ordered)

1. **Header**: retain official The Catio Company logo, navigation `Custom Catios | Our Projects | DIY Plans | Resources | About Us`, primary `Get a Free Estimate`. Mobile menu.
2. **Hero**: use a REAL, approved original company catio photograph (not generated mockup). Quicksand H1 `Custom Catios`; Manrope descriptor `Safe, beautiful outdoor spaces for happier cats.` Primary CTA `Get a Free Estimate`, secondary `Explore Our Projects`. Alt text authored from image inspection, not speculation.
3. **Project gallery first**: heading `Explore Our Catio Projects`; CMS-driven curated featured projects from `CatioProjects`. Desktop large imagery; mobile stack/carousel. Real images and their verified caption/details only; link to each project's preserved page and eventually the new dynamic page. Place `I Want a Catio Like This` action on project detail view, carrying the project's `cmsId`.
4. **How It Works**: three steps `Tell Us About Your Space`, `Design Your Catio`, `We Build It`. Design review and booking are not automatically guaranteed.
5. **Built with Quality & Care**: documented cedar construction, black PVC-coated 14 ga 1x1 welded wire, roofing choices, removable/freestanding philosophy when relevant; avoid one-size-fits-all engineering guarantees. Use real build detail shots.
6. **Client testimonials**: ONLY real, verified and client-approved review text and attribution. The example mockup contains generated placeholder testimonials; **never publish those as real reviews**.
7. **DIY Plans + Resources**: important existing business and SEO links. Include paths or sections to DIY Plans, wire mesh, flooring, roofing, accessories, guides, blog. Do not delete existing SEO landing pages.
8. **About Us**: husband-and-wife small builder story, authentic company images, real regional service area.
9. **Final CTA**: `Ready for a Catio of Your Own?` + `Get a Free Estimate`.
10. **Footer**: original verified policies/contact links, service area, accessibility and privacy.

## Implementation constraints

- Must be implemented within the existing Wix Editor draft rather than replacing it with headless or publishing a new site.
- Wix CMS already contains 24 imported projects under `CatioProjects`, with `featured` and `published` fields (custom fields, not a substitute for Wix publishing/access controls).
- CMS dynamic project pages and visually rebuilding homepage still require Wix Editor UI; REST CMS editing cannot directly place text or sections in classic editor.
- Keep project titles / descriptions source-grounded, and do not assume all projects have permission to publish testimonials.
- Quicksand/Manrope font decisions and the homepage order are owner-approved. Desktop and mobile require visual QA before publishing.

## Acceptance criteria

- Typography uses Quicksand for headings and Manrope for body.
- Paw with thin horizontal lines appears only as an intentional separator between select major sections.
- Homepage hero and cards show genuine company photographs with individually verified alt text.
- Featured project cards are CMS-connected and open valid detail views; no dead-end CTAs.
- Mobile layout readable and accessible, with optimized images.
- Site remains a **draft**. Explicit owner signoff before publishing or domain cutover.
