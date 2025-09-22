import { useState, useEffect, useMemo } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery, useQueries } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Play, Clock, Megaphone } from "lucide-react";

export default function DisplayBoard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { lastMessage } = useWebSocket();

  const { data: departments } = useQuery<any[]>({
    queryKey: ['/api/departments'],
  });

  const { data: announcements } = useQuery<any[]>({
    queryKey: ['/api/announcements'],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);
  // Load queues for each department
  const deptList: any[] = Array.isArray(departments) ? (departments as any[]) : [];
  const queueQueries = useQueries({
    queries: deptList.map((dept: any) => ({
      queryKey: ['/api/departments', dept.id, 'queue'],
      refetchInterval: 5000,
      refetchOnWindowFocus: false,
      staleTime: 0,
    })),
  });

  // Build computed views
  const { currentlyServing, queueStatus } = useMemo(() => {
    const serving: Array<{ tokenNumber: string; departmentName: string; startTime?: string }> = [];
    const status: Array<{ departmentName: string; status: string; nextToken: string; inQueue: number; estWait: string; statusColor: string }> = [];
    const qResults: any[] = (queueQueries as any[]) || [];
    deptList.forEach((dept: any, idx: number) => {
      const q: any[] = (qResults[idx]?.data as any[]) || [];
      const servingAppt = q.find(a => a.status === 'serving');
      if (servingAppt) {
        serving.push({
          tokenNumber: servingAppt.tokenNumber,
          departmentName: dept.name,
          startTime: servingAppt.actualStartTime ? new Date(servingAppt.actualStartTime).toLocaleTimeString() : undefined,
        });
      }
      const nextWaiting = q.find(a => a.status === 'waiting' || a.status === 'confirmed');
      status.push({
        departmentName: dept.name,
        status: 'Active',
        nextToken: nextWaiting?.tokenNumber || '- -',
        inQueue: q.length,
        estWait: typeof nextWaiting?.estimatedWaitTime === 'number' ? `${nextWaiting.estimatedWaitTime}m` : '0m',
        statusColor: 'bg-green-600',
      });
    });
    // show up to 3 serving tokens
    return { currentlyServing: serving.slice(0, 3), queueStatus: status };
  }, [deptList, queueQueries]);

  return (
    <div className="bg-black text-white min-h-screen p-8" data-testid="display-board">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-2">eQueue 2.0</h1>
        <p className="text-xl text-gray-300">Government Services Queue Management</p>
        <div className="text-lg text-gray-400 mt-2" data-testid="text-current-time">
          {format(currentTime, 'EEEE, MMMM dd, yyyy - h:mm a')}
        </div>
      </div>

      {/* Main Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Currently Serving */}
        <div className="bg-gray-900 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-green-400 flex items-center justify-center">
            <Play className="mr-3" size={32} />
            NOW SERVING
          </h2>
          
          <div className="space-y-6">
            {currentlyServing.map((service, index) => (
              <div 
                key={service.tokenNumber} 
                className={`${
                  index === 0 ? 'bg-green-800 animate-pulse' : 
                  index === 1 ? 'bg-blue-800' : 'bg-purple-800'
                } rounded-lg p-6`}
                data-testid={`serving-${service.tokenNumber}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-6xl font-bold text-white mb-2">
                      {service.tokenNumber}
                    </div>
                    <div className={`text-xl ${
                      index === 0 ? 'text-green-100' : 
                      index === 1 ? 'text-blue-100' : 'text-purple-100'
                    }`}>
                      {service.departmentName}
                    </div>
                    
                  </div>
                  <div className="text-right">
                    <div className={`text-lg ${
                      index === 0 ? 'text-green-200' : 
                      index === 1 ? 'text-blue-200' : 'text-purple-200'
                    }`}>
                      Started: {service.startTime || '-'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Queue Status */}
        <div className="bg-gray-900 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-yellow-400 flex items-center justify-center">
            <Clock className="mr-3" size={32} />
            QUEUE STATUS
          </h2>
          
          <div className="space-y-4">
            {queueStatus.map((dept, index) => (
              <div key={dept.departmentName} className="bg-gray-800 rounded-lg p-4" data-testid={`queue-status-${index}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-semibold text-white">{dept.departmentName}</h3>
                  <Badge className={`${dept.statusColor} text-white px-3 py-1 rounded-full text-sm`}>
                    {dept.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-yellow-400">{dept.nextToken}</div>
                    <div className="text-sm text-gray-400">Next Token</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-400">{dept.inQueue}</div>
                    <div className="text-sm text-gray-400">In Queue</div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      dept.status === 'Active' ? 'text-green-400' : 
                      dept.status === 'Limited' ? 'text-orange-400' : 'text-gray-500'
                    }`}>
                      {dept.estWait}
                    </div>
                    <div className="text-sm text-gray-400">
                      {dept.status === 'Break' ? 'Resume' : 'Est. Wait'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements */}
      <div className="mt-8 bg-blue-900 rounded-xl p-6">
        <h3 className="text-2xl font-bold text-center mb-4 text-blue-300 flex items-center justify-center">
          <Megaphone className="mr-2" size={24} />
          ANNOUNCEMENTS
        </h3>
        <div className="text-center">
          {announcements && announcements.length > 0 ? (
            <div className="space-y-2">
              {announcements.slice(0, 3).map((announcement: any) => (
                <p key={announcement.id} className="text-lg text-blue-100">
                  {announcement.message}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-lg text-blue-100">
              Please carry all required documents for faster processing. 
              Priority queue is available for senior citizens and differently-abled persons.
            </p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-400">
        <p>For online booking: www.equeue.gov.in | Helpline: 1800-XXX-XXXX</p>
      </div>
    </div>
  );
}
