#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const metros = ["Portland OR","Austin TX","Denver CO","Charlotte NC","Phoenix AZ","Nashville TN","Sacramento CA","Pittsburgh PA","Tampa FL","Minneapolis MN","Salt Lake City UT","Raleigh NC","Kansas City MO","Richmond VA","Boise ID","Columbus OH","San Diego CA","Milwaukee WI","Boston MA","Atlanta GA"];
const roles = [
  ["Painting Contractor","manual quotes and follow-up","QuickBooks + Jobber"],
  ["Commercial Project Manager","vendor coordination and change orders","Procore + Outlook"],
  ["Fractional Bookkeeper","receipt chasing and month-end close","Xero + Dext"],
  ["Restaurant Owner","supplier invoices and staff coverage","Toast + 7shifts"],
  ["SaaS Founder","support triage and billing operations","Stripe + Slack + Linear"],
  ["HVAC Owner","dispatch overflow and maintenance reminders","ServiceTitan"],
  ["Electrical Contractor","change orders and permit paperwork","Housecall Pro"],
  ["Tax Practice Owner","document collection and extension tracking","Drake + Canopy"],
  ["Property Manager","tenant intake and vendor scheduling","Buildium"],
  ["Marketing Agency Founder","lead qualification and client reporting","HubSpot + ClickUp"],
  ["Roofing Contractor","claim paperwork and estimate follow-up","Roofr + AccuLynx"],
  ["Cafe Operator","supplier substitutions and shift gaps","Square + Homebase"],
  ["Plumbing Contractor","after-hours intake and dispatch","ServiceTitan"],
  ["E-commerce Owner","tracking questions and returns","Shopify + Gorgias"],
  ["Flooring Contractor","material selections and scheduling","QuickBooks + MeasureSquare"],
  ["Civil PM","subcontractor intake and RFI tracking","AutoCAD + Procore"],
  ["Payroll Consultant","compliance reminders and data cleanup","Gusto + Excel"],
  ["Landscape Contractor","quote revisions and crew coordination","Jobber + CompanyCam"],
  ["Commercial GC","scope alignment and subcontractor follow-up","Sage 300 + Procore"],
  ["Bakery Owner","custom order follow-up and purchasing","Square + Google Workspace"]
];
const families = ["Married, 2 kids","Divorced, adult child","Married, newborn","Single, no kids","Partnered, no kids","Married, 3 kids","Married, teenagers","Married, adult kids","Single parent, 1 child","Married, 2 kids","Engaged","Married, empty nest","Married, 2 kids","Single","Married, 1 child","Married, 3 adult kids","Married, newborn","Married, 2 kids","Single","Married, grandkids"];
const pets = ["Golden Retriever","German Shepherd","2 cats","French Bulldog","Labradoodle","None","Boxer","Pug","Corgi","Australian Shepherd","Siberian Husky","2 Poodles","Rottweiler","Tabby Cat","Border Collie","Labrador","Chihuahua","Beagle","Great Dane","Yellow Lab"];
const properties = ["suburban single-family","urban condo","townhouse","rural acreage","small-city bungalow","downtown loft","split-level home","historic rowhouse","planned-community home","duplex unit"];
const music = ["90s Grunge","Classic Rock","Indie Folk","Lo-Fi Hip Hop","Synthwave","Outlaw Country","80s Metal","Classical Piano","Modern Pop","90s Hip Hop","Alt Rock","Jazz Standards","70s Funk","Ambient Electronic","Bluegrass","Classic Country","Hyperpop","90s R&B","Dream Pop","60s Soul"];
const colors = ["Forest Green","Navy Blue","Sage Green","Charcoal","Neon Orange","Crimson","Steel Gray","Burgundy","Sky Blue","Teal","Matte Black","Cream/Gold","Earth Brown","Minimal White","Warm Ochre","Olive","Electric Pink","Terracotta","Lavender","Khaki"];
const vehicles = ["half-ton pickup","three-row SUV","hybrid sedan","cargo van","electric crossover","work truck + trailer","compact pickup","luxury sedan","minivan","older 4x4","roof-rack SUV","small delivery van","diesel pickup","city hatchback","crew-cab truck","full-size SUV","electric sedan","compact SUV","fleet van","classic truck"];
const hobbies = ["carpentry","restoring old trucks","baking","vinyl collecting","triathlon training","bass fishing","smoking barbecue","gardening","amusement parks","surfing","snowboarding","wine tasting","overlanding","photography","hiking","hunting","video gaming","mountain biking","pottery","golf"];
const familyEvents = ["a child's game","dinner with family","a quiet morning","a planned date night","time with friends","a school event","a weekend trip","an evening workout","a community event","a family visit"];
const frictionTemplates = [
  (event, gridlock) => `Missing ${event} because ${gridlock} spills into the evening`,
  (_, gridlock, hobby) => `Starting the weekend by clearing ${gridlock} instead of ${hobby}`,
  (_, gridlock, hobby) => `Checking the phone during ${hobby} because ${gridlock} has no reliable owner`,
  (_, gridlock) => `Losing sleep over whether ${gridlock} will create a customer-facing mistake`,
  (_, gridlock) => `Turning down new work because ${gridlock} consumes the remaining operating capacity`
];

