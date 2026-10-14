import { listNotifications } from '../modals/notificationModal';

export function myNotifications(userId: number) {
  return listNotifications(userId);
}