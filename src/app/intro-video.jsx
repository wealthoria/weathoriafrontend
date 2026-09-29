
import React from "react";
import "./intro-video.css";

function IntroVideo() {
const sectionRef = React.useRef(null);

const [previewPlaying, setPreviewPlaying] = React.useState(false);
const [previewDismissed, setPreviewDismissed] = React.useState(false);

React.useEffect(() => {
  const section = sectionRef.current;
  if (!section) return;

  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && entry.intersectionRatio >= 0.35) {
      if (!previewDismissed) {
        setPreviewPlaying(true);
      }
    } else {
      setPreviewPlaying(false);
      setPreviewDismissed(false);
    }
  }, { threshold: [0, 0.35] });

  observer.observe(section);

  return () => observer.disconnect();
}, [previewDismissed]);

React.useEffect(() => {
  if (!previewPlaying) return;

  const timer = setTimeout(() => {
    setPreviewPlaying(false);
    setPreviewDismissed(true);
  }, 30000);

  return () => clearTimeout(timer);
}, [previewPlaying]);



  return (
 <section ref={sectionRef} className="intro-video-section">

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
<div className="intro-video-card">
  {previewPlaying ? (
   <iframe
  className="intro-video-player"
  src="https://www.youtube.com/embed/VFrp6G43jyw?autoplay=1&mute=1&controls=0&playsinline=1&enablejsapi=1"
  title="Wealthoria fast preview"
  allow="autoplay; encrypted-media"
  onLoad={(event) => {
    const iframe = event.currentTarget;

    const setFastSpeed = () => {
      iframe.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "setPlaybackRate",
          args: [10],
        }),
        "https://www.youtube.com"
      );
    };

    setFastSpeed();
    setTimeout(setFastSpeed, 1000);
  }}
/>
  ) : (
    <>
      <img
        className="intro-video-thumbnail"
        src="https://img.youtube.com/vi/VFrp6G43jyw/hqdefault.jpg"
        alt="Watch the Wealthoria introduction"
      />

      <div className="intro-video-overlay">
        <span className="intro-video-label">
          WEALTHORIA · QUICK TOUR
        </span>

        <button
          type="button"
          className="intro-video-play-button"
          aria-label="Watch the full Wealthoria video on YouTube"
          onClick={() =>
            window.open(
              "https://youtu.be/VFrp6G43jyw",
              "_blank",
              "noopener,noreferrer"
            )
          }
        >
          <span className="intro-video-play-icon">▶</span>
        </button>

        <div className="intro-video-caption">
          <strong>Discover Wealthoria</strong>
          <span>Watch the full video on YouTube</span>
        </div>
      </div>
    </>
  )}
</div>

      </div>
    </section>
  );
}

export default IntroVideo;

Object.assign(window, { IntroVideo });