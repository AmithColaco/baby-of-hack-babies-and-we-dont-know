import { HeroSection } from '../components/home/HeroSection';
import { CraftCategories } from '../components/home/CraftCategories';
import { FeaturedCarousel } from '../components/home/FeaturedCarousel';
import { ArtisanHighlights } from '../components/home/ArtisanHighlights';
import { MakingJourney } from '../components/home/MakingJourney';
import { SellerCallToAction } from '../components/home/SellerCallToAction';

export default function Home() {
  return (
    <main className="kaarigar-home-editorial" role="main">
      {/* Section A: The Introduction */}
      <HeroSection />

      {/* Section B: Discover the Crafts */}
      <CraftCategories />

      {/* Section C: The Featured Interactive Product Carousel */}
      <FeaturedCarousel />

      {/* Section D: Meet the Makers */}
      <ArtisanHighlights />

      {/* Section E: From Raw Material to Finished Object */}
      <MakingJourney />

      {/* Section F: Become a Seller */}
      <SellerCallToAction />

      {/* Section G: Closing Statement */}
      <section className="home-closing-statement">
        <div className="home-closing-statement__inner">
          <blockquote className="closing-quote">
            “Craft is not history trapped behind museum glass; it is prayer made visible with hands.”
          </blockquote>
          <div className="closing-provenance">
            <span>KAARIGAR ARCHIVAL COVENANT · GUARANTEED INDIGENOUS CUSTODIANSHIP</span>
          </div>
        </div>
      </section>
    </main>
  );
}
