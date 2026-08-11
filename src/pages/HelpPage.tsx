import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { WhiskCrossLink } from "../components/ui/WhiskCrossLink";
import "./HelpPage.scss";

type FeatureArea = {
  title: string;
  body: string;
  to: string;
  group: "everyday" | "organize" | "watch" | "account";
};

const FEATURE_GROUPS: { id: FeatureArea["group"]; label: string }[] = [
  { id: "everyday", label: "Everyday" },
  { id: "organize", label: "Organize" },
  { id: "watch", label: "Watch" },
  { id: "account", label: "Account" },
];

const FEATURES: FeatureArea[] = [
  {
    group: "everyday",
    title: "Dashboard",
    body: "Attention list, data gaps, KPIs, category/tag/location snapshots, recent items, household pulse, and import/export. Recorded value links to Value.",
    to: "/dashboard",
  },
  {
    group: "everyday",
    title: "Inventory",
    body: "Folders and items (including independent items), tags, photos, edit, move, delete, plus import/export.",
    to: "/inventory",
  },
  {
    group: "everyday",
    title: "Search",
    body: "Live free-text search across name, tags, location, and folder, plus filters for folder, tags, category, location, price, expiration, and photos. Results update as you type.",
    to: "/search",
  },
  {
    group: "organize",
    title: "Tags",
    body: "Browse tags as a chip cloud, jump into Search, rename or delete across items, and merge near-duplicates when suggested (for example Bottle and Bottles).",
    to: "/tags",
  },
  {
    group: "organize",
    title: "Locations",
    body: "Add, edit, or delete the household location list used in the item form. Edit renames it on every item; Delete removes it from the list and clears it from items.",
    to: "/locations",
  },
  {
    group: "watch",
    title: "Expiring",
    body: "See items at or past your warning window. Set “Warn me __ days before” on that page.",
    to: "/expiring",
  },
  {
    group: "watch",
    title: "Value",
    body: "Recorded inventory worth (unit price × quantity), price coverage, missing-price list, and breakdowns by folder, category, and location.",
    to: "/value",
  },
  {
    group: "account",
    title: "Household",
    body: "Rename your household, share or regenerate an invite code, manage members, and leave or dissolve when needed.",
    to: "/household",
  },
  {
    group: "account",
    title: "Settings",
    body: "Update display name, email, password, appearance, and delete your account.",
    to: "/settings",
  },
  {
    group: "account",
    title: "Password reset",
    body: "Use Forgot password on the login page to email a one-hour reset link.",
    to: "/forgot-password",
  },
];

const FAQ: { question: string; answer: string }[] = [
  {
    question: "How do I invite someone?",
    answer:
      "Open Household, copy the invite code, and share it. They create a Tori account (or sign in), then join with that code on onboarding. Only the owner can regenerate the code.",
  },
  {
    question: "What does recorded value mean?",
    answer:
      "Each priced item contributes unit price × quantity. Items without a price are listed but left out of the total. Value shows coverage and breakdowns by folder, category, and location.",
  },
  {
    question: "What happens if I leave or dissolve?",
    answer:
      "Members can leave anytime and lose access until invited again. Owners with other members must remove them first. If you are the only member, leaving dissolves the household and its inventory.",
  },
  {
    question: "What can I import or export?",
    answer:
      "Import Tori JSON (.tori.json) or CSV. Export supports Tori JSON, CSV, plain text, and a landscape PDF report with summary, value, and per-folder tables.",
  },
  {
    question: "Are photos required? What are the limits?",
    answer:
      "Photos are optional. One image per item, JPEG/PNG/WebP, max 5MB.",
  },
  {
    question: "Is Whisk the same login?",
    answer:
      "No. Whisk is a separate app for recipes and shopping lists. Accounts are not shared with Tori.",
  },
];

const START_STEPS = [
  "Create a household or join with an invite code.",
  "Add folders and items, or import a Tori JSON or CSV file.",
  "Use Search, Expiring, and Value as you go.",
  "Invite others from Household when you are ready.",
];

