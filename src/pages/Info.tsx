import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

const pages: Record<string, { title: string; content: string }> = {
  support: {
    title: 'Contact Support',
    content: `Need help? Contact us at support@cumbear.in or reach out through our Telegram channel @CumBear_official. We typically respond within 24 hours.`,
  },
  'child-safety': {
    title: 'Child Safety',
    content: `CUMBear is strictly for adults 18+. We use age verification, RTA labeling, and content moderation to prevent minors from accessing adult content. If you believe a minor has accessed this site, please contact us immediately.`,
  },
  partners: {
    title: 'Partners Program',
    content: `Join our affiliate program and earn revenue by promoting CUMBear. Contact partners@cumbear.in for details on commission rates, ad placements, and collaboration opportunities.`,
  },
  rta: {
    title: 'RTA Label',
    content: `This website is labeled with the RTA (Restricted To Adults) label. Parents can use parental control tools to block this site. We are committed to preventing minors from accessing adult content.`,
  },
  terms: {
    title: 'Terms of Service',
    content: `By using CUMBear, you agree to be at least 18 years old, not upload illegal content, respect other users, and comply with all applicable laws. We reserve the right to terminate accounts violating these terms.`,
  },
  privacy: {
    title: 'Privacy Policy',
    content: `We collect minimal data necessary for site functionality. Your viewing history is not shared with third parties. We use cookies for preferences and analytics. You can request data deletion at any time.`,
  },
  dmca: {
    title: 'DMCA / Copyright',
    content: `If you believe your copyright has been infringed, send a DMCA notice to dmca@cumbear.in with: your contact info, the infringing URL, proof of ownership, and a statement of good faith.`,
  },
  2257: {
    title: '18 U.S.C. 2257 Compliance',
    content: `All performers depicted on this website were over the age of 18 at the time of production. Records required by 18 U.S.C. 2257 are maintained by the content producers, not CUMBear.`,
  },
  report: {
    title: 'Report Content',
    content: `To report illegal, non-consensual, or abusive content, email report@cumbear.in with the video URL and reason. We investigate all reports within 48 hours and remove violating content immediately.`,
  },
}

export default function Info() {
  const { page } = useParams()
  const navigate = useNavigate()
  const info = page ? pages[page] : null

  if (!info) {
    return (
      <div className="page info-page">
        <div className="error-card">
          <h3>Page not found</h3>
          <button className="retry-btn" onClick={() => navigate('/home')}>Go Home</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page info-page">
      <div className="info-header">
        <button onClick={() => navigate('/home')}><ChevronLeft size={24} /></button>
        <h1>{info.title}</h1>
      </div>
      <div className="info-content">
        <p>{info.content}</p>
      </div>
      <div className="footer-copyright" style={{ marginTop: 60 }}>
        © 2026 cumbear.in — All Rights Reserved
      </div>
    </div>
  )
}

