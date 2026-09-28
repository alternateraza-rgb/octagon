// Search copy for each template's page: the meta description and a short write-up shown under the
// preview. Kept out of ./index.ts, which client components import, so none of it ships to the browser.
export type TemplateCopy = {
  description: string;
  about: [string, string];
  // The industry landing page (./industries.ts) this template belongs to.
  industry: string;
};

export const TEMPLATE_COPY: Record<string, TemplateCopy> = {
  "nonnas-table": {
    description:
      "Nonna's Table is an AI-built website template for Italian restaurants, with a menu, story, private dining and reservations. Customize and sell it with Octacore.",
    about: [
      "Nonna's Table is a warm, editorial website template for Italian restaurants, trattorias and family-run kitchens. It opens on a full-bleed dining room photo with booking front and centre, then walks guests through the menu, the family story, private dining and how to visit.",
      "Describe your client's restaurant — the name, neighbourhood, dishes and hours — and Octacore rewrites every section around it. Publish in one click, connect their domain, and send a checkout link when they're ready to buy.",
    ],
    industry: "restaurants",
  },
  "atelier-noir": {
    description:
      "Atelier Noir is an AI-built website template for hair salons and beauty studios, with services, artists, a gallery and online booking. Customize and sell it with Octacore.",
    about: [
      "Atelier Noir is a dark, fashion-led website template for hair salons, colour studios and barbers. It puts the work first — a gallery of cuts and colour, a menu of services with prices, and a page for each artist — with booking always one tap away.",
      "Tell Octacore about the salon and it fills in the services, stylists and tone of voice for you. Swap photos, change colours by asking, then publish and hand the site over when the owner pays.",
    ],
    industry: "salons",
  },
  "kestrel-co": {
    description:
      "Kestrel & Co. is an AI-built website template for law firms, with practice areas, attorney profiles, case results and a free consultation form. Customize and sell it with Octacore.",
    about: [
      "Kestrel & Co. is a composed, trustworthy website template for law firms and legal practices. It leads with practice areas and a free consultation, then backs it up with attorney profiles, client testimonials, results and an insights section for articles.",
      "Describe the firm — its specialties, city and partners — and Octacore writes clear, professional copy for every page. It's a strong starting point for accountants, consultants and other professional services too.",
    ],
    industry: "law-firms",
  },
  ironside: {
    description:
      "Ironside is an AI-built website template for gyms and fitness studios, with classes, coaches, pricing, a timetable and a free trial offer. Customize and sell it with Octacore.",
    about: [
      "Ironside is a bold, high-contrast website template for strength gyms, CrossFit boxes and fitness studios. It sells the membership: classes, coaches, a weekly timetable, clear pricing and a free-week offer that turns visitors into sign-ups.",
      "Give Octacore the gym's name, city and class schedule and it builds the whole site around them. Adjust the pricing or add a page by asking in plain language, then publish to the gym's own domain.",
    ],
    industry: "gyms",
  },
  "harbor-dental": {
    description:
      "Harbor Dental is an AI-built website template for dental clinics, with treatments, the team, new patient info, insurance and online booking. Customize and sell it with Octacore.",
    about: [
      "Harbor Dental is a bright, reassuring website template for dental practices and clinics. It answers what new patients actually ask — treatments, the team, insurance and costs — and makes booking a first visit or calling the practice the obvious next step.",
      "Describe the practice and Octacore writes friendly, plain-English copy for each treatment and page. The same structure works well for physiotherapists, optometrists and other clinics.",
    ],
    industry: "dentists",
  },
  "common-grounds": {
    description:
      "Common Grounds is an AI-built website template for coffee shops and cafés, with the menu, kitchen, wholesale, locations and order-ahead. Customize and sell it with Octacore.",
    about: [
      "Common Grounds is a relaxed, modern website template for coffee shops, cafés and roasters. It covers the coffee and kitchen menus, this week's featured beans, wholesale enquiries, every location and a prominent order-ahead button.",
      "Tell Octacore about the café — its roasts, food and opening hours — and it fills in the rest. Publish in one click and give the owner a site they can keep updated just by asking.",
    ],
    industry: "cafes",
  },
  "bloom-and-branch": {
    description:
      "Bloom & Branch is an AI-built website template for florists, with a shop, weddings and events, and the studio story. Customize and sell it with Octacore.",
    about: [
      "Bloom & Branch is a soft, photographic website template for florists and flower studios. It has room for a shop of seasonal bouquets, a weddings and events page for the bigger bookings, and the story behind the studio.",
      "Describe the florist's style and services and Octacore writes the copy and arranges the pages around them. It's a natural fit for bakers, gift shops and other small makers too.",
    ],
    industry: "florists",
  },
  forma: {
    description:
      "Forma Studio is an AI-built website template for architects and design studios, with a project portfolio, studio page, journal and enquiry form. Customize and sell it with Octacore.",
    about: [
      "Forma Studio is a minimal, portfolio-first website template for architecture firms, interior designers and design studios. Large project imagery does the talking, with a studio page, a journal for writing and a clear way to start a project.",
      "Give Octacore the studio's projects and philosophy and it lays out the portfolio for you. Swap in the client's photography, publish, and connect their domain in a couple of clicks.",
    ],
    industry: "architects",
  },
};
