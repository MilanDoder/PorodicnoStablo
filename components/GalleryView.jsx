// Zamijeniti pravim URL-ovima iz Supabase Storage
const PHOTOS = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
    title: "Пољана, 1952. година",
    sub: "Pogled na selo u jesen",
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1472791108553-c9405341e398?w=600&q=80",
    title: "Породични збор, 1971.",
    sub: "Прослава крсне славе — Додеровићи",
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80",
    title: "Стара кућа, 1938.",
    sub: "Прадједова кућа у Пољани",
  },
];

export default function GalleryView() {
  return (
    <div className="gallery-wrap">
      <p className="gallery-intro">
        Fotografije i dokumenti iz arhive породице Додеровић. Снимци покривају период
        од почетка 20. вијека до данас — кућа, земља, збори и свечаности.
      </p>
      <div className="gallery-grid">
        {PHOTOS.map(p => (
          <div className="gallery-item" key={p.id}>
            <img
              className="gallery-img"
              src={p.url}
              alt={p.title}
              onError={e => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div className="gallery-img-placeholder" style={{ display: "none" }}>📷</div>
            <div className="gallery-caption">
              <div className="gallery-caption-title">{p.title}</div>
              <div className="gallery-caption-sub">{p.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
