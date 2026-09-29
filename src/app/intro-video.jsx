
import React from "react";
import "./intro-video.css";

function IntroVideo() {
  return (
    <section className="intro-video-section">

      <div className="intro-video-container">

        {/* LEFT SIDE: Introduction */}
        <div className="intro-video-content">

          <div className="intro-video-badge">
            <span className="badge-dot"></span>
            A QUICK LOOK INSIDE
          </div>

          <h2>
            Your journey to financial knowledge
            starts with{" "}
            <span className="intro-highlight">
              Wealthoria.
            </span>
          </h2>

          <p>
            Explore courses, practical tools and learning
            resources designed to help you understand
            investing, step by step.
          </p>

          <div className="intro-video-benefits">

            <div className="intro-benefit">
              <span className="benefit-check">✓</span>
              Learn at your own pace
            </div>

            <div className="intro-benefit">
              <span className="benefit-check">✓</span>
              Kannada and English resources
            </div>

            <div className="intro-benefit">
              <span className="benefit-check">✓</span>
              Explore courses and tools
            </div>

          </div>
        </div>

        {/* RIGHT SIDE: Temporary video placeholder */}
       
<div className="intro-video-card">

  <img
    className="intro-video-thumbnail"
   src="https://img.youtube.com/vi/VFrp6G43jyw/hqdefault.jpg"
    alt="Watch the Wealthoria website introduction"
  />

  <div className="intro-video-overlay">

    <span className="intro-video-label">
      WEALTHORIA · QUICK TOUR
    </span>

    <button
      type="button"
      className="intro-video-play-button"
      aria-label="Watch the Wealthoria introduction"
      onClick={() =>
        window.open(
         "https://youtu.be/VFrp6G43jyw?si=JceeSurc_qM3_BOl",
          "_blank",
          "noopener,noreferrer"
        )
      }
    >
      <span className="intro-video-play-icon">▶</span>
    </button>

    <div className="intro-video-caption">
      <strong>How to Use Wealthoria</strong>
      <span>Discover what's inside</span>
    </div>

  </div>

</div>

      </div>
    </section>
  );
}

export default IntroVideo;

Object.assign(window, { IntroVideo });