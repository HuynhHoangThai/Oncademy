import Companies from "../../components/students/Companies"
import CoursesSection from "../../components/students/CoursesSection"
import Hero from "../../components/students/Hero"
import TestimonialsSection from "../../components/students/TestimonialsSection"
import CallToAction from "../../components/students/CallToAction"
import Footer from "../../components/students/Footer"

const Home = () => {
  return (
    <div className="flex flex-col items-center space-y-7 text-center">
        <Hero />
        <Companies />
        <CoursesSection />
        <TestimonialsSection />
        <CallToAction />
        <Footer />
    </div>
  )
}
export default Home

