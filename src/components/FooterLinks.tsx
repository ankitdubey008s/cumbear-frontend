import { useNavigate } from 'react-router-dom'

const links = [
  { label: 'Contact Support', page: 'support' },
  { label: 'Child Safety', page: 'child-safety' },
  { label: 'Partners Program', page: 'partners' },
  { label: 'RTA Label', page: 'rta' },
  { label: 'Terms of Service', page: 'terms' },
  { label: 'Privacy Policy', page: 'privacy' },
  { label: 'DMCA', page: 'dmca' },
  { label: '2257 Compliance', page: '2257' },
]

export default function FooterLinks() {
  const navigate = useNavigate()

  return (
    <div className="footer-links">
      <div className="footer-links-grid">
        {links.map(link => (
          <button
            key={link.page}
            className="footer-link"
            onClick={() => navigate(`/info/${link.page}`)}
          >
            {link.label}
          </button>
        ))}
      </div>
      <div className="footer-copyright">
        © 2026 cumbear.in — All Rights Reserved
      </div>
    </div>
  )
}

