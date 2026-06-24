import { getPublicProfile } from '@/lib/api';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PublicProfileClient } from './public-profile-client';

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  try {
    const profile = await getPublicProfile(username);
    return {
      title: `${profile.displayName || profile.username} | Tác giả trên Văn Chương Mạn Đàm`,
      description: profile.bio || `Xem các tài liệu được chia sẻ bởi ${profile.displayName || profile.username}`,
    };
  } catch (e) {
    return { title: 'Người dùng không tồn tại' };
  }
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  
  try {
    const profile = await getPublicProfile(username);
    if (!profile) notFound();
    return <PublicProfileClient profile={profile} />;
  } catch (e) {
    notFound();
  }
}
