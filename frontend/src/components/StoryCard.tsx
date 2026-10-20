interface StoryCardProps {
  title: string;
  artisan: string;
  excerpt: string;
  image?: string;
  onClick?: () => void;
}

export default function StoryCard({ title, artisan, excerpt, image, onClick }: StoryCardProps) {
  return (
    <article className="story-card" onClick={onClick}>
      {image && <img src={image} alt={title} className="story-card__img" />}
      <div className="story-card__body">
        <span className="story-card__artisan">{artisan}</span>
        <h4 className="story-card__title">{title}</h4>
        <p className="story-card__excerpt">{excerpt}</p>
      </div>
    </article>
  );
}
