const getAll = {
  punchInfo: [],
  userDetails : {},
  leaveDetails: {},
  managerInfo:[],
  calendarData : [],

};


const reducers = (state = getAll, action: any) => {
  let {type} : any = action;
  switch (type) {
    case String(type): 
    return { ...state , [`${type}`] : action.payload}

    default:
      return state;
  }
};

export default reducers;
