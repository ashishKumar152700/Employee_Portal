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
    console.log(` [Service] Using cached data for: ${key}`);
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
  console.log(` [Service] Cached data for: ${key}`);
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

// Add this to your timesheetService.ts
export const clearAllCache = () => {
  // If you have a cache Map in your service
  if (typeof cache !== 'undefined' && cache.clear) {
    cache.clear();
    console.log(' [Service] All cache cleared');
  }
  
  // Clear any other in-memory data structures you might have
  console.log(' [Service] Cache cleanup completed');
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
    console.error(' [Service] Error getting auth token:', error);
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
    console.error(` [Service] ${operationName} API error response:`, errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }
  
  const responseText = await response.text();
  
  try {
    const jsonData = JSON.parse(responseText);
    console.log(` [Service] ${operationName} success`);
    return jsonData;
  } catch (parseError) {
    console.log(`ℹ[Service] ${operationName} Non-JSON response, treating as success`);
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

    console.log(' [Service] ===== FETCHING TASK HOUR COUNT =====');
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
    console.error(' [Service] Error fetching hour count:', error);
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

    console.log(' [Service] ===== FETCHING PROJECTS =====');
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
    console.error(' [Service] Error fetching projects:', error);
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

    console.log(' [Service] ===== FETCHING TASKS FOR DATE =====');
    console.log(' [Service] Date:', date);
    
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
    console.error(' [Service] Error fetching tasks by date:', error);
    return [];
  }
};

// Add new tasks
export const addTasks = async (tasks: TimesheetTask[]): Promise<any> => {
  try {
    console.log(' [Service] ===== ADDING TASKS =====');
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
    console.error(' [Service] Error adding tasks:', error);
    if (error.message && error.message.includes('JSON Parse')) {
      console.log(' [Service] Treating JSON parse error as success for add task');
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
    console.log(' [Service] ===== UPDATING TASK =====');
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
    console.error(' [Service] Error updating task:', error);
    if (error.message && error.message.includes('JSON Parse')) {
      console.log(' [Service] Treating JSON parse error as success for update task');
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
    console.log(' [Service] ===== DELETING TASK =====');
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
    console.error(' [Service] Error deleting task:', error);
    if (error.message && error.message.includes('JSON Parse')) {
      console.log(' [Service] Treating JSON parse error as success for delete task');
      cache.clear();
      return { success: true, message: 'Task deleted successfully' };
    }
    throw error;
  }
};

// Process hour count data for calendar
export const processHourCountForCalendar = (hourCounts: TaskHourCount[]): { [date: string]: MonthlyTaskSummary } => {
  const summary: { [date: string]: MonthlyTaskSummary } = {};
  
  console.log(' [Service] Processing hour count data:', hourCounts.length, 'entries');
  
  hourCounts.forEach((entry, index) => {
    if (entry.date) {
      summary[entry.date] = {
        date: entry.date,
        totalMinutes: entry.timeSpend || 0,
        taskCount: entry.taskCount || 0,
        hasTimesheet: true
      };
      
      if (index < 5) { // Log first 5 entries for debugging
        console.log(` [Service] Entry ${index + 1}: ${entry.date} - ${entry.timeSpend}min (${(entry.timeSpend/60).toFixed(1)}h)`);
      }
    }
  });
  
  console.log(' [Service] Processed summary for', Object.keys(summary).length, 'dates');
  return summary;
};

// Clear specific cache
export const clearCache = (key?: string) => {
  if (key) {
    cache.delete(key);
    console.log(` [Service] Cleared cache for: ${key}`);
  } else {
    cache.clear();
    console.log(' [Service] Cleared all cache');
  }
};

// Get cache stats (for debugging)
export const getCacheStats = () => {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
};

