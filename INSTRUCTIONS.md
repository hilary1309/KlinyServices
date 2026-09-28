# Kliny Services - Setup Instructions

## What You Have

```
KlinyServices/
  index.html         ← Full website (Home, Quote, Contact)
  css/style.css      ← All styling
  js/config.js       ← ALL your settings live here (edit this!)
  js/app.js          ← App logic (rarely needs editing)
  INSTRUCTIONS.md    ← This file
```

---

## Quick Start: Making Changes

**Everything you need to update regularly lives in `js/config.js`:**

- Business name, city, phone, email
- Prices (base rates, add-ons, clean type upgrades)
- Frequency discounts
- EmailJS keys
- Calendly URLs

You should almost never need to touch `app.js` or the HTML.

---

## Step 1: Set Up EmailJS (Free Email Notifications)

1. Go to [emailjs.com](https://www.emailjs.com) and create a free account
2. Add an **Email Service** (connect your Gmail) - copy the **Service ID**
3. Create two **Email Templates**:

   **Template 1 - Quote Notification (to you)**
   Subject: `New Quote - {{name}} - {{quoteId}}`
   Body:
   ```
   New booking request from {{name}}
   Phone: {{phone}}
   Email: {{email}}
   Address: {{address}}

   Unit: {{unitType}}
   Clean Type: {{cleanType}}
   Bathrooms: {{bathrooms}}
   Floors: {{floors}}
   Frequency: {{frequency}}
   Add-ons: {{addons}}

   Subtotal: {{subtotal}}
   Discount: {{discount}}
   Total: {{total}}

   Notes: {{notes}}
   Quote ID: {{quoteId}}
   Valid Until: {{validUntil}}
   ```

   **Template 2 - Contact Form**
   Subject: `New message from {{name}}`
   Body: `From: {{name}} ({{email}})\n\n{{message}}`

4. Go to **Account > API Keys** and copy your **Public Key**

5. Open `js/config.js` and fill in:
   ```js
   emailjs: {
     publicKey:         "paste_public_key_here",
     serviceId:         "paste_service_id_here",
     quoteTemplateId:   "paste_quote_template_id_here",
     contactTemplateId: "paste_contact_template_id_here",
   },
   ```

---

## Step 2: Set Up Calendly (Free Scheduling)

### Option A: One Calendar (Simpler)
1. Create a free account at [calendly.com](https://calendly.com)
2. Create **two event types**:
   - "Weekday Cleaning" - set availability Mon-Fri 4pm-8pm
   - "Weekend Cleaning" - set availability Sat 9am-5pm, Sun 9am-3pm
3. Copy the event URLs and paste into `js/config.js`:
   ```js
   calendly: {
     weekday: "https://calendly.com/YOUR_USERNAME/weekday-cleaning",
     weekend: "https://calendly.com/YOUR_USERNAME/weekend-cleaning",
   },
   ```
4. Connect your Google Calendar under Calendly settings to prevent double-booking

### Option B: Two Calendars (Prevents Overlap)
- Create two separate Calendly accounts (you + your housemate)
- Both sync to the SAME shared Google Calendar
- Each account checks that calendar for conflicts automatically
- Use one account's weekday URL and the other's weekend URL, or split however works

---

## Step 3: Deploy to Netlify (Free Hosting)

1. Go to [netlify.com](https://netlify.com) and sign up free
2. Drag and drop your entire `KlinyServices/` folder onto the Netlify dashboard
3. Your site goes live instantly with a URL like `https://klinyservices.netlify.app`
4. Optional: Add a custom domain name in Netlify settings

**Or use Vercel:**
1. Push the folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com), connect GitHub, import the repo
3. Click Deploy

---

## Step 4: Google Sheets CRM with Zapier (Free Bookkeeping)

This automatically adds every quote submission to a Google Sheet so you have a record of all bookings.

### Setup:
1. Create a Google Sheet with these column headers:
   ```
   Quote ID | Date | Name | Phone | Email | Address | Unit | Clean Type | Frequency | Bathrooms | Add-ons | Total | Notes | Status
   ```
2. In the **Status** column, add a dropdown (Data > Data validation): 
   `Pending, Confirmed, In Progress, Done, Paid, Cancelled, Rescheduled`

3. Go to [zapier.com](https://zapier.com) - free account allows 100 tasks/month

4. Create a Zap:
   - **Trigger:** Gmail - New Email matching subject "New Quote -"
   - **Action:** Google Sheets - Create Spreadsheet Row
   - Map the email fields to your columns using Gmail's parsed body

5. Every time someone submits a quote, it auto-populates a new row.

### Managing Jobs:
- Update the **Status** column as jobs progress
- Filter/sort by date, status, clean type
- Add notes in a separate "Internal Notes" column
- You can also use Google Sheets' color-coding for visual tracking

---

## How to Change Prices

Open `js/config.js` and find the `pricing` section:

```js
pricing: {
  base: {
    bachelor: 70,   // bachelor/studio base price
    "1bed":   90,   // 1 bedroom base price
    "2bed":  110,   // 2 bedroom base price
    "3bed":  130,   // 3 bedroom base price
  },
  extraBathroom: 35,  // per extra bathroom beyond 1
  cleanTypeUpgrade: {
    standard:   0,   // no extra charge
    deep:      50,   // +$50
    moveinout: 80,   // +$80
    party:     40,   // +$40
    airbnb:    45,   // +$45
    postreno:  90,   // +$90
  },
  addons: {
    oven:    20,
    fridge:  20,
    windows: 30,
    walls:   25,
    laundry: 30,
    garage:  40,
  },
},
```

Change any number and save - the website updates automatically.

---

## How to Change Frequency Discounts

```js
frequency: [
  { id: "onetime",  label: "One-time",                      discountPct: 0  },
  { id: "weekly",   label: "Weekly (7% discount applied)",   discountPct: 7  },
  { id: "biweekly", label: "Bi-weekly (5% discount applied)",discountPct: 5  },
  { id: "monthly",  label: "Monthly",                        discountPct: 0  },
],
```

Change `discountPct` to adjust the percentage off. Set to `0` for no discount.

---

## How to Change Business Info

```js
business: {
  name:     "Kliny Services",
  city:     "Sudbury, Ontario",
  phone:    "807-XXX-XXXX",   // update with your real number
  email:    "emailaddress",
  whatsapp: "1807XXXXXXX",    // country code + number, no symbols
},
```

---

## Calendly Availability Tips

- Set **buffer time** between events (30-45 min) so you can travel between jobs
- Set **minimum scheduling notice** to 24-48 hours so clients can't book same day
- Use **event duration** to match your cleaning time estimates:
  - Standard clean: 2-3 hours
  - Deep clean: 3-4 hours
  - Move-in/out: 3-5 hours
  - Airbnb turnover: 1.5-2 hours
  - Post-renovation: 4-5 hours

---

## File Sizes

- index.html: ~14 KB
- style.css:  ~9 KB
- app.js:     ~8 KB
- config.js:  ~1 KB

Total: under 35 KB (extremely fast to load)
