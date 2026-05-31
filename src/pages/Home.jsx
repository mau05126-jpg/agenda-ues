import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import Cronograma from '../components/Cronograma'
import Instituciones from '../components/Instituciones'
import Footer from '../components/Footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <Cronograma />
      <Instituciones />
      <Footer />
    </>
  )
}
