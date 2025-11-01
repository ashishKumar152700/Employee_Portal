// Services/Timesheet/timesheetService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimesheetProdUrl } from '../../Global/Config';

export interface TimesheetTask {
  taskId?: number;
  taskTitle: string;
  taskDescription: string;
  taskDate: string;
  projectId: number;
  projectName?: string;
  minutes: number;
  minutesSpend?: number;
  billable: boolean | string;
}

export interface Project {
  projectId: number;
  projectName: string;
}

export interface TaskHourCount {
  date: string;
  taskCount: number;
  timeSpend: number; // in minutes
}

export interface MonthlyTaskSummary {
  date: string;
  totalMinutes: number;
  taskCount: number;
  hasTimesheet: boolean;
}

// Cache management
interface CacheData {
  data: any;
  timestamp: number;
  expiresIn: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheData>();

const getCachedData = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.timestamp + cached.expiresIn) {
    console.log(`📋 [Service] Using cached data for: ${key}`);
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
  }
  return null;
};

const setCachedData = (key: string, data: any, expiresIn = CACHE_DURATION) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    expiresIn
  });
  console.log(`📋 [Service] Cached data for: ${key}`);
};

// Helper function to convert API response to our format
const normalizeTask = (apiTask: any): TimesheetTask => {
  const minutes = apiTask.minutesSpend || apiTask.minutes || 0;
  const billable = typeof apiTask.billable === 'string' 
    ? apiTask.billable.toLowerCase() === 'yes' 
    : Boolean(apiTask.billable);

  return {
    taskId: apiTask.taskId,
    taskTitle: apiTask.taskTitle || '',
    taskDescription: apiTask.taskDescription || '',
    taskDate: apiTask.taskDate || '', 
    projectId: apiTask.projectId || 0,
    projectName: apiTask.projectName || 'No Project',
    minutes: minutes,
    minutesSpend: minutes,
    billable: billable
  };
};

// Helper function to get auth headers
const getAuthHeader = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('❌ [Service] Error getting auth token:', error);
    return {
      'Content-Type': 'application/json',
    };
  }
};

