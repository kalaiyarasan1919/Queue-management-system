import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface LiveDisplayProps {
  departmentId?: string;
  showFullDisplay?: boolean;
}

export function LiveDisplay({ departmentId, showFullDisplay = false }: LiveDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { lastMessage } = useWebSocket();

  const { data: departments, refetch: refetchDepartments } = useQuery({
    queryKey: ['/api/departments'],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (lastMessage?.type === 'QUEUE_UPDATE' || lastMessage?.type === 'COUNTER_STATUS_UPDATE') {
      refetchDepartments();
    }
  }, [lastMessage, refetchDepartments]);

  if (showFullDisplay) {
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
            <h2 className="text-3xl font-bold text-center mb-8 text-green-400">
              NOW SERVING
            </h2>
            
            <div className="space-y-6">
              {/* Mock currently serving data - would be real data in production */}
              <div className="bg-green-800 rounded-lg p-6 animate-pulse">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-6xl font-bold text-white mb-2">A47</div>
                    <div className="text-xl text-green-100">RTO Services</div>
                    <div className="text-lg text-green-200">Counter 3</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl text-green-100">DL Renewal</div>
                    <div className="text-lg text-green-200">Started: 3:42 PM</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Queue Status */}
          <div className="bg-gray-900 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-center mb-8 text-yellow-400">
              QUEUE STATUS
            </h2>
            
            <div className="space-y-4">
              {departments?.map((dept: any) => (
                <div key={dept.id} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-white">{dept.name}</h3>
                    <Badge variant="secondary" className="bg-green-600 text-white">
                      Active
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-yellow-400">A48</div>
                      <div className="text-sm text-gray-400">Next Token</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-400">12</div>
                      <div className="text-sm text-gray-400">In Queue</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-400">18m</div>
                      <div className="text-sm text-gray-400">Est. Wait</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Announcements */}
        <div className="mt-8 bg-blue-900 rounded-xl p-6">
          <h3 className="text-2xl font-bold text-center mb-4 text-blue-300">
            ANNOUNCEMENTS
          </h3>
          <div className="text-center">
            <p className="text-lg text-blue-100">
              Please carry all required documents for faster processing. 
              Priority queue is available for senior citizens and differently-abled persons.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400">
          <p>For online booking: www.equeue.gov.in | Helpline: 1800-XXX-XXXX</p>
        </div>
      </div>
    );
  }

  // Compact live display for sidebar use
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-4">Live Queue Status</h3>
        <div className="space-y-3">
          {departments?.slice(0, 3).map((dept: any) => (
            <div key={dept.id} className="border border-border rounded p-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-sm">{dept.name}</h4>
                <Badge variant="secondary" className="text-xs">Active</Badge>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Current: Token #45</p>
                <p>Queue: 12 people</p>
                <p>Est. Wait: 18 mins</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
