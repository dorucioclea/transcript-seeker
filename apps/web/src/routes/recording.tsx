'use client';

import type { Meeting as MeetingT } from '@/types';
import { useEffect } from 'react';
import FullSpinner from '@/components/loader';
import { Viewer } from '@/components/viewer';
import { useApiKey } from '@/hooks/use-api-key';
import { fetchBotDetails } from '@/lib/meetingbaas';
import { StorageBucketAPI } from '@/lib/storage-bucket-api';
import { getMeetingByBotId, updateMeeting } from '@/queries';
import { useParams } from 'react-router-dom';
import useSWR from 'swr';

import NotFoundPage from './not-found';

const fetchMeeting = async (botId: string): Promise<MeetingT | null> => {
  if (!botId) throw new Error('No bot ID provided');

  const meeting: MeetingT | null | undefined = await getMeetingByBotId({ botId });
  if (!meeting) return null;

  if (meeting.type === 'local') {
    const storageAPI = new StorageBucketAPI('local_files');
    await storageAPI.init();

    const videoContent = await storageAPI.get(`${meeting.botId}.mp4`);
    if (videoContent && meeting.assets) meeting.assets.video_blob = videoContent;
  }

  return meeting;
};

const updateMeetingData = async (meeting: MeetingT, baasApiKey: string): Promise<MeetingT> => {
  if (meeting.type === 'meetingbaas' && !meeting.endedAt) {
    const data = await fetchBotDetails({
      botId: meeting.botId,
      apiKey: baasApiKey,
    });

    if (data) {
      await updateMeeting({ id: meeting.id, values: { ...data } });
      return { ...meeting, ...data };
    }
  }

  return meeting;
};

export default function MeetingPage() {
  const { botId } = useParams<{ botId: string }>();
  const { apiKey: baasApiKey } = useApiKey({ type: 'meetingbaas' });

  const {
    data: meeting,
    isLoading,
    error,
    mutate,
  } = useSWR<MeetingT | null>(
    ['meeting', botId, baasApiKey],
    () => fetchMeeting(botId!),
    { refreshInterval: 5000 },
  );

  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (meeting && baasApiKey) {
        mutate(updateMeetingData(meeting, baasApiKey));
      }
    }, 5000);

    return () => clearInterval(updateInterval);
  }, [meeting, baasApiKey, mutate]);

  if (error) return <div>Error loading meeting</div>;
  if (!meeting) return isLoading ? <FullSpinner /> : <NotFoundPage />;

  return <Viewer botId={botId!} isLoading={!meeting} meeting={meeting} />;
}
