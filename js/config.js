// ============================================================
//  Kliny Services - Central Configuration
//  Edit this file to update business info, prices, and keys.
// ============================================================

const CONFIG = {
  business: {
    name: "Kliny Services",
    city: "Sudbury, Ontario",
    phone: "807-709-9504",
    email: "klinyservice@gmail.com",
    whatsapp: "1807XXXXXXX",
  },

  emailjs: {
    publicKey:         "O4WOu2Su1l8Sp_NjP",
    serviceId:         "service_1fqblev",
    quoteTemplateId:   "template_rlilxnb",
    contactTemplateId: "template_du1fzzf",
  },

  sheetsUrl: "https://script.google.com/macros/s/AKfycbyhOeeQykCs4JmPhHto1jkPP6z6DQsQe7EHx17qAudzMyZ4zu_Tnd4kBr2qXIQhPA6g/exec",

  calendly: {
    weekday: "https://calendly.com/klinyservice/weekday-clean",
    weekend: "https://calendly.com/klinyservice/weekend-clean",
  },

  pricing: {
    base: {
      bachelor: 120,
      "1bed":   150,
      "2bed":  250,
      "3bed":  350,
    },
    extraBathroom: 35,
    extraHalfBath: 15,
    cleanTypeUpgrade: {
      standard:   0,
      deep:      120,
      moveinout: 130,
      party:     125,
      airbnb:    120,
      postreno:  220,
    },
    // Simple fixed-price add-ons
    addons: {
      oven:    35,
      fridge:  30,
      windows: 30,
    },
  },

  // Quantity add-ons: client picks a count (0 = not selected). Price is per unit.
  quantityAddons: [
    {
      id: "oven",
      emoji: "🔥",
      label: "Oven Cleaning",
      priceEach: 35,
      unit: "oven",
      unitPlural: "ovens",
      max: 4,
      includes: "Full interior oven cleaning: racks removed, walls degreased, door scrubbed",
    },
    {
      id: "fridge",
      emoji: "❄️",
      label: "Fridge Cleaning",
      priceEach: 30,
      unit: "fridge",
      unitPlural: "fridges",
      max: 4,
      includes: "Full interior fridge cleaning: shelves removed and washed, walls wiped, door seals cleaned",
    },
    {
      id: "windows",
      emoji: "🪟",
      label: "Interior Windows",
      priceEach: 5,
      unit: "window",
      unitPlural: "windows",
      max: 30,
      includes: "Interior window glass cleaned, sill wiped, frame dusted — per accessible window",
    },
  ],

  // Tiered add-ons: client picks one tier (or none). Each tier has a fixed price or null for custom quote.
  tieredAddons: [
    {
      id: "walls",
      emoji: "🖌️",
      label: "Wall Cleaning",
      tiers: [
        { id: "walls_spots",    label: "Spot cleaning",          price: 25,  desc: "Small marks/spots in several areas" },
        { id: "walls_1room",    label: "1 room",                 price: 40,  desc: "Wiping/washing accessible walls in one room" },
        { id: "walls_multi",    label: "Multiple rooms",         price: null, perExtra: 30, desc: "$30 per room — ask for exact count at booking" },
      ],
    },
    {
      id: "dishes",
      emoji: "🍽️",
      label: "Dishes",
      tiers: [
        { id: "dishes_one",     label: "One sink load",          price: 25,  desc: "One sink/load of ordinary dishes" },
        { id: "dishes_large",   label: "Large amount",           price: 35,  desc: "Multiple loads or significant buildup" },
      ],
    },
    {
      id: "laundry",
      emoji: "🧺",
      label: "Laundry",
      tiers: [
        { id: "laundry_1",      label: "1 load",                 price: 30,  desc: "1 standard load washed and folded (client provides detergent)" },
        { id: "laundry_2",      label: "2 loads",                price: 50,  desc: "2 loads washed and folded" },
        { id: "laundry_3plus",  label: "3+ loads",               price: null, desc: "Contact us for a custom quote on 3 or more loads" },
      ],
    },
    {
      id: "garage",
      emoji: "🏚️",
      label: "Garage",
      tiers: [
        { id: "garage_light",   label: "Light cleaning",         price: 90,  desc: "Sweep/vacuum + basic surface cleaning" },
        { id: "garage_heavy",   label: "Heavy cleaning",         price: null, desc: "Significant dirt, debris, or clutter — custom quote" },
      ],
    },
    {
      id: "basement",
      emoji: "🪜",
      label: "Basement",
      tiers: [
        { id: "basement_light", label: "Light cleaning",         price: 90,  desc: "Vacuum/sweep + basic surface cleaning" },
        { id: "basement_heavy", label: "Larger / heavier",       price: null, range: "$75–$125+", desc: "Depending on size and condition — custom quote" },
      ],
    },
  ],

  // What is included in each clean type (shown to client as their agreement)
  serviceIncludes: {
    standard: [
      "Kitchen surfaces wiped down",
      "Bathroom cleaning (toilet, sink, tub/shower)",
      "Dusting (furniture, shelves, ceiling fans)",
      "Vacuuming all carpeted areas",
      "Mopping hard floors",
      "Bedroom tidying and surfaces",
      "Living area cleaning",
      "Garbage removal",
    ],
    deep: [
      "Everything in Standard Clean",
      "Baseboard and trim cleaning",
      "Inside cabinet and drawer wipe-down",
      "Behind and under appliances",
      "Light fixture and vent cleaning",
      "Detailed bathroom scrub (grout, tiles)",
      "Window sills and frames",
      "Door handles and light switches sanitized",
    ],
    moveinout: [
      "Everything in Deep Clean",
      "Inside all closets and storage spaces",
      "Inside oven (basic wipe-down)",
      "Inside fridge (basic wipe-down)",
      "All walls spot-checked and wiped",
      "Garage sweep (if applicable)",
      "Full kitchen appliance exterior clean",
      "All floors deep-cleaned and mopped",
    ],
    party: [
      "Everything in Standard Clean",
      "Garbage and recycling removal",
      "Surface wipe-down in all areas",
      "Bathroom deep sanitizing",
      "Kitchen cleanup and degreasing",
      "Spot-clean floors and spills",
      "Outdoor area tidy (if applicable)",
    ],
    airbnb: [
      "Full Standard Clean throughout",
      "Linen and towel change (fresh set supplied by host)",
      "Bathroom restock check",
      "Kitchen reset and dish check",
      "Trash removal and bag replacement",
      "Vacuum and mop all areas",
      "Welcome presentation reset",
    ],
    postreno: [
      "Construction dust removal from all surfaces",
      "Vent and duct wipe-down",
      "Window and frame cleaning",
      "All floors swept, vacuumed, and mopped",
      "Bathroom deep clean post-construction",
      "Kitchen surfaces and cabinets wiped",
      "Debris and waste removal",
      "Final inspection wipe-down",
    ],
  },

  // Frequency options
  frequency: [
    { id: "onetime",  label: "One-time",                       discountPct: 0  },
    { id: "weekly",   label: "Weekly (7% discount applied)",   discountPct: 7  },
    { id: "biweekly", label: "Bi-weekly (5% discount applied)", discountPct: 5 },
    { id: "monthly",  label: "Monthly",                        discountPct: 0  },
  ],

  availability: {
    weekday:  { label: "Mon - Fri",  hours: "4:00 PM - 8:00 PM" },
    saturday: { label: "Saturday",   hours: "9:00 AM - 5:00 PM" },
    sunday:   { label: "Sunday",     hours: "9:00 AM - 3:00 PM" },
  },

  quote: {
    validDays:  7,
    footerNote: "Prices may be adjusted based on property condition upon arrival.",
    disclaimer: "Prices are based on standard cleaning conditions and the services selected above. Additional charges may apply for cleaning requirements outside the selected services or significantly heavier-than-standard conditions (e.g. excessive pet hair, heavy grease, or significant dirt buildup). We will always inform you and get your approval before starting any additional work.",
  },
};