const NOTES = [
  "Changes sync live to household members over SSE; no refresh needed.",
  "CSV export includes names, folders, locations, quantities, prices, dates, tags, and image URLs.",
  "Item photos: one image each, JPEG/PNG/WebP, max 5MB.",
  "Whisk is a separate app for recipes and shopping lists. Accounts are not shared.",
];

function matchesQuery(haystack: string, query: string): boolean {
  if (!query) return true;
  return haystack.toLowerCase().includes(query);
}

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<Record<string, boolean>>({});

  const normalized = query.trim().toLowerCase();

  const filteredFeatures = useMemo(
    () =>
      FEATURES.filter((feature) =>
        matchesQuery(`${feature.title} ${feature.body} ${feature.group}`, normalized)
      ),
    [normalized]
  );

  const filteredFaq = useMemo(
    () =>
      FAQ.filter((item) => matchesQuery(`${item.question} ${item.answer}`, normalized)),
    [normalized]
  );

  const toggleFaq = (question: string) => {
    setOpenFaq((prev) => ({ ...prev, [question]: !prev[question] }));
  };

  return (
    <AppShell>
      <div className="help-page">
        <header className="help-page__header">
          <div className="help-page__heading">
            <h1>Help</h1>
            <p>How to use Tori with your household inventory.</p>
          </div>
          <label className="help-page__filter">
            <span className="help-page__sr">Filter help</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter topics…"
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                className="help-page__filter-clear"
                aria-label="Clear filter"
                onClick={() => setQuery("")}
              >
                ×
              </button>
            ) : null}
          </label>
        </header>

        {!normalized ? (
          <section className="help-page__card help-page__start" aria-labelledby="help-start-title">
            <h2 id="help-start-title">Getting started</h2>
            <ol className="help-page__steps">
              {START_STEPS.map((step, index) => (
                <li key={step}>
                  <span className="help-page__step-num" aria-hidden>
                    <span className="help-page__step-digit">{index + 1}</span>
                  </span>
                  <span className="help-page__step-text">{step}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="help-page__areas" aria-label="Feature areas">
          {FEATURE_GROUPS.map((group) => {
            const items = filteredFeatures.filter((feature) => feature.group === group.id);
            if (items.length === 0) return null;
            return (
              <div key={group.id} className="help-page__group">
                <h2 className="help-page__group-title">{group.label}</h2>
                <ul className="help-page__list">
                  {items.map((feature) => (
                    <li key={feature.title} className="help-page__card">
                      <h3>{feature.title}</h3>
                      <p>{feature.body}</p>
                      <Link to={feature.to} className="help-page__link">
                        Go to {feature.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {filteredFeatures.length === 0 ? (
            <p className="help-page__empty">No feature topics match that filter.</p>
          ) : null}
        </section>

        <section className="help-page__faq" aria-labelledby="help-faq-title">
          <h2 id="help-faq-title">FAQ</h2>
          {filteredFaq.length === 0 ? (
            <p className="help-page__empty">No FAQ answers match that filter.</p>
          ) : (
            <ul className="help-page__faq-list">
              {filteredFaq.map((item) => {
                const isOpen = Boolean(openFaq[item.question]);
                return (
                  <li key={item.question}>
                    <button
                      type="button"
                      className={`help-page__card help-page__faq-item${isOpen ? " is-open" : ""}`}
                      aria-expanded={isOpen}
                      onClick={() => toggleFaq(item.question)}
                    >
                      <span className="help-page__faq-head">
                        <span className="help-page__faq-question">{item.question}</span>
                        <span className="help-page__faq-chevron" aria-hidden>
                          {isOpen ? "−" : "+"}
                        </span>
                      </span>
                      {isOpen ? <span className="help-page__faq-answer">{item.answer}</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {!normalized ? (
          <section className="help-page__card help-page__notes" aria-labelledby="help-notes-title">
            <h2 id="help-notes-title">Also good to know</h2>
            <ul>
              {NOTES.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <WhiskCrossLink />
      </div>
    </AppShell>
  );
}
