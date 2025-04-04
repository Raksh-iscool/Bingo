// import SchedulingComponent from "@/features/SchedulingComponent"
import Marquee from "@/features/Marquee"
import Onboarding from "@/components/ui/Onboarding"
import React from "react"
import UserProfile from "@/features/UserProfile"


const Page = () => {
  return (
    <div>
      {/* <SchedulingComponent /> */}
      <Marquee/>
      <Onboarding/>
      <UserProfile/>
    </div>
  )
}

export default Page