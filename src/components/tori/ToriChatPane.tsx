import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IconClear, IconMic, IconSend, IconStop, IconToriAi } from "../ui/SidebarIcons";
import { Button } from "../ui/Button";
import {
  getToriAiSuggestions,
  pendingActionConfirming,
  pendingActionDetails,
  pendingActionDone,
  pendingActionTitle,
  useToriStore,
  type ChatTurn,
} from "../../store/toriStore";
import { translateError } from "../../i18n/apiErrors";
import { useSettingsStore } from "../../store/settingsStore";
import { speakText, stopSpeaking } from "../../utils/speech";
import { useToriVoice } from "../../hooks/useToriVoice";
import { toastError } from "../../store/toastStore";
import { ToriMessageBody } from "./ToriMessageBody";
import { ToriItemResults } from "./ToriItemResults";
import "./ToriItemResults.scss";
import "./ToriChatPane.scss";

type ToriChatPaneProps = {
  variant: "page" | "widget";
  inputId: string;
};

function ToriPendingCard({
  message,
  index,
  confirming,
  onConfirm,
  onDismiss,
}: {
  message: Extract<ChatTurn, { role: "assistant" }>;
  index: number;
  confirming: boolean;
  onConfirm: (index: number) => void;
  onDismiss: (index: number) => void;
}) {
  const { t } = useTranslation();
  if (!message.pendingAction || !message.pendingStatus || message.pendingStatus === "dismissed") {
    return null;
  }

  if (message.pendingStatus === "done") {
    return (
      <div className="tori-chat__confirm">
        <p className="tori-chat__confirm-done">
          {pendingActionDone(message.pendingAction)}{" "}
          <Link to="/inventory">{t("ai.viewInventory")}</Link>
        </p>
      </div>
    );
  }

  const details = pendingActionDetails(message.pendingAction);
  return (
    <div className="tori-chat__confirm">
      <p className="tori-chat__confirm-title">{pendingActionTitle(message.pendingAction)}</p>
      {details.length > 0 && (
        <ul className="tori-chat__confirm-items">
          {details.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <div className="tori-chat__confirm-actions">
        <Button type="button" variant="ghost" onClick={() => onDismiss(index)} disabled={confirming}>
          {t("ai.notNow")}
        </Button>
        <Button
          type="button"
          variant={message.pendingAction.type === "delete_item" ? "danger" : "primary"}
          onClick={() => onConfirm(index)}
          disabled={confirming}
        >
          {confirming ? pendingActionConfirming(message.pendingAction) : t("ai.confirm")}
        </Button>
      </div>
    </div>
  );
}

export function ToriChatPane({ variant, inputId }: ToriChatPaneProps) {
  const { t } = useTranslation();
  const messages = useToriStore((s) => s.messages);
  const draft = useToriStore((s) => s.draft);
  const sending = useToriStore((s) => s.sending);
  const threadError = useToriStore((s) => s.threadError);
  const setDraft = useToriStore((s) => s.setDraft);
  const send = useToriStore((s) => s.send);
  const confirmAction = useToriStore((s) => s.confirmAction);
  const dismissAction = useToriStore((s) => s.dismissAction);
  const resetChat = useToriStore((s) => s.resetChat);
  const language = useSettingsStore((s) => s.language);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const compact = variant === "widget";
  const voiceTurnRef = useRef(false);
  const lastSpokenRef = useRef("");
  const [speaking, setSpeaking] = useState(false);

  const { supported: voiceSupported, listening, toggle: toggleVoice, stop: stopVoice } =
    useToriVoice({
      enabled: !sending,
      onInterim: setDraft,
      onFinal: (transcript) => {
        voiceTurnRef.current = true;
        void send(transcript);
      },
      onError: (message) => toastError(message),
    });

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, sending, threadError]);

  useEffect(() => {
    if (sending) stopVoice();
    else inputRef.current?.focus();
  }, [sending, stopVoice]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!voiceTurnRef.current || last?.role !== "assistant" || !last.content) return;
    if (lastSpokenRef.current === last.content) return;
    lastSpokenRef.current = last.content;
    voiceTurnRef.current = false;
    setSpeaking(true);
    speakText(last.content, { language, onEnd: () => setSpeaking(false) });
  }, [messages, language]);

  useEffect(() => () => stopSpeaking(), []);

  useEffect(() => {
    if (messages.length > 0) return;
    stopSpeaking();
    setSpeaking(false);
  }, [messages.length]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    void send();
  };

  const clearChat = () => {
    stopSpeaking();
    setSpeaking(false);
    stopVoice();
    resetChat();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (speaking) {
        stopSpeaking();
        setSpeaking(false);
        return;
      }
      void send();
    }
  };

  return (
    <div className={`tori-chat${compact ? " tori-chat--widget" : ""}`}>
      {messages.length > 0 ? (
        <div className="tori-chat__toolbar">
          <button
            type="button"
            className="tori-chat__clear"
            onClick={clearChat}
            disabled={sending}
          >
            <IconClear />
            {t("ai.clearChat")}
          </button>
        </div>
      ) : null}
      <div
        className="tori-chat__thread"
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-busy={sending}
      >
        {messages.length === 0 && !sending && (
          <div className="tori-chat__welcome">
            <span className="tori-chat__welcome-icon" aria-hidden>
              <IconToriAi />
            </span>
            <p className="tori-chat__welcome-title">{t("ai.welcomeTitle")}</p>
            <p className="tori-chat__welcome-copy">{t("ai.welcomeBody")}</p>
            <ul className="tori-chat__suggestions">
              {getToriAiSuggestions().map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    className="tori-chat__suggestion"
                    onClick={() => void send(prompt)}
                    disabled={sending}
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {messages.map((message, index) => (
          <article
            key={`${message.role}-${index}`}
            className={`tori-chat__turn tori-chat__turn--${message.role}`}
          >
            <p className="tori-chat__role">{message.role === "user" ? t("ai.you") : t("ai.title")}</p>
            {message.role === "user" ? (
              <p className="tori-chat__body tori-chat__body--plain">{message.content}</p>
            ) : (
              <>
                <ToriMessageBody content={message.content} />
                {message.matchedItems?.length ? (
                  <ToriItemResults items={message.matchedItems} variant={variant} />
                ) : null}
              </>
            )}
            {message.role === "assistant" && (
              <ToriPendingCard
                message={message}
                index={index}
                confirming={message.pendingStatus === "confirming"}
                onConfirm={(i) => void confirmAction(i)}
                onDismiss={dismissAction}
              />
            )}
          </article>
        ))}
        {sending && (
          <p className="tori-chat__status" role="status">
            <span className="tori-chat__dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            {t("ai.lookingUp")}
          </p>
        )}
        {threadError && (
          <p className="tori-chat__error" role="alert">
            {translateError(threadError, t)}
          </p>
        )}
      </div>

      <form className="tori-chat__composer" onSubmit={onSubmit}>
        <label className="tori-chat__label" htmlFor={inputId}>
          {t("ai.message")}
        </label>
        <div className="tori-chat__compose-row">
          <textarea
            id={inputId}
            ref={inputRef}
            className="tori-chat__input"
            rows={compact ? 2 : 3}
            value={draft}
            onChange={(event) => {
              if (speaking) {
                stopSpeaking();
                setSpeaking(false);
              }
              setDraft(event.target.value);
            }}
            onKeyDown={onKeyDown}
            placeholder={listening ? t("ai.listening") : t("ai.placeholder")}
            disabled={sending || listening}
            maxLength={4000}
          />
          {voiceSupported ? (
            <button
              type="button"
              className={`tori-chat__mic${listening ? " tori-chat__mic--listening" : ""}`}
              onClick={() => {
                if (speaking) {
                  stopSpeaking();
                  setSpeaking(false);
                }
                toggleVoice();
              }}
              disabled={sending}
              aria-pressed={listening}
              aria-label={listening ? t("ai.stopListening") : t("ai.talk")}
            >
              <IconMic />
            </button>
          ) : null}
          <button
            type={speaking ? "button" : "submit"}
            className={`tori-chat__send${speaking ? " tori-chat__send--stop" : ""}`}
            disabled={sending || (!speaking && !draft.trim())}
            aria-label={
              sending ? t("common.sending") : speaking ? t("ai.stopSpeaking") : t("common.send")
            }
            onClick={
              speaking
                ? () => {
                    stopSpeaking();
                    setSpeaking(false);
                  }
                : undefined
            }
          >
            {sending
              ? t("common.sending")
              : speaking
                ? compact
                  ? <IconStop />
                  : t("common.stop")
                : compact
                  ? <IconSend />
                  : t("common.send")}
          </button>
        </div>
      </form>
    </div>
  );
}