// Helper function to handle API responses
const handleApiResponse = async (response: Response, operationName: string) => {
  console.log(`📡 [Service] ${operationName} Response status:`, response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ [Service] ${operationName} API error response:`, errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }
  
  const responseText = await response.text();
  
  try {
    const jsonData = JSON.parse(responseText);
    console.log(`✅ [Service] ${operationName} success`);
    return jsonData;
  } catch (parseError) {
    console.log(`ℹ️ [Service] ${operationName} Non-JSON response, treating as success`);
    return { 
      success: true, 
      message: responseText,
      data: responseText 
    };
  }
};

// Get user task hour count (Main API for calendar dots)
export const getUserTaskHourCount = async (): Promise<TaskHourCount[]> => {
  try {
    const cacheKey = 'taskHourCount';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    console.log('📊 [Service] ===== FETCHING TASK HOUR COUNT =====');
    const headers = await getAuthHeader();
    const response = await fetch(`${TimesheetProdUrl}/task/get-all-task-hour-count-of-user`, {
      method: 'GET',
      headers,
    });
    
    const result = await handleApiResponse(response, 'Hour Count');
    const hourCounts = Array.isArray(result) ? result : (result.data || []);
    
    setCachedData(cacheKey, hourCounts);
    return hourCounts;
  } catch (error) {
    console.error('❌ [Service] Error fetching hour count:', error);
    return [];
  }
};

// Get projects with caching
export const getProjects = async (): Promise<Project[]> => {
  try {
    const cacheKey = 'projects';
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    console.log('📋 [Service] ===== FETCHING PROJECTS =====');
    const headers = await getAuthHeader();
    const response = await fetch(`${TimesheetProdUrl}/user/get-projects`, {
      method: 'GET',
      headers,
    });
    
    const data = await handleApiResponse(response, 'Projects');
    
    const projects: Project[] = [
      { projectId: 0, projectName: 'No Project' }
    ];
    
    let apiProjects = [];
    if (Array.isArray(data)) {
      apiProjects = data;
    } else if (data && Array.isArray(data.data)) {
      apiProjects = data.data;
    }
    
    const uniqueProjects = apiProjects.filter((project: any) => 
      project.projectId !== 0 && 
      project.projectName !== 'No Project' &&
      !projects.some(existing => existing.projectId === project.projectId)
    );
    
    projects.push(...uniqueProjects);
    setCachedData(cacheKey, projects, CACHE_DURATION * 2); // Cache projects longer
    
    return projects;
  } catch (error) {
    console.error('❌ [Service] Error fetching projects:', error);
    return [{ projectId: 0, projectName: 'No Project' }];
  }
};

// Get tasks by specific date with caching
export const getTasksByDate = async (date: string): Promise<TimesheetTask[]> => {
  try {
    const cacheKey = `tasks_${date}`;
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    console.log('📋 [Service] ===== FETCHING TASKS FOR DATE =====');
    console.log('📋 [Service] Date:', date);
    
    const headers = await getAuthHeader();
    const response = await fetch(`${TimesheetProdUrl}/task/get-user-task-by-date?date=${date}`, {
      method: 'GET',
      headers,
    });
    
    const data = await handleApiResponse(response, 'Date Tasks');
    
    let rawTasks = [];
    if (Array.isArray(data)) {
      rawTasks = data;
    } else if (data && Array.isArray(data.data)) {
      rawTasks = data.data;
    }
    
    const normalizedTasks = rawTasks.map((task: any) => {
      const normalizedTask = normalizeTask(task);
      if (!normalizedTask.taskDate) {
        normalizedTask.taskDate = date;
      }
      return normalizedTask;
    });
    
    setCachedData(cacheKey, normalizedTasks);
    return normalizedTasks;
  } catch (error) {
    console.error('❌ [Service] Error fetching tasks by date:', error);
    return [];
  }
};

// Add new tasks
export const addTasks = async (tasks: TimesheetTask[]): Promise<any> => {
  try {
    console.log('📝 [Service] ===== ADDING TASKS =====');
    const headers = await getAuthHeader();
    const response = await fetch(`${TimesheetProdUrl}/task/add-task`, {
      method: 'POST',
      headers,
      body: JSON.stringify(tasks),
    });
    
    const result = await handleApiResponse(response, 'Add Task');
    
    // Clear relevant caches
    tasks.forEach(task => {
      cache.delete(`tasks_${task.taskDate.split('T')[0]}`);
    });
    cache.delete('taskHourCount');
    
    return result;
  } catch (error) {
    console.error('❌ [Service] Error adding tasks:', error);
    if (error.message && error.message.includes('JSON Parse')) {
      console.log('ℹ️ [Service] Treating JSON parse error as success for add task');
      // Clear caches anyway since operation likely succeeded
      tasks.forEach(task => {
        cache.delete(`tasks_${task.taskDate.split('T')[0]}`);
      });
      cache.delete('taskHourCount');
      return { success: true, message: 'Task added successfully' };
    }
    throw error;
  }
};

// Update existing task
export const updateTask = async (task: TimesheetTask): Promise<any> => {
  try {
    console.log('📝 [Service] ===== UPDATING TASK =====');
    const headers = await getAuthHeader();
    const updateData = {
      taskId: task.taskId,
      taskTitle: task.taskTitle,
      taskDescription: task.taskDescription,
      minutesSpend: task.minutes,
      billable: task.billable,
      projectId: task.projectId,
      projectName: task.projectName
    };
    
    const response = await fetch(`${TimesheetProdUrl}/task/update-task`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData),
    });
    
    const result = await handleApiResponse(response, 'Update Task');
    
    // Clear relevant caches
    if (task.taskDate) {
      cache.delete(`tasks_${task.taskDate.split('T')[0]}`);
    }
    cache.delete('taskHourCount');
    
    return result;
  } catch (error) {
    console.error('❌ [Service] Error updating task:', error);
    if (error.message && error.message.includes('JSON Parse')) {
      console.log('ℹ️ [Service] Treating JSON parse error as success for update task');
      // Clear caches anyway
      if (task.taskDate) {
        cache.delete(`tasks_${task.taskDate.split('T')[0]}`);
      }
      cache.delete('taskHourCount');
      return { success: true, message: 'Task updated successfully' };
    }
    throw error;
  }
};

// Delete task
export const deleteTask = async (taskId: number): Promise<any> => {
  try {
    console.log('🗑️ [Service] ===== DELETING TASK =====');
    const headers = await getAuthHeader();
    const response = await fetch(`${TimesheetProdUrl}/task/delete?taskId=${taskId}`, {
      method: 'DELETE',
      headers,
    });
    
    const result = await handleApiResponse(response, 'Delete Task');
    
    // Clear all caches as we don't know which date the task belonged to
    cache.clear();
    
    return result;
  } catch (error) {
    console.error('❌ [Service] Error deleting task:', error);
    if (error.message && error.message.includes('JSON Parse')) {
      console.log('ℹ️ [Service] Treating JSON parse error as success for delete task');
      cache.clear();
      return { success: true, message: 'Task deleted successfully' };
    }
    throw error;
  }
};

// Process hour count data for calendar
export const processHourCountForCalendar = (hourCounts: TaskHourCount[]): { [date: string]: MonthlyTaskSummary } => {
  const summary: { [date: string]: MonthlyTaskSummary } = {};
  
  console.log('🔄 [Service] Processing hour count data:', hourCounts.length, 'entries');
  
  hourCounts.forEach((entry, index) => {
    if (entry.date) {
      summary[entry.date] = {
        date: entry.date,
        totalMinutes: entry.timeSpend || 0,
        taskCount: entry.taskCount || 0,
        hasTimesheet: true
      };
      
      if (index < 5) { // Log first 5 entries for debugging
        console.log(`🔄 [Service] Entry ${index + 1}: ${entry.date} - ${entry.timeSpend}min (${(entry.timeSpend/60).toFixed(1)}h)`);
      }
    }
  });
  
  console.log('📊 [Service] Processed summary for', Object.keys(summary).length, 'dates');
  return summary;
};

// Clear specific cache
export const clearCache = (key?: string) => {
  if (key) {
    cache.delete(key);
    console.log(`🗑️ [Service] Cleared cache for: ${key}`);
  } else {
    cache.clear();
    console.log('🗑️ [Service] Cleared all cache');
  }
};

// Get cache stats (for debugging)
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
};


// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { TimesheetProdUrl } from '../../Global/Config';

// export interface TimesheetTask {
//   taskId?: number;
//   taskTitle: string;
//   taskDescription: string;
//   taskDate: string;
//   projectId: number;
//   projectName?: string;
//   minutes: number;
//   minutesSpend?: number;
//   billable: boolean | string;
// }

// export interface Project {
//   projectId: number;
//   projectName: string;
// }

// export interface MonthlyTaskSummary {
//   date: string;
//   totalMinutes: number;
//   taskCount: number;
//   hasTimesheet: boolean;
// }

// // Helper function to convert API response to our format
// const normalizeTask = (apiTask: any): TimesheetTask => {
//   const minutes = apiTask.minutesSpend || apiTask.minutes || 0;
//   const billable = typeof apiTask.billable === 'string' 
//     ? apiTask.billable.toLowerCase() === 'yes' 
//     : Boolean(apiTask.billable);

//   return {
//     taskId: apiTask.taskId,
//     taskTitle: apiTask.taskTitle || '',
//     taskDescription: apiTask.taskDescription || '',
//     taskDate: apiTask.taskDate || '', // Fixed: ensure taskDate is included
//     projectId: apiTask.projectId || 0,
//     projectName: apiTask.projectName || 'No Project',
//     minutes: minutes,
//     minutesSpend: minutes,
//     billable: billable
//   };
// };

// // Helper function to get auth headers
// const getAuthHeader = async () => {
//   try {
//     const token = await AsyncStorage.getItem('accessToken');
//     console.log('🔑 [Service] Token found:', !!token);
//     return {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`
//     };
//   } catch (error) {
//     console.error('❌ [Service] Error getting auth token:', error);
//     return {
//       'Content-Type': 'application/json',
//     };
//   }
// };

// // Helper function to handle API responses that might not be JSON
// const handleApiResponse = async (response: Response, operationName: string) => {
//   console.log(`📡 [Service] ${operationName} Response status:`, response.status);
  
//   if (!response.ok) {
//     const errorText = await response.text();
//     console.error(`❌ [Service] ${operationName} API error response:`, errorText);
//     throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
//   }
  
//   const responseText = await response.text();
//   console.log(`📡 [Service] ${operationName} Raw response:`, responseText);
  
//   // Try to parse as JSON, if it fails, return a success object
//   try {
//     const jsonData = JSON.parse(responseText);
//     console.log(`✅ [Service] ${operationName} JSON response:`, JSON.stringify(jsonData, null, 2));
//     return jsonData;
//   } catch (parseError) {
//     console.log(`ℹ️ [Service] ${operationName} Non-JSON response, treating as success:`, responseText);
//     return { 
//       success: true, 
//       message: responseText,
//       data: responseText 
//     };
//   }
// };

// // Get projects from API
// export const getProjects = async (): Promise<Project[]> => {
//   try {
//     console.log('📋 [Service] ===== FETCHING PROJECTS =====');
//     const headers = await getAuthHeader();
//     const response = await fetch(`${TimesheetProdUrl}/user/get-projects`, {
//       method: 'GET',
//       headers,
//     });
    
//     const data = await handleApiResponse(response, 'Projects');
    
//     // Start with "No Project"
//     const projects: Project[] = [
//       { projectId: 0, projectName: 'No Project' }
//     ];
    
//     // Add API projects if available
//     let apiProjects = [];
//     if (Array.isArray(data)) {
//       apiProjects = data;
//     } else if (data && Array.isArray(data.data)) {
//       apiProjects = data.data;
//     }
    
//     // Filter unique projects
//     const uniqueProjects = apiProjects.filter((project: any) => 
//       project.projectId !== 0 && 
//       project.projectName !== 'No Project' &&
//       !projects.some(existing => existing.projectId === project.projectId)
//     );
    
//     projects.push(...uniqueProjects);
    
//     // console.log('📋 [Service] Final projects list:', JSON.stringify(projects, null, 2));
//     return projects;
//   } catch (error) {
//     console.error('❌ [Service] Error fetching projects:', error);
//     return [{ projectId: 0, projectName: 'No Project' }];
//   }
// };

// // Get all tasks for a specific month
// export const getAllTasksForMonth = async (year: number, month: number): Promise<TimesheetTask[]> => {
//   try {
//     const monthStr = String(month).padStart(2, '0');
//     const apiUrl = `${TimesheetProdUrl}/task/all-task-of-month?year=${year}&month=${monthStr}`;
    
//     console.log('📅 [Service] ===== FETCHING MONTHLY TASKS =====');
//     console.log('📅 [Service] API URL:', apiUrl);
    
//     const headers = await getAuthHeader();
//     const response = await fetch(apiUrl, {
//       method: 'GET',
//       headers,
//     });
    
//     const data = await handleApiResponse(response, 'Monthly Tasks');
    
//     // Handle different response structures
//     let rawTasks = [];
//     if (Array.isArray(data)) {
//       rawTasks = data;
//     } else if (data && Array.isArray(data.data)) {
//       rawTasks = data.data;
//     }
    
//     console.log('📅 [Service] Raw tasks array length:', rawTasks.length);
    
//     // Normalize tasks and add date if missing
//     const normalizedTasks = rawTasks.map((task: any) => {
//       const normalizedTask = normalizeTask(task);
//       // If taskDate is missing, try to infer it from the API call context
//       if (!normalizedTask.taskDate && task.taskDate) {
//         normalizedTask.taskDate = task.taskDate;
//       }
//       return normalizedTask;
//     });
    
//     console.log('📅 [Service] Normalized tasks count:', normalizedTasks.length);
//     if (normalizedTasks.length > 0) {
//       console.log('📅 [Service] First normalized task:', JSON.stringify(normalizedTasks[0], null, 2));
//     }
    
//     return normalizedTasks;
//   } catch (error) {
//     console.error('❌ [Service] Error fetching monthly tasks:', error);
//     return [];
//   }
// };

// // Get tasks by specific date
// export const getTasksByDate = async (date: string): Promise<TimesheetTask[]> => {
//   try {
//     const apiUrl = `${TimesheetProdUrl}/task/get-user-task-by-date?date=${date}`;
    
//     console.log('📋 [Service] ===== FETCHING TASKS FOR DATE =====');
//     console.log('📋 [Service] API URL:', apiUrl);
    
//     const headers = await getAuthHeader();
//     const response = await fetch(apiUrl, {
//       method: 'GET',
//       headers,
//     });
    
//     const data = await handleApiResponse(response, 'Date Tasks');
    
//     let rawTasks = [];
//     if (Array.isArray(data)) {
//       rawTasks = data;
//     } else if (data && Array.isArray(data.data)) {
//       rawTasks = data.data;
//     }
    
//     console.log('📋 [Service] Raw tasks array length:', rawTasks.length);
    
//     // Normalize tasks and ensure date is set
//     const normalizedTasks = rawTasks.map((task: any) => {
//       const normalizedTask = normalizeTask(task);
//       if (!normalizedTask.taskDate) {
//         normalizedTask.taskDate = date; // Use the requested date if missing
//       }
//       return normalizedTask;
//     });
    
//     console.log('📋 [Service] Normalized tasks count:', normalizedTasks.length);
    
//     if (normalizedTasks.length > 0) {
//       normalizedTasks.forEach((task: TimesheetTask, index: number) => {
//         console.log(`📋 [Service] Task ${index + 1}:`, {
//           id: task.taskId,
//           title: task.taskTitle,
//           minutes: task.minutes,
//           date: task.taskDate, // Should now have a value
//           projectId: task.projectId
//         });
//       });
//     }
    
//     return normalizedTasks;
//   } catch (error) {
//     console.error('❌ [Service] Error fetching tasks by date:', error);
//     return [];
//   }
// };

// // Add new tasks
// export const addTasks = async (tasks: TimesheetTask[]): Promise<any> => {
//   try {
//     const apiUrl = `${TimesheetProdUrl}/task/add-task`;
    
//     console.log('📝 [Service] ===== ADDING TASKS =====');
//     console.log('📝 [Service] API URL:', apiUrl);
//     console.log('📝 [Service] Task data being sent:', JSON.stringify(tasks, null, 2));
    
//     const headers = await getAuthHeader();
//     const response = await fetch(apiUrl, {
//       method: 'POST',
//       headers,
//       body: JSON.stringify(tasks),
//     });
    
//     const result = await handleApiResponse(response, 'Add Task');
//     return result;
//   } catch (error) {
//     console.error('❌ [Service] Error adding tasks:', error);
//     throw error;
//   }
// };

// // Update existing task
// export const updateTask = async (task: TimesheetTask): Promise<any> => {
//   try {
//     const apiUrl = `${TimesheetProdUrl}/task/update-task`;
//     const updateData = {
//       taskId: task.taskId,
//       taskTitle: task.taskTitle,
//       taskDescription: task.taskDescription,
//       minutesSpend: task.minutes,
//       billable: task.billable,
//       projectId: task.projectId,
//       projectName: task.projectName
//     };
    
//     console.log('📝 [Service] ===== UPDATING TASK =====');
//     console.log('📝 [Service] API URL:', apiUrl);
//     console.log('📝 [Service] Update data being sent:', JSON.stringify(updateData, null, 2));
    
//     const headers = await getAuthHeader();
//     const response = await fetch(apiUrl, {
//       method: 'PUT',
//       headers,
//       body: JSON.stringify(updateData),
//     });
    
//     const result = await handleApiResponse(response, 'Update Task');
//     return result;
//   } catch (error) {
//     console.error('❌ [Service] Error updating task:', error);
//     throw error;
//   }
// };

// // Delete task
// export const deleteTask = async (taskId: number): Promise<any> => {
//   try {
//     const apiUrl = `${TimesheetProdUrl}/task/delete?taskId=${taskId}`;
    
//     console.log('🗑️ [Service] ===== DELETING TASK =====');
//     console.log('🗑️ [Service] API URL:', apiUrl);
    
//     const headers = await getAuthHeader();
//     const response = await fetch(apiUrl, {
//       method: 'DELETE',
//       headers,
//     });
    
//     const result = await handleApiResponse(response, 'Delete Task');
//     return result;
//   } catch (error) {
//     console.error('❌ [Service] Error deleting task:', error);
//     throw error;
//   }
// };

// // Get user task hour count
// export const getUserTaskHourCount = async (): Promise<any> => {
//   try {
//     const apiUrl = `${TimesheetProdUrl}/task/get-all-task-hour-count-of-user`;
    
//     console.log('📊 [Service] ===== FETCHING TASK HOUR COUNT =====');
//     console.log('📊 [Service] API URL:', apiUrl);
    
//     const headers = await getAuthHeader();
//     const response = await fetch(apiUrl, {
//       method: 'GET',
//       headers,
//     });
    
//     const result = await handleApiResponse(response, 'Hour Count');
//     return result;
//   } catch (error) {
//     console.error('❌ [Service] Error fetching hour count:', error);
//     throw error;
//   }
// };

// // Process monthly tasks into summary
// export const processMonthlyTaskSummary = (tasks: TimesheetTask[]): { [date: string]: MonthlyTaskSummary } => {
//   const summary: { [date: string]: MonthlyTaskSummary } = {};
  
//   console.log('🔄 [Service] ===== PROCESSING TASK SUMMARY =====');
//   console.log('🔄 [Service] Processing', tasks ? tasks.length : 'undefined', 'tasks');
  
//   if (!tasks || !Array.isArray(tasks)) {
//     console.log('⚠️ [Service] Tasks is not an array or is undefined');
//     return summary;
//   }
  
//   tasks.forEach((task, index) => {
//     if (!task || !task.taskDate) {
//       console.log(`⚠️ [Service] Invalid task at index ${index}:`, task);
//       return;
//     }
    
//     const taskDate = task.taskDate.split('T')[0];
    
//     if (!summary[taskDate]) {
//       summary[taskDate] = {
//         date: taskDate,
//         totalMinutes: 0,
//         taskCount: 0,
//         hasTimesheet: true
//       };
//     }
    
//     const minutes = task.minutes || task.minutesSpend || 0;
//     summary[taskDate].totalMinutes += minutes;
//     summary[taskDate].taskCount += 1;
    
//     console.log(`🔄 [Service] Task ${index + 1}: Date=${taskDate}, Minutes=${minutes}, Running Total=${summary[taskDate].totalMinutes}`);
//   });
  
//   // Log final summary
//   Object.keys(summary).forEach(date => {
//     const data = summary[date];
//     console.log(`📊 [Service] Date Summary ${date}: Tasks=${data.taskCount}, Minutes=${data.totalMinutes}, Hours=${(data.totalMinutes/60).toFixed(1)}`);
//   });
  
//   return summary;
// };
