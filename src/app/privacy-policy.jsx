
import React from "react";

const AppCtx = window.AppCtx;

function PrivacyPolicy() {
  const { lang } = React.useContext(AppCtx);

  const content = {
    en: {
      title: "Privacy Policy",
      intro: "Wealthoria respects your privacy.",
      collection:
        "We collect your name, email address and mobile number for webinar registration, communication and customer support.",
      sharing:
        "We do not sell your personal information. We share it only when necessary for payment processing, service delivery or legal compliance.",
      contact:
        "For privacy-related questions, contact us at"
    },
    kn: {
      title: "ಗೌಪ್ಯತಾ ನೀತಿ",
      intro: "Wealthoria ನಿಮ್ಮ ಗೌಪ್ಯತೆಯನ್ನು ಗೌರವಿಸುತ್ತದೆ.",
      collection:
        "ವೆಬಿನಾರ್ ನೋಂದಣಿ, ಸಂವಹನ ಮತ್ತು ಗ್ರಾಹಕ ಬೆಂಬಲಕ್ಕಾಗಿ ನಿಮ್ಮ ಹೆಸರು, ಇಮೇಲ್ ವಿಳಾಸ ಮತ್ತು ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ಸಂಗ್ರಹಿಸುತ್ತೇವೆ.",
      sharing:
        "ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ನಾವು ಮಾರಾಟ ಮಾಡುವುದಿಲ್ಲ. ಪಾವತಿ ಪ್ರಕ್ರಿಯೆ, ಸೇವೆ ಒದಗಿಸುವಿಕೆ ಅಥವಾ ಕಾನೂನು ಪಾಲನೆಗಾಗಿ ಅಗತ್ಯವಿದ್ದಾಗ ಮಾತ್ರ ಹಂಚಿಕೊಳ್ಳುತ್ತೇವೆ.",
      contact:
        "ಗೌಪ್ಯತೆಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳಿಗಾಗಿ ಇಲ್ಲಿ ಸಂಪರ್ಕಿಸಿ"
    }
  };

  const t = content[lang] || content.en;

  return (
    <main className="privacy-page">
      <article className="privacy-card">
        <span className="privacy-eyebrow">
          WEALTHORIA
        </span>

        <h1>{t.title}</h1>

        <div className="privacy-divider" />

        <p>{t.intro}</p>
        <p>{t.collection}</p>
        <p>{t.sharing}</p>

        <p>
          {t.contact}{" "}
          <a href="mailto:support@wealthoria.in">
            support@wealthoria.in
          </a>.
        </p>
      </article>
    </main>
  );
}

Object.assign(window, { PrivacyPolicy });

export default PrivacyPolicy;