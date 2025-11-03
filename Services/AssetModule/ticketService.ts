// Services/Ticket/ticketService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TimesheetProdUrl } from '../../Global/Config';


const baseUrl = TimesheetProdUrl ;

export interface Category {
  _id?: string;
  id?: string;
  category: string;
  type: string;
  role?: string;
  visibleToUser?: boolean;
}

export interface Ticket {
  _id?: string;
  id?: string | number;
  category: string;
  status: string;
  ticketRaisedOn: string;
  userId?: string;
  userName?: string;
  remark?: string;
  code?: number;
  state?: number;
  actionToken?: string;
}

export interface TicketStats {
  total: number;
  pending: number;
  approved: number;
  allocated: number;
  rejected: number;
  cancelled: number;
}

// Helper function to get auth headers
const getAuthHeader = async () => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    console.log('🔑 [Ticket Service] Token found:', !!token);
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  } catch (error) {
    console.error('  [Ticket Service] Error getting auth token:', error);
    return {
      'Content-Type': 'application/json',
    };
  }
};

// Helper function to handle API responses that might not be JSON
const handleApiResponse = async (response: Response, operationName: string) => {
  console.log(`📡 [Ticket Service] ${operationName} Response status:`, response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`  [Ticket Service] ${operationName} API error response:`, errorText);
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }
  
  const responseText = await response.text();
  console.log(`📡 [Ticket Service] ${operationName} Raw response:`, responseText.substring(0, 200) + '...');
  
  // Try to parse as JSON, if it fails, return a success object
  try {
    const jsonData = JSON.parse(responseText);
    console.log(`✅ [Ticket Service] ${operationName} JSON response:`, JSON.stringify(jsonData, null, 2));
    return jsonData;
  } catch (parseError) {
    console.log(`ℹ️ [Ticket Service] ${operationName} Non-JSON response, treating as success:`, responseText.substring(0, 100));
    return { 
      success: true, 
      message: responseText,
      data: responseText 
    };
  }
};

// Get categories by role (IT categories only)
export const getCategoriesByRole = async (): Promise<Category[]> => {
  try {
    console.log('📋 [Ticket Service] ===== FETCHING CATEGORIES =====');
    const headers = await getAuthHeader();
    const response = await fetch(`${baseUrl}/category/get-by-role`, {
      method: 'GET',
      headers,
    });
    
    const data = await handleApiResponse(response, 'Categories');
    
    // Handle case where data might be wrapped in success object
    let categories = Array.isArray(data) ? data : (data.data || []);
    
    // Filter only IT categories like web version
    const itCategories = categories.filter((item: Category) => item.type === 'IT');
    console.log('📋 [Ticket Service] IT Categories filtered:', itCategories.length);
    
    return itCategories;
  } catch (error) {
    console.error('  [Ticket Service] Error fetching categories:', error);
    throw error;
  }
};

// Raise ticket for categories
export const raiseTicket = async (categories: string[]): Promise<any> => {
  try {
    console.log('🎫 [Ticket Service] ===== RAISING TICKET =====');
    console.log('🎫 [Ticket Service] Categories:', categories);
    
    const headers = await getAuthHeader();
    const response = await fetch(`${baseUrl}/ticket/add-ticket`, {
      method: 'POST',
      headers,
      body: JSON.stringify(categories),
    });
    
    const result = await handleApiResponse(response, 'Raise Ticket');
    
    // Return success even if response is non-JSON (since operation succeeded)
    return result.success !== false ? { success: true, message: 'Ticket raised successfully' } : result;
  } catch (error) {
    console.error('  [Ticket Service] Error raising ticket:', error);
    // If the error is just JSON parsing but status was 200, treat as success
    if (error.message && error.message.includes('JSON Parse')) {
      console.log('ℹ️ [Ticket Service] Treating JSON parse error as success for raise ticket');
      return { success: true, message: 'Ticket raised successfully' };
    }
    throw error;
  }
};

// Get my tickets
export const getMyTickets = async (): Promise<Ticket[]> => {
  try {
    console.log('📋 [Ticket Service] ===== FETCHING MY TICKETS =====');
    const headers = await getAuthHeader();
    const response = await fetch(`${baseUrl}/ticket/get-my-ticket`, {
      method: 'GET',
      headers,
    });
    
    const data = await handleApiResponse(response, 'My Tickets');
    
    // Handle case where data might be wrapped in success object
    let tickets = Array.isArray(data) ? data : (data.data || []);
    
    return tickets;
  } catch (error) {
    console.error('  [Ticket Service] Error fetching my tickets:', error);
    throw error;
  }
};

// Cancel ticket
export const cancelTicket = async (ticketId: string): Promise<any> => {
  try {
    console.log('  [Ticket Service] ===== CANCELLING TICKET =====');
    console.log('  [Ticket Service] Ticket ID:', ticketId);
    
    const headers = await getAuthHeader();
    const response = await fetch(`${baseUrl}/ticket/delete-my-ticket?ticketId=${ticketId}`, {
      method: 'PUT',
      headers,
    });
    
    const result = await handleApiResponse(response, 'Cancel Ticket');
    
    // Return success even if response is non-JSON (since operation succeeded)
    return result.success !== false ? { success: true, message: 'Ticket cancelled successfully' } : result;
  } catch (error) {
    console.error('  [Ticket Service] Error cancelling ticket:', error);
    // If the error is just JSON parsing but status was 200, treat as success
    if (error.message && error.message.includes('JSON Parse')) {
      console.log('ℹ️ [Ticket Service] Treating JSON parse error as success for cancel ticket');
      return { success: true, message: 'Ticket cancelled successfully' };
    }
    throw error;
  }
};

// Calculate ticket statistics
export const calculateTicketStats = (tickets: Ticket[]): TicketStats => {
  console.log('📊 [Ticket Service] Calculating stats for', tickets.length, 'tickets');
  
  const stats: TicketStats = {
    total: tickets.length,
    pending: 0,
    approved: 0,
    allocated: 0,
    rejected: 0,
    cancelled: 0,
  };

  tickets.forEach((ticket, index) => {
    const status = ticket.status.toLowerCase();
    console.log(`📊 [Ticket Service] Ticket ${index + 1}: ${ticket.category} - ${status}`);
    
    if (status.includes('pending') || status.includes('waiting')) {
      stats.pending++;
    } else if (status.includes('allocated')) {
      stats.allocated++;
    } else if (status.includes('approved') || status === 'manager') {
      stats.approved++;
    } else if (status.includes('rejected')) {
      stats.rejected++;
    } else if (status.includes('cancelled')) {
      stats.cancelled++;
    }
  });

  console.log('📊 [Ticket Service] Final stats:', stats);
  return stats;
};

