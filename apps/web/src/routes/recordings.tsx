import { useEffect } from 'react';
import { Header } from '@/components/header';
import { columns } from '@/components/meeting/columns';
import { DataTable } from '@/components/meeting/data-table';
import { ImportMeeting } from '@/components/meeting/meeting-import';
import ServerAlert from '@/components/server-alert';
import ServerAvailablity from '@/components/server-availablity';
import { useApiKey } from '@/hooks/use-api-key';
import { useMeetings } from '@/hooks/use-meetings';
import { fetchBotDetails } from '@/lib/meetingbaas';
import { updateMeeting } from '@/queries';
import { useServerAvailabilityStore } from '@/store';
import { differenceInHours } from 'date-fns';
import { mutate } from 'swr';

import { Separator } from '@meeting-baas/ui/separator';
import { Skeleton } from '@meeting-baas/ui/skeleton';

function RecordingsPage() {
  const serverAvailability = useServerAvailabilityStore((state) => state.serverAvailability);

  const { apiKey: baasApiKey, isLoading: isBaasApiKeyLoading } = useApiKey({ type: 'meetingbaas' });
  const { meetings, isLoading } = useMeetings();

  useEffect(() => {
    if (!baasApiKey) return;
    meetings?.map(async (meeting) => {
      if (meeting.status === 'loading' && meeting.type === 'meetingbaas') {
        const data = await fetchBotDetails({
          botId: meeting.botId,
          apiKey: baasApiKey,
        });
        if (!data) return;
        // todo: the status is loaded here.
        await updateMeeting({ id: meeting.id, values: { ...data, status: 'loaded' } });
        mutate('meetings');
      }

      if (meeting.status === 'loaded' && meeting.type === 'meetingbaas') {
        if (!meeting.updatedAt) return;
        const now = new Date();
        if (differenceInHours(now, meeting.updatedAt) >= 1) {
          const data = await fetchBotDetails({
            botId: meeting.botId,
            apiKey: baasApiKey,
          });
          if (!data) return;

          await updateMeeting({
            id: meeting.id,
            values: {
              assets: data.assets,
            },
          });
          mutate('meetings');
          mutate(['meeting', meeting.id]);
        }
      }
    });
  }, [meetings, isLoading, isBaasApiKeyLoading]);

  return (
    <div className="h-full">
      <Header
        path={[
          {
            name: 'Recordings',
          },
        ]}
      />
      <div className="p-4">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">View Recordings</h2>
          <p className="text-muted-foreground">View your recorded or uploaded meetings here.</p>
        </div>
        <Separator className="my-4" />

        <div className="my-4 bg-background">
          <ServerAlert mode={serverAvailability} />
        </div>
        <ImportMeeting />

        {meetings && meetings.length > 0 ? (
          <DataTable data={meetings} columns={columns} />
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2 rounded-b-md border-x border-b border-border px-2 pb-2 pt-1 empty:pb-0">
              {isLoading ? (
                <>
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 min-w-32" />
                </>
              ) : (
                <></>
              )}
            </div>
            <p>{isLoading ? 'Loading...' : 'No results.'}</p>
          </>
        )}
      </div>
      <div className="fixed bottom-4 left-0 right-0 flex w-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <ServerAvailablity />
      </div>
    </div>
  );
}

export default RecordingsPage;
