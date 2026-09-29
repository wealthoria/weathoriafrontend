import React from "react";
import "./intro-video.css";

function IntroVideo() {
  return (
    <section className="intro-video-section">
      <div className="intro-video-container">

        {/* LEFT SIDE */}
        <div className="intro-video-content">
         
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

        {/* RIGHT SIDE: FULL YOUTUBE VIDEO */}
        <div className="intro-video-card">
          <iframe
            className="intro-video-player"
            src="https://www.youtube.com/embed/VFrp6G43jyw?autoplay=1&mute=1&playsinline=1&rel=0"
            title="Explore Wealthoria"
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