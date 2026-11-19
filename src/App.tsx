import { useState } from 'react'
import PromoBanner from './components/PromoBanner'
import Header from './components/Header'
import Hero from './components/Hero'
import ProxyTypes from './components/ProxyTypes'
import Pricing from './components/Pricing'
import PriceCalculator from './components/PriceCalculator'
import Compare from './components/Compare'
import PlanAdvisor from './components/PlanAdvisor'
import Reviews from './components/Reviews'
import HowToBuy from './components/HowToBuy'
import Faq from './components/Faq'
import ContactFooter from './components/ContactFooter'
import FloatingContact from './components/FloatingContact'
import { shop, contact, promo, proxyTypes, faqs, reviews, reviewsAreSample, planAdvisor } from './data/site-data'
import { contactLinks } from './lib/contact-links'

export default function App() {
  const links = contactLinks(contact)
  const [selectedTypeId, setSelectedTypeId] = useState(proxyTypes[0].id)

  // Thời hạn của ô tính giá nằm ở đây để trợ lý chọn gói đặt được
  const [duration, setDuration] = useState(
    () => (proxyTypes[0].plans.find((p) => p.popular) ?? proxyTypes[0].plans[0])?.duration ?? '',
  )

  const pickType =(id: string) => {
    setSelectedTypeId(id)
    document.getElementById('bang-gia')?.scrollIntoView({ behavior: 'smooth' })
  }

  const applyAdvice = (typeId: string, duration: string) => {
    setSelectedTypeId(typeId)
    setDuration(duration)
    document.getElementById('tinh-gia')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <PromoBanner promo={promo} />
      <Header shopName={shop.name} links={links} />
      <main>
        <Hero shop={shop} links={links} />
        <ProxyTypes types={proxyTypes} onSelect={pickType} />
        <Compare types={proxyTypes} onSelect={pickType} />
        <PlanAdvisor types={proxyTypes} config={planAdvisor} onApply={applyAdvice} />
        <Pricing types={proxyTypes} selectedId={selectedTypeId} onSelect={setSelectedTypeId} links={links}>
          <PriceCalculator types={proxyTypes} selectedId={selectedTypeId} onSelect={setSelectedTypeId} links={links} promo={promo} duration={duration} onDurationChange={setDuration} />
        </Pricing>
        <Reviews items={reviews} types={proxyTypes} sample={reviewsAreSample} />
        <HowToBuy />
        <Faq items={faqs} />
      </main>
      <ContactFooter shop={shop} contact={contact} links={links} />
      <FloatingContact zaloUrl={links.zalo} />
    </>
  )
}
