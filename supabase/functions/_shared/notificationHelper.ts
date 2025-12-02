// Shared helper for creating user notifications

type NotificationType = 
  | 'ROLE_CHANGED'
  | 'STATUS_CHANGED'
  | 'PROFILE_UPDATED'
  | 'USER_CREATED'
  | 'PASSWORD_RESET';

interface NotificationData {
  oldRole?: string;
  newRole?: string;
  oldStatus?: string;
  newStatus?: string;
  adminName?: string;
}

function generateNotificationContent(type: NotificationType, data: NotificationData): { title: string; message: string } {
  switch (type) {
    case 'ROLE_CHANGED':
      return {
        title: 'Role Updated',
        message: `Your role has been changed from "${data.oldRole || 'Unknown'}" to "${data.newRole || 'Unknown'}".`
      };
    case 'STATUS_CHANGED':
      const statusText = data.newStatus === 'active' ? 'activated' : 'deactivated';
      return {
        title: 'Account Status Updated',
        message: `Your account has been ${statusText}. ${data.newStatus === 'active' ? 'You can now log in.' : 'Please contact an administrator for more information.'}`
      };
    case 'PROFILE_UPDATED':
      return {
        title: 'Profile Updated by Admin',
        message: 'Your profile information has been updated by an administrator.'
      };
    case 'USER_CREATED':
      return {
        title: 'Welcome to Slate AI',
        message: 'Your account has been successfully created. Please log in to continue.'
      };
    case 'PASSWORD_RESET':
      return {
        title: 'Password Reset',
        message: 'Your password has been reset by an administrator. Please check your email for new login credentials.'
      };
    default:
      return {
        title: 'Notification',
        message: 'You have a new notification.'
      };
  }
}

export async function createUserNotification(
  supabase: any,
  userId: string,
  type: NotificationType,
  data: NotificationData = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const { title, message } = generateNotificationContent(type, data);
    
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        is_read: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Failed to create notification:', error);
      return { success: false, error: error.message };
    }
    
    console.log(`Notification sent to user ${userId}: ${type}`);
    return { success: true };
  } catch (err: any) {
    console.error('Error creating notification:', err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}
