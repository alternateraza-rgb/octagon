// Industry landing pages at /templates/<industry>, each aimed at a "<industry> website template"
// search: what that kind of business needs from its site, and the templates built for it.
export type Industry = {
  slug: string;
  // "Restaurants", and "restaurant" as used in "restaurant website template".
  name: string;
  noun: string;
  description: string;
  intro: string;
  needs: [title: string, body: string][];
  selling: string;
  templates: string[];
};

export const INDUSTRIES: Industry[] = [
  {
    slug: "restaurants",
    name: "Restaurants",
    noun: "restaurant",
    description:
      "Restaurant website templates built with AI: menus, reservations, private dining and opening hours. Customize one in minutes, host it, and sell it to a local restaurant.",
    intro:
      "Most people decide where to eat on their phone, in under a minute. A restaurant website has to show the food, the menu and the hours fast — and make booking a table effortless.",
    needs: [
      ["A menu people can read on a phone", "Real text, not a PDF — so it loads fast, reads well on mobile and shows up when people search for a dish."],
      ["Reservations above the fold", "A clear “Book a table” button in the first screen, linked to the booking tool the restaurant already uses."],
      ["Hours, address and parking", "The questions every guest asks, answered on every page, with a map and a tap-to-call number."],
      ["Private dining and events", "A page for group bookings and parties, which are often the most valuable enquiries a restaurant gets."],
      ["The story behind the kitchen", "Who cooks, where the recipes came from, why it's worth the trip. It's what makes a local place feel like theirs."],
    ],
    selling:
      "Plenty of independent restaurants still run on a Facebook page or a site from ten years ago. Octa Agents can find the ones near you with no website, build each one a demo using their real name, hours and reviews, and let you open the conversation with a finished site.",
    templates: ["nonnas-table", "common-grounds"],
  },
  {
    slug: "cafes",
    name: "Cafés",
    noun: "coffee shop",
    description:
      "Coffee shop and café website templates built with AI: menus, locations, order-ahead and wholesale. Customize one in minutes, host it, and sell it to a local café.",
    intro:
      "A café's website works hardest in the morning: people want the menu, the nearest location and a way to order ahead before they're out the door.",
    needs: [
      ["Coffee and kitchen menus", "What's on today, what's seasonal and what it costs, in text that stays easy to update."],
      ["Order ahead", "A prominent link to the ordering app the café uses, so the site sends real orders."],
      ["Every location and its hours", "One page per location, or one clear list, with maps and hours that match Google."],
      ["Beans and wholesale", "For roasters, a shop for bags of coffee and a wholesale form for offices and restaurants."],
      ["A sense of the place", "Photos of the room and the people, so it feels like somewhere worth sitting down."],
    ],
    selling:
      "Cafés open, expand and change menus often, and most owners would rather be behind the counter than editing a website. Build them a site they can update by asking, and offer upkeep as a monthly service.",
    templates: ["common-grounds", "nonnas-table"],
  },
  {
    slug: "salons",
    name: "Salons",
    noun: "hair salon",
    description:
      "Hair salon and beauty website templates built with AI: services and prices, stylists, a gallery and online booking. Customize one in minutes, host it, and sell it to a local salon.",
    intro:
      "Salon clients buy with their eyes. A salon website should lead with the work, make prices clear and get people into the booking flow in one tap.",
    needs: [
      ["A gallery of real work", "Cuts, colour and styling from the salon itself — the single strongest reason to book."],
      ["Services with prices", "A clear menu of services and starting prices, so clients know what to expect before they book."],
      ["A page for each stylist", "Clients book people, not salons. Show each artist, their specialties and their availability."],
      ["Online booking everywhere", "A persistent “Book” button linked to the salon's booking system, on every page."],
      ["Location, hours and policies", "Parking, cancellation and deposit policies, answered up front."],
    ],
    selling:
      "Many salons rely entirely on Instagram and a booking link. A proper site with their services, prices and portfolio ranks on Google for “hair salon near me” — a clear, easy pitch.",
    templates: ["atelier-noir"],
  },
  {
    slug: "gyms",
    name: "Gyms",
    noun: "gym",
    description:
      "Gym and fitness studio website templates built with AI: classes, coaches, pricing, timetables and free trials. Customize one in minutes, host it, and sell it to a local gym.",
    intro:
      "A gym website has one job: turn curious visitors into trial sign-ups. That means clear pricing, a real timetable and a reason to walk in this week.",
    needs: [
      ["A free trial or intro offer", "A single, obvious offer — a free week or a first class — that's easy to claim."],
      ["Classes and a timetable", "What's on, when, and who it's for, so beginners can picture themselves there."],
      ["Transparent pricing", "Membership options on the page. Hidden prices are the biggest reason people bounce."],
      ["Coaches with credentials", "Faces, qualifications and specialties that build trust before the first session."],
      ["Results and community", "Member stories and photos that show the atmosphere, not just the equipment."],
    ],
    selling:
      "Independent gyms and studios compete with big chains that have polished sites. A fast, bold website with pricing and a trial offer is an easy upgrade to demo — build it with their real classes before you call.",
    templates: ["ironside"],
  },
  {
    slug: "law-firms",
    name: "Law firms",
    noun: "law firm",
    description:
      "Law firm website templates built with AI: practice areas, attorney profiles, case results and consultation forms. Customize one in minutes, host it, and sell it to a local firm.",
    intro:
      "People looking for a lawyer are often stressed and in a hurry. A law firm website needs to establish trust quickly and make the first consultation easy to request.",
    needs: [
      ["Clear practice areas", "A page per practice area, written in plain English, so clients recognise their problem."],
      ["Attorney profiles", "Photos, experience, admissions and education for each attorney."],
      ["Results and testimonials", "Representative outcomes and client quotes, within the rules that apply to legal advertising."],
      ["A free consultation form", "A short, reassuring enquiry form and a phone number on every page."],
      ["Insights and articles", "Articles that answer common questions and help the firm rank for them."],
    ],
    selling:
      "Small firms and solo practitioners often have outdated sites that don't work on phones. A modern, credible site is a high-value sale — and firms tend to pay for ongoing upkeep.",
    templates: ["kestrel-co", "harbor-dental"],
  },
  {
    slug: "dentists",
    name: "Dentists",
    noun: "dental",
    description:
      "Dental clinic website templates built with AI: treatments, the team, new patient info, insurance and online booking. Customize one in minutes, host it, and sell it to a local practice.",
    intro:
      "New patients choose a dentist on trust and convenience. A dental website should explain treatments simply, be upfront about insurance and costs, and make booking the first visit easy.",
    needs: [
      ["Treatments explained simply", "A page for each treatment — cleanings, whitening, implants, emergencies — in plain language."],
      ["New patient information", "What to expect at the first visit, forms to fill in and a clear first-visit offer."],
      ["Insurance and payment", "Accepted insurance and payment plans, so there are no surprises."],
      ["Meet the team", "Friendly photos and short bios for dentists, hygienists and front desk staff."],
      ["Book online or call", "Online booking and a tap-to-call number, always visible."],
    ],
    selling:
      "Dental practices spend heavily on patient acquisition, so a site that converts is easy to justify. Show them a finished demo with their name, services and Google reviews already in place.",
    templates: ["harbor-dental", "kestrel-co"],
  },
  {
    slug: "florists",
    name: "Florists",
    noun: "florist",
    description:
      "Florist website templates built with AI: a bouquet shop, weddings and events, and the studio story. Customize one in minutes, host it, and sell it to a local florist.",
    intro:
      "Flowers are an emotional, often last-minute purchase. A florist website needs beautiful photography, easy ordering and a strong page for weddings and events.",
    needs: [
      ["A shop of seasonal bouquets", "Clear photos, prices and delivery areas, so ordering takes a minute."],
      ["Weddings and events", "A portfolio and enquiry form for the bookings that matter most to the business."],
      ["Delivery information", "Cut-off times, delivery zones and same-day options, answered up front."],
      ["The studio's style", "The story and aesthetic that set the florist apart from a supermarket bouquet."],
      ["Subscriptions and gifts", "Weekly flowers and gift cards for repeat revenue."],
    ],
    selling:
      "Florists care about how things look, which makes a beautiful demo the pitch. Build one in their style with their photos and they can see exactly what they'd be buying.",
    templates: ["bloom-and-branch"],
  },
  {
    slug: "architects",
    name: "Architects",
    noun: "architecture",
    description:
      "Architecture and design studio website templates built with AI: project portfolios, studio pages, journals and enquiry forms. Customize one in minutes, host it, and sell it to a local studio.",
    intro:
      "For an architecture or design studio, the website is the portfolio. It should let the work speak, with restraint, and make starting a project feel considered rather than salesy.",
    needs: [
      ["A portfolio-first layout", "Large, uncluttered project imagery with the essentials: location, year and scope."],
      ["Project pages", "The brief, the approach and the result for each featured project."],
      ["The studio and its people", "Philosophy, team and awards, for clients choosing who to trust with a big commission."],
      ["A journal", "Writing about process and projects, which builds authority and search visibility."],
      ["A clear enquiry path", "A “Start a project” form that asks the right questions up front."],
    ],
    selling:
      "Small studios often have a stunning body of work and a dated website. A minimal, portfolio-led site is a straightforward, high-value project to pitch.",
    templates: ["forma"],
  },
];

// "Restaurant website templates": the phrase each landing page targets.
export const industryTitle = (i: Industry) => `${i.noun.charAt(0).toUpperCase()}${i.noun.slice(1)} website templates`;

export const getIndustry = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
