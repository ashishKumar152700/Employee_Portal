const initialState = {
  punchInfo: [],
  userDetails: {},
  leaveDetails: {},
  managerInfo: [],
  calendarData: [],
  todayPunch: null, // Add todayPunch to store current day's punch data
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
    default:
      return state;
  }
};

export default reducers;
