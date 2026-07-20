import { useStore } from '../hooks/useStore'

const regions = [
  { name: 'Russian', image: '/images/russian.jpg' },
  { name: 'American', image: '/images/american.jpg' },
  { name: 'British', image: '/images/british.jpg' },
  { name: 'Asian', image: '/images/asian.jpg' },
  { name: 'Japanese', image: '/images/japanese.jpg' },
  { name: 'Indian', image: '/images/indian.jpg' },
  { name: 'Desi', image: '/images/desi.jpg' },
  { name: 'Thai', image: '/images/thai.jpg' },
]

export default function CategoryImages() {
  const { setSearchQuery } = useStore()

  return (
    <div className="category-images">
      <div className="category-images-grid">
        {regions.map((region, i) => {
          const isAd = i === 2 || i === 7
          return (
            <div
              key={region.name}
              className={`category-image-card ${isAd ? 'ad-slot' : ''}`}
              onClick={() => !isAd && setSearchQuery(region.name)}
            >
              {isAd && <span className="ad-badge">AD</span>}
              <img
                src={isAd ? '/images/ad-placeholder.jpg' : region.image}
                alt={region.name}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/placeholder.jpg'
                }}
              />
              {!isAd && <span className="category-image-label">{region.name}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

