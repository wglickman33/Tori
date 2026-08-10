import { Link } from "react-router-dom";
import { AppShell } from "../components/layout/AppShell";
import { WhiskCrossLink } from "../components/ui/WhiskCrossLink";
import "./HelpPage.scss";

const FEATURES = [
  {
    title: "Households",
    body: "Create a household or join with an invite code. Inventory is shared with every member in real time.",
    to: "/household",
  },
  {
    title: "Inventory",
    body: "Folders and items (including independent items), tags, photos, edit, and delete with confirmation.",
    to: "/inventory",
  },
  {
    title: "Search",
    body: "Filter by folder, name, tag, and price. Filters combine with AND.",
    to: "/search",
  },
  {
    title: "Tags",
    body: "Rename or remove a tag across every item that uses it.",
    to: "/tags",
  },
  {
    title: "Expiring",
    body: "See items at or past your warning window. Set “warn me N days before” on that page.",
    to: "/expiring",
  },
  {
    title: "Dashboard",
    body: "Folder/item counts, total quantity, value (skips items without price), and expiring-soon count. Export CSV from here or Inventory.",
    to: "/dashboard",
  },
  {
    title: "Settings",
    body: "Update display name, email, password, appearance, and delete your account.",
    to: "/settings",
  },
  {
    title: "Password reset",
    body: "Use Forgot password on the login page to email a one-hour reset link.",
    to: "/forgot-password",
  },
] as const;

export default function HelpPage() {
  return (
    <AppShell>
      <div className="help-page">
        <header className="help-page__header">
          <h1>Help</h1>
          <p>What Tori ships today — nothing speculative.</p>
        </header>

        <ul className="help-page__list">
          {FEATURES.map((feature) => (
            <li key={feature.title}>
              <h2>{feature.title}</h2>
              <p>{feature.body}</p>
              <Link to={feature.to}>Open {feature.title}</Link>
            </li>
          ))}
        </ul>

        <section className="help-page__notes">
          <h2>Also good to know</h2>
          <ul>
            <li>Changes sync live to household members over SSE — no refresh needed.</li>
            <li>CSV export includes names, folders, locations, quantities, prices, dates, tags, and image URLs.</li>
            <li>Item photos: one image each, JPEG/PNG/WebP, max 5MB.</li>
            <li>Whisk is a separate app for recipes and shopping lists. Accounts are not shared.</li>
          </ul>
        </section>

        <WhiskCrossLink />
      </div>
    </AppShell>
  );
}
