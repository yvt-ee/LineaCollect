import "./AboutUs.css";
import aboutImage from "../assets/aboutus.png"; // ✅ import the image

export default function AboutUs() {
  return (
    <div className="about-page">
      <div className="about-container">
        <img
          src={aboutImage}
          alt="About LineaCollect"
          className="about-image"
        />
        <div className="about-text">
          <h2>About LineaCollect</h2>
          <p>
            LineaCollect is a curated platform celebrating independent designers and sustainable craftsmanship. 
            Our mission is to connect conscious shoppers with brands that prioritize artistry, ethical production, 
            and timeless design. Every piece we feature tells a story — one of creativity, responsibility, and authenticity.
          </p>
          <p>
            Founded in Seattle, LineaCollect partners with makers from around the world to bring you collections that 
            blend modern aesthetics with enduring quality. Thank you for supporting our journey.
          </p>
        </div>
      </div>
    </div>
  );
}
