import React from "react";
import "./intro-video.css";

function IntroVideo() {
  const app = typeof window.useApp === "function" ? window.useApp() : null;
  const iv = (app && app.t && app.t.introVideo) || {
    titleBefore: "Your journey to financial knowledge starts with",
    highlight: "Wealthoria.",
    desc: "Explore courses, practical tools and learning resources designed to help you understand investing, step by step.",
    benefits: [
      "Learn at your own pace",
      "Kannada and English resources",
      "Explore courses and tools",
    ],
    iframeTitle: "Explore Wealthoria",
  };

  return (
    <section className="intro-video-section">
      <div className="intro-video-container">

        {/* LEFT SIDE */}
        <div className="intro-video-content">

          <h2>
            {iv.titleBefore}{" "}
            <span className="intro-highlight">
              {iv.highlight}
            </span>
          </h2>

          <p>{iv.desc}</p>

          <div className="intro-video-benefits">
            {(iv.benefits || []).map((item, idx) => (
              <div className="intro-benefit" key={idx}>
                <span className="benefit-check">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: FULL YOUTUBE VIDEO */}
        <div className="intro-video-card">
          <iframe
            className="intro-video-player"
            src="https://www.youtube.com/embed/VFrp6G43jyw?autoplay=1&mute=1&playsinline=1&rel=0"
            title={iv.iframeTitle}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

      </div>
    </section>
  );
}

export default IntroVideo;

Object.assign(window, { IntroVideo });