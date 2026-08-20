import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/layout/AppShell";
import { WhiskCrossLink } from "../components/ui/WhiskCrossLink";
import "./HelpPage.scss";

type FeatureGroup = "everyday" | "organize" | "watch" | "account";

const FEATURE_GROUPS: FeatureGroup[] = ["everyday", "organize", "watch", "account"];

const FEATURES: { id: string; group: FeatureGroup; to: string }[] = [
  { id: "dashboard", group: "everyday", to: "/dashboard" },
  { id: "inventory", group: "everyday", to: "/inventory" },
  { id: "search", group: "everyday", to: "/search" },
  { id: "tags", group: "organize", to: "/tags" },
  { id: "locations", group: "organize", to: "/locations" },
  { id: "expiring", group: "watch", to: "/expiring" },
  { id: "value", group: "watch", to: "/value" },
  { id: "household", group: "account", to: "/household" },
  { id: "settings", group: "account", to: "/settings" },
  { id: "password", group: "account", to: "/forgot-password" },
];

const FAQ_IDS = ["invite", "value", "leave", "import", "photos", "whisk"] as const;
const START_STEP_KEYS = ["create", "add", "use", "invite"] as const;
const NOTE_KEYS = ["sse", "csv", "photos", "whisk"] as const;

function matchesQuery(haystack: string, query: string): boolean {
  if (!query) return true;
  return haystack.toLowerCase().includes(query);
}

export default function HelpPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<Record<string, boolean>>({});

  const normalized = query.trim().toLowerCase();

  const features = useMemo(
    () =>
      FEATURES.map((feature) => ({
        ...feature,
        title: t(`help.features.${feature.id}.title`),
        body: t(`help.features.${feature.id}.body`),
      })),
    [t]
  );

  const faq = useMemo(
    () =>
      FAQ_IDS.map((id) => ({
        id,
        question: t(`help.faqItems.${id}.question`),
        answer: t(`help.faqItems.${id}.answer`),
      })),
    [t]
  );

  const filteredFeatures = useMemo(
    () =>
      features.filter((feature) =>
        matchesQuery(
          `${feature.title} ${feature.body} ${t(`help.${feature.group}`)}`,
          normalized
        )
      ),
    [features, normalized, t]
  );

  const filteredFaq = useMemo(
    () => faq.filter((item) => matchesQuery(`${item.question} ${item.answer}`, normalized)),
    [faq, normalized]
  );

  const toggleFaq = (id: string) => {
    setOpenFaq((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <AppShell>
      <div className="help-page">
        <header className="help-page__header">
          <div className="help-page__heading">
            <h1>{t("help.title")}</h1>
            <p>{t("help.lede")}</p>
          </div>
          <label className="help-page__filter">
            <span className="help-page__sr">{t("help.filterLabel")}</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("help.filter")}
              autoComplete="off"
            />
            {query ? (
              <button
                type="button"
                className="help-page__filter-clear"
                aria-label={t("help.clearFilter")}
                onClick={() => setQuery("")}
              >
                ×
              </button>
            ) : null}
          </label>
        </header>

        {!normalized ? (
          <section className="help-page__card help-page__start" aria-labelledby="help-start-title">
            <h2 id="help-start-title">{t("help.gettingStarted")}</h2>
            <ol className="help-page__steps">
              {START_STEP_KEYS.map((key, index) => (
                <li key={key}>
                  <span className="help-page__step-num" aria-hidden>
                    <span className="help-page__step-digit">{index + 1}</span>
                  </span>
                  <span className="help-page__step-text">{t(`help.steps.${key}`)}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="help-page__areas" aria-label={t("help.featureAreas")}>
          {FEATURE_GROUPS.map((group) => {
            const items = filteredFeatures.filter((feature) => feature.group === group);
            if (items.length === 0) return null;
            return (
              <div key={group} className="help-page__group">
                <h2 className="help-page__group-title">{t(`help.${group}`)}</h2>
                <ul className="help-page__list">
                  {items.map((feature) => (
                    <li key={feature.id} className="help-page__card">
                      <h3>{feature.title}</h3>
                      <p>{feature.body}</p>
                      <Link to={feature.to} className="help-page__link">
                        {t("help.goTo", { title: feature.title })}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {filteredFeatures.length === 0 ? (
            <p className="help-page__empty">{t("help.noFeatures")}</p>
          ) : null}
        </section>

        <section className="help-page__faq" aria-labelledby="help-faq-title">
          <h2 id="help-faq-title">{t("help.faq")}</h2>
          {filteredFaq.length === 0 ? (
            <p className="help-page__empty">{t("help.noFaq")}</p>
          ) : (
            <ul className="help-page__faq-list">
              {filteredFaq.map((item) => {
                const isOpen = Boolean(openFaq[item.id]);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={`help-page__card help-page__faq-item${isOpen ? " is-open" : ""}`}
                      aria-expanded={isOpen}
                      onClick={() => toggleFaq(item.id)}
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
            <h2 id="help-notes-title">{t("help.also")}</h2>
            <ul>
              {NOTE_KEYS.map((key) => (
                <li key={key}>{t(`help.notes.${key}`)}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <WhiskCrossLink />
      </div>
    </AppShell>
  );
}
