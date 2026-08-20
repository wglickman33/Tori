import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AppShell } from "../components/layout/AppShell";
import { ToriChatPane } from "../components/tori/ToriChatPane";
import { useToriStore } from "../store/toriStore";
import {
  summarizeToriInput,
  summarizeToriOutput,
  toriToolLabel,
} from "../utils/toriTrace";
import "./ToriAiPage.scss";

export default function ToriAiPage() {
  const { t } = useTranslation();
  const closeWidget = useToriStore((s) => s.closeWidget);
  const sending = useToriStore((s) => s.sending);
  const traceSteps = useToriStore((s) => s.traceSteps);
  const traceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeWidget();
  }, [closeWidget]);

  useEffect(() => {
    traceRef.current?.scrollTo({ top: traceRef.current.scrollHeight });
  }, [traceSteps]);

  return (
    <AppShell>
      <div className="tori-ai-page">
        <header className="tori-ai-page__header">
          <h1>{t("ai.title")}</h1>
          <p>{t("ai.pageSubtitle")}</p>
        </header>

        <div className="tori-ai-page__workspace">
          <div className="tori-ai-page__chat">
            <ToriChatPane variant="page" inputId="tori-ai-message" />
          </div>

          <aside className="tori-ai-page__trace" aria-label={t("ai.lookupsAria")}>
            <div className="tori-ai-page__trace-head">
              <h2>{t("ai.lookups")}</h2>
              <p>{t("ai.lookupsSubtitle")}</p>
            </div>
            <div className="tori-ai-page__trace-body" ref={traceRef} aria-live="polite">
              {traceSteps.length === 0 ? (
                <p className="tori-ai-page__trace-empty">
                  {sending ? t("ai.startingLookup") : t("ai.lookupsEmpty")}
                </p>
              ) : (
                <ol className="tori-ai-page__steps">
                  {traceSteps.map((step) => {
                    const detail =
                      step.status === "done"
                        ? summarizeToriOutput(step.name, step.output)
                        : summarizeToriInput(step.name, step.input);
                    return (
                      <li
                        key={step.id}
                        className={`tori-ai-page__step${
                          step.status === "running" ? " tori-ai-page__step--running" : ""
                        }`}
                      >
                        <p className="tori-ai-page__step-label">{toriToolLabel(step.name)}</p>
                        {detail ? <p className="tori-ai-page__step-detail">{detail}</p> : null}
                        {step.status === "running" ? (
                          <p className="tori-ai-page__step-status">{t("ai.working")}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
