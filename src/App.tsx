import { useState } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import ProxyTypes from './components/ProxyTypes'
import Pricing from './components/Pricing'
import FloatingContact from './components/FloatingContact'
import { shop, contact, proxyTypes } from './data/site-data'
import { contactLinks } from './lib/contact-links'

export default function App() {
  const links = contactLinks(contact)
  const [selectedTypeId, setSelectedTypeId] = useState(proxyTypes[0].id)

  const pickType = (id: string) => {
    setSelectedTypeId(id)
    document.getElementById('bang-gia')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Header shopName={shop.name} links={links} />
      <main>
        <Hero shop={shop} links={links} />
        <ProxyTypes types={proxyTypes} onSelect={pickType} />
        <Pricing types={proxyTypes} selectedId={selectedTypeId} onSelect={setSelectedTypeId} links={links} />
      </main>
      <FloatingContact zaloUrl={links.zalo} />
    </>
  )
}
