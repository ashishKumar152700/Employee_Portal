// Global/reducers.ts

const initialState = {
  punchInfo: [],
  userDetails: {},
  leaveDetails: {},
  managerInfo: [],
  calendarData: [],
  todayPunch: null,
  
  // Timesheet related state
  timesheetTasks: [],
  selectedTimesheetDate: null,
  timesheetProjects: [],
  monthlyTimesheetData: {},
  
  // Asset/Ticket related state
  assetCategories: [],
  myTickets: [],
  ticketStats: {
    total: 0,
    pending: 0,
    approved: 0,
    allocated: 0,
    rejected: 0,
    cancelled: 0,
  },
  assetLoading: false,
  ticketLoading: false,
  raisingTicket: null,
  cancellingTicket: null,
};

const reducers = (state = initialState, action: any) => {
  switch (action.type) {
    case "punchInfo":
      return { ...state, punchInfo: action.payload };
    case "userDetails":
      return { ...state, userDetails: action.payload };
    case "leaveDetails":
      return { ...state, leaveDetails: action.payload };
    case "managerInfo":
      return { ...state, managerInfo: action.payload };
    case "calendarData":
      return { ...state, calendarData: action.payload };
    case "todayPunch":
      return { ...state, todayPunch: action.payload };

    // Timesheet actions
    case "SET_TIMESHEET_TASKS":
      return { ...state, timesheetTasks: action.payload };
    case "SET_SELECTED_TIMESHEET_DATE":
      return { ...state, selectedTimesheetDate: action.payload };
    case "SET_TIMESHEET_PROJECTS":
      return { ...state, timesheetProjects: action.payload };
    case "SET_MONTHLY_TIMESHEET_DATA":
      return { ...state, monthlyTimesheetData: action.payload };
    case "ADD_TIMESHEET_TASK":
      return {
        ...state,
        timesheetTasks: [...state.timesheetTasks, action.payload]
      };
    case "UPDATE_TIMESHEET_TASK":
      return {
        ...state,
        timesheetTasks: state.timesheetTasks.map((task: any) =>
          task.taskId === action.payload.taskId ? action.payload : task
        )
      };
    case "DELETE_TIMESHEET_TASK":
      return {
        ...state,
        timesheetTasks: state.timesheetTasks.filter((task: any) =>
          task.taskId !== action.payload
        )
      };

    // Asset/Ticket actions
    case "SET_ASSET_CATEGORIES":
      return { ...state, assetCategories: action.payload };
    case "SET_MY_TICKETS":
      return { ...state, myTickets: action.payload };
    case "SET_TICKET_STATS":
      return { ...state, ticketStats: action.payload };
    case "SET_ASSET_LOADING":
      return { ...state, assetLoading: action.payload };
    case "SET_TICKET_LOADING":
      return { ...state, ticketLoading: action.payload };
    case "SET_RAISING_TICKET":
      return { ...state, raisingTicket: action.payload };
    case "SET_CANCELLING_TICKET":
      return { ...state, cancellingTicket: action.payload };
    case "ADD_TICKET":
      return {
        ...state,
        myTickets: [action.payload, ...state.myTickets]
      };
    case "UPDATE_TICKET":
      return {
        ...state,
        myTickets: state.myTickets.map((ticket: any) =>
          (ticket.id || ticket._id) === (action.payload.id || action.payload._id) 
            ? action.payload 
            : ticket
        )
      };
    case "DELETE_TICKET":
      return {
        ...state,
        myTickets: state.myTickets.filter((ticket: any) =>
          (ticket.id || ticket._id) !== action.payload
        )
      };

    default:
      return state;
  }
};

export default reducers;



// // Global/reducers.ts
// const initialState = {
//   punchInfo: [],
//   userDetails: {},
//   leaveDetails: {},
//   managerInfo: [],
//   calendarData: [],
//   todayPunch: null,
//   // Timesheet related state
//   timesheetTasks: [],
//   selectedTimesheetDate: null,
//   timesheetProjects: [],
//   monthlyTimesheetData: {},
// };

// const reducers = (state = initialState, action: any) => {
//   switch (action.type) {
//     case "punchInfo":
//       return { ...state, punchInfo: action.payload };
//     case "userDetails":
//       return { ...state, userDetails: action.payload };
//     case "leaveDetails":
//       return { ...state, leaveDetails: action.payload };
//     case "managerInfo":
//       return { ...state, managerInfo: action.payload };
//     case "calendarData":
//       return { ...state, calendarData: action.payload };
//     case "todayPunch":
//       return { ...state, todayPunch: action.payload };
    
//     // Timesheet actions
//     case "SET_TIMESHEET_TASKS":
//       return { ...state, timesheetTasks: action.payload };
//     case "SET_SELECTED_TIMESHEET_DATE":
//       return { ...state, selectedTimesheetDate: action.payload };
//     case "SET_TIMESHEET_PROJECTS":
//       return { ...state, timesheetProjects: action.payload };
//     case "SET_MONTHLY_TIMESHEET_DATA":
//       return { ...state, monthlyTimesheetData: action.payload };
//     case "ADD_TIMESHEET_TASK":
//       return { 
//         ...state, 
//         timesheetTasks: [...state.timesheetTasks, action.payload] 
//       };
//     case "UPDATE_TIMESHEET_TASK":
//       return {
//         ...state,
//         timesheetTasks: state.timesheetTasks.map((task: any) =>
//           task.taskId === action.payload.taskId ? action.payload : task
//         )
//       };
//     case "DELETE_TIMESHEET_TASK":
//       return {
//         ...state,
//         timesheetTasks: state.timesheetTasks.filter((task: any) =>
//           task.taskId !== action.payload
//         )
//       };
    
//     default:
//       return state;
//   }
// };

// export default reducers;
