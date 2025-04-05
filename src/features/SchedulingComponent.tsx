// "use client"
// import { Calendar } from '@/components/ui/calendar'
// import Dialog,{ DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
// import React from 'react'

// const SchedulingComponent = () => {
//   const [date, setDate] = React.useState<Date | undefined>(new Date())
//   const [tasks, setTasks] = React.useState<{ [key: string]: string[] }>({
//     "2023-10-01": ["Task 1", "Task 2"],
//     "2023-10-02": ["Task 3"],
//   })
//   const [selectedDate, setSelectedDate] = React.useState<string | null>(null)

//   const handleAddTask = (task: string) => {
//     if (selectedDate) {
//       setTasks((prev) => ({
//         ...prev,
//         [selectedDate]: [...(prev[selectedDate] || []), task],
//       }))
//     }
//   }

//   const getDayClassName = (date: Date): string => {
//     const dateKey = date.toISOString().split('T')[0]
//     return dateKey in tasks && tasks[dateKey]?.length
//       ? "relative after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1.5 after:h-1.5 after:rounded-full after:bg-primary"
//       : ""
//   }

//   return (
//     <div>
//       <Calendar
//         mode="single"
//         selected={date}
//         onSelect={(selected) => {
//           setDate(selected)
//           setSelectedDate(selected?.toISOString().split('T')[0] || null)
//         }}
//         className="rounded-md border"
//         modifiersClassNames={{
//           day: getDayClassName,
//         }}
//       />
//       <Dialog>
//         <DialogTrigger asChild>
//           <button className="mt-4 px-4 py-2 bg-primary text-white rounded-md">
//             View/Add Tasks
//           </button>
//         </DialogTrigger>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Tasks for {selectedDate || "Selected Date"}</DialogTitle>
//             <DialogDescription>
//               {selectedDate && tasks[selectedDate]?.length ? (
//                 <ul>
//                   {tasks[selectedDate].map((task, index) => (
//                     <li key={index}>{task}</li>
//                   ))}
//                 </ul>
//               ) : (
//                 <p>No tasks scheduled for this date.</p>
//               )}
//               <div className="mt-4">
//                 <input
//                   type="text"
//                   placeholder="Add a new task"
//                   className="border rounded-md px-2 py-1 w-full"
//                   onKeyDown={(e) => {
//                     if (e.key === "Enter" && e.currentTarget.value) {
//                       handleAddTask(e.currentTarget.value)
//                       e.currentTarget.value = ""
//                     }
//                   }}
//                 />
//               </div>
//             </DialogDescription>
//           </DialogHeader>
//         </DialogContent>
//       </Dialog>
//     </div>
//   )
// }

// export default SchedulingComponent