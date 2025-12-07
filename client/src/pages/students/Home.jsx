import Companies from "../../components/students/Companies"
import CoursesSection from "../../components/students/CoursesSection"
import Hero from "../../components/students/Hero"
import TestimonialsSection from "../../components/students/TestimonialsSection"
import CallToAction from "../../components/students/CallToAction"
import Footer from "../../components/students/Footer"
import { useEffect } from "react"
import { AppContext } from "../../context/AppContext"
import { useNavigate } from "react-router-dom"
import { useUser } from "@clerk/clerk-react"

const Home = () => {
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()

  useEffect(() => {
    if (isLoaded && user) {
      const userRole = user.publicMetadata.role;

      if (userRole === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userRole === 'educator') {
        navigate('/educator', { replace: true });
      }

    }
  }, [isLoaded, user, navigate])

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

