import { Crop, Sparkles, Scissors, Images, ChevronRight } from 'lucide-react';

interface HomeProps {
  onEditPhoto: () => void;
  onOpenCollage: () => void;
  onOpenAIEnhancer: () => void;
  onOpenBgEraser: () => void;
}

const fontFamily = "'Plus Jakarta Sans', system-ui, sans-serif";

function CameraLogoMark() {
  return (
    <svg
      width="48"
      height="37"
      viewBox="0 0 130 98"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="EDITART camera logo"
    >
      <rect x="44" y="2" width="24" height="17" rx="7" fill="white" />
      <rect x="28" y="5" width="13" height="12" rx="4" fill="white" opacity="0.55" />
      <path
        d="M10 24C10 15 17 11 26 11L110 13C119 13 125 20 125 29V82C125 90 118 96 109 96H24C15 96 10 90 10 81V24Z"
        fill="white"
      />
      <rect x="20" y="24" width="28" height="19" rx="4.5" fill="#246DFF" />
      <rect x="24" y="28" width="20" height="3" rx="1.5" fill="white" opacity="0.2" />
      <circle cx="79" cy="54" r="32" fill="#246DFF" />
      <circle cx="79" cy="54" r="27" fill="white" />
      <circle cx="79" cy="54" r="21" fill="#246DFF" />
      <ellipse cx="70" cy="44" rx="6" ry="5" fill="white" opacity="0.78" />
      <circle cx="68" cy="42" r="2.8" fill="white" />
      <path d="M18 82Q10 68 10 54Q10 38 18 26" stroke="#246DFF" strokeWidth="5" strokeLinecap="round" />
      <rect x="104" y="6" width="10" height="10" rx="3" fill="white" opacity="0.5" />
    </svg>
  );
}

interface FeatureCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  onClick: () => void;
}

function FeatureCard({ title, subtitle, icon, gradient, onClick }: FeatureCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="feature-card"
      style={{ fontFamily }}
    >
      <span className="feature-card-icon" style={{ background: gradient }}>
        {icon}
      </span>
      <span className="feature-card-copy">
        <span className="feature-card-title">{title}</span>
        <span className="feature-card-subtitle">{subtitle}</span>
      </span>
      <ChevronRight className="feature-card-arrow" aria-hidden="true" />
    </button>
  );
}

export default function Home({ onEditPhoto, onOpenCollage, onOpenAIEnhancer, onOpenBgEraser }: HomeProps) {
  return (
    <main className="editart-home" style={{ fontFamily }}>
      <div className="editart-shell">
        <header className="editart-header">
          <div className="editart-logo-box">
            <CameraLogoMark />
          </div>
          <h1>EDITART</h1>
          <p>Professional Photo Editor</p>
        </header>

        <section className="feature-list" aria-label="Photo editing tools">
          <FeatureCard
            title="Edit a Photo"
            subtitle="Full editor: crop, adjust, filters, text, shapes, draw & more"
            icon={<Crop className="feature-icon-svg" strokeWidth={2} />}
            gradient="linear-gradient(145deg, #3A8DFF 0%, #1E5CFF 100%)"
            onClick={onEditPhoto}
          />
          <FeatureCard
            title="AI Photo Enhancer"
            subtitle="Enhance quality, sharpen details & restore photos"
            icon={<Sparkles className="feature-icon-svg" strokeWidth={1.8} />}
            gradient="linear-gradient(145deg, #FF9A00 0%, #FF6A00 100%)"
            onClick={onOpenAIEnhancer}
          />
          <FeatureCard
            title="Background Eraser"
            subtitle="Remove backgrounds with AI & manual tools"
            icon={<Scissors className="feature-icon-svg" strokeWidth={1.8} />}
            gradient="linear-gradient(145deg, #FF4D8D 0%, #FF1E6A 100%)"
            onClick={onOpenBgEraser}
          />
          <FeatureCard
            title="Photo Collage"
            subtitle="Combine multiple photos into one"
            icon={<Images className="feature-icon-svg" strokeWidth={1.8} />}
            gradient="linear-gradient(145deg, #00D68F 0%, #00A86B 100%)"
            onClick={onOpenCollage}
          />
        </section>
      </div>
    </main>
  );
}
