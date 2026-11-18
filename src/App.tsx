import Header from './components/Header'
import Hero from './components/Hero'
import FloatingContact from './components/FloatingContact'
import { shop, contact } from './data/site-data'
import { contactLinks } from './lib/contact-links'

export default function App() {
  const links = contactLinks(contact)
  return (
    <>
      <Header shopName={shop.name} links={links} />
      <main>
        <Hero shop={shop} links={links} />
      </main>
      <FloatingContact zaloUrl={links.zalo} />
    </>
  )
}
