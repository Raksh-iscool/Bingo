// "use client"

// import { useState, useEffect } from "react"
// import { format } from "date-fns"
// import { Calendar } from "@/components/ui/calendar"
// import TaskDialog, {
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog"
// import { Input } from "@/components/ui/input"
// import { Button } from "@/components/ui/button"

// export default function CalendarComponent({
//   tasks,
//   fetchTasks,
//   addTask,
// }: {
//   tasks: Record<string, string[]>
//   fetchTasks: () => Promise<Record<string, string[]>>
//   addTask: (date: string, task: string) => void
// }) {
//   const today = new Date()
//   const [selectedDate, setSelectedDate] = useState<Date | undefined>(today)
//   const [mockPriceData, setMockPriceData] = useState<Record<string, number>>({})
//   const [newTask, setNewTask] = useState("")

//   useEffect(() => {
//     const generateMockPriceData = () => {
//       const data: Record<string, number> = {}

//       for (let i = 0; i < 180; i++) {
//         const date = new Date(today)
//         date.setDate(today.getDate() + i)
//         const dateKey = format(date, "yyyy-MM-dd")
//         const randomPrice = Math.floor(Math.random() * (200 - 80 + 1)) + 80
//         data[dateKey] = randomPrice
//       }
//       return data
//     }
//     setMockPriceData(generateMockPriceData())
//   }, [])

//   const isDateDisabled = (date: Date) => {
//     const dateKey = format(date, "yyyy-MM-dd")
//     return !(mockPriceData && mockPriceData[dateKey])
//   }

//   const handleDateClick = (date: Date | undefined) => {
//     if (date) {
//       setSelectedDate(date)
//     }
//   }

//   const getTaskCount = (date: Date) => {
//     const dateKey = format(date, "yyyy-MM-dd")
//     return tasks[dateKey]?.length || 0
//   }

//   const handleAddTask = () => {
//     if (selectedDate && newTask.trim()) {
//       const dateKey = format(selectedDate, "yyyy-MM-dd")
//       addTask(dateKey, newTask)
//       setNewTask("")
//     }
//   }

//   return (
//     <div>
//       <Calendar
//         mode="single"
//         selected={selectedDate}
//         onSelect={handleDateClick}
//         numberOfMonths={1}
//         pagedNavigation
//         showOutsideDays={false}
//         required={false}
//         className="rounded-md border p-2"
//         classNames={{
//           months: "sm:flex-col md:flex-row gap-8",
//           month:
//             "relative first-of-type:before:hidden before:absolute max-md:before:inset-x-2 max-md:before:h-px max-md:before:-top-4 md:before:inset-y-2 md:before:w-px before:bg-border md:before:-left-4",
//           weekday: "w-12",
//           day_button: "size-12",
//           today: "*:after:hidden",
//         }}
//         components={{
//           DayButton: ({ day, ...props }) => (
//             <TaskDialog
//               date={day.date} // Pass the date
//               tasks={tasks} // Pass the tasks
//               addTask={addTask} // Pass the addTask function
//               onClose={() => setNewTask("")} // Handle dialog close
//             >
//               <DialogTrigger asChild>
//                 <button {...props}>
//                   <span className="flex flex-col">
//                     {day.date.getDate()}
//                     <span className="text-xs text-muted-foreground">
//                       {getTaskCount(day.date)} tasks
//                     </span>
//                   </span>
//                 </button>
//               </DialogTrigger>
//               <DialogContent className="sm:max-w-[425px]">
//                 <DialogHeader>
//                   <DialogTitle>Tasks for {format(day.date, "yyyy-MM-dd")}</DialogTitle>
//                   <DialogDescription>
//                     Add or view tasks for this date.
//                   </DialogDescription>
//                 </DialogHeader>
//                 <div className="grid gap-4 py-4">
//                   <ul>
//                     {(tasks[format(day.date, "yyyy-MM-dd")] || []).map(
//                       (task, index) => (
//                         <li key={index}>{task}</li>
//                       )
//                     )}
//                   </ul>
//                   <div className="grid grid-cols-4 items-center gap-4">
//                     <Input
//                       type="text"
//                       value={newTask}
//                       onChange={(e) => setNewTask(e.target.value)}
//                       placeholder="Add a new task"
//                       className="col-span-3"
//                     />
//                     <Button onClick={handleAddTask}>Add Task</Button>
//                   </div>
//                 </div>
//                 <DialogFooter>
//                   <Button onClick={() => setNewTask("")}>Close</Button>
//                 </DialogFooter>
//               </DialogContent>
//             </TaskDialog>
//           ),
//         }}
//         disabled={isDateDisabled}
//       />
//     </div>
//   )
// }
