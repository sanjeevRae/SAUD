import type { Metadata } from 'next';
import ProfileDashboard from '@/views/ProfileDashboard';

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Manage your Saud Leather account profile.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfilePage() {
  return <ProfileDashboard />;
}