const matrix = [["slice_id","demographics","professional_matrix","domestic_family_array","cultural_aesthetic_markers","core_emotional_friction","target_variant_slug"]];

for (let i = 0; i < 100; i += 1) {
  const roleIndex = i % roles.length;
  const cycle = Math.floor(i / roles.length);
  const [role, gridlock, stack] = roles[roleIndex];
  const age = 30 + ((i * 7 + cycle * 3) % 31);
  const rawNetWorth = 550000 + ((i * 137000 + cycle * 53000) % 1450001);
  const netWorth = Math.min(2000000, Math.max(550000, Math.round(rawNetWorth / 10000) * 10000));
  const homes = (i + cycle) % 2;
  const family = families[(i * 3 + cycle) % families.length];
  const pet = pets[(i * 7 + 2 * cycle) % pets.length];
  const property = properties[(i * 5 + cycle) % properties.length];
  const musicValue = music[(i * 11 + cycle) % music.length];
  const color = colors[(i * 13 + cycle) % colors.length];
  const vehicle = vehicles[(i * 17 + cycle) % vehicles.length];
  const hobby = hobbies[(i * 19 + cycle) % hobbies.length];
  const metro = metros[(i * 9 + cycle) % metros.length];
  const familyEvent = familyEvents[(i * 3 + cycle) % familyEvents.length];
  const friction = frictionTemplates[i % frictionTemplates.length](familyEvent, gridlock, hobby);
  const slug = `${role.toLowerCase().replaceAll(" ", "-").replaceAll("/", "-")}-${gridlock.split(" ")[0]}-${hobby.replaceAll(" ", "-")}-${String(i + 1).padStart(3, "0")}`;

  matrix.push([
    `SLICE-${String(i + 1).padStart(3, "0")}`,
    { age, nw: netWorth, homes, metro },
    { role, gridlock, stack, activation: "plain-text<2m", api_keys_required: false },
    { family, pets: pet, property },
    { music: musicValue, color, vehicle, hobby },
    friction,
    slug
  ]);
}

if (matrix.length !== 101) throw new Error(`Expected header + 100 entries, got ${matrix.length}`);
const ids = new Set();
const slugs = new Set();
for (const row of matrix.slice(1)) {
  if (row[1].age < 30 || row[1].age > 60) throw new Error(`Age out of range: ${row[0]}`);
  if (row[1].nw < 550000 || row[1].nw > 2000000) throw new Error(`Net worth out of range: ${row[0]}`);
  if (row[1].homes >= 2) throw new Error(`Home count out of range: ${row[0]}`);
  if (row[2].activation !== "plain-text<2m" || row[2].api_keys_required !== false) throw new Error(`Activation constraint failed: ${row[0]}`);
  if (ids.has(row[0])) throw new Error(`Duplicate slice ID: ${row[0]}`);
  if (slugs.has(row[6])) throw new Error(`Duplicate target slug: ${row[6]}`);
  ids.add(row[0]);
  slugs.add(row[6]);
}

const output = `toon${JSON.stringify(matrix)}\n`;
const destination = resolve(process.argv[2] ?? new URL("../fixtures/synthetic-persona-matrix.toon", import.meta.url).pathname);
mkdirSync(dirname(destination), { recursive: true });
writeFileSync(destination, output, "utf8");
console.log(`Wrote 100 deterministic synthetic entries to ${destination}`);
