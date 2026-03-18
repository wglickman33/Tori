import "./NotificationTab.scss";

const NotificationTab = ({ type = "success", message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      className={`notification-tab notification-tab--${type}`}
      role="alert"
    >
      <span className="notification-tab__message">{message}</span>
      {onDismiss && (
        <button
          type="button"
          className="notification-tab__dismiss"
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default NotificationTab;
