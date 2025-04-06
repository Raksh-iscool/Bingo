import ScheduleTweetPost from '@/features/SchedulePost'
import ScheduleYoutubeVideo from '@/features/ScheduleYoutubeVideo'
import React from 'react'

const page = () => {
  return (
    <div>
        <ScheduleTweetPost/>
        <ScheduleYoutubeVideo/>
    </div>
  )
}

export default page