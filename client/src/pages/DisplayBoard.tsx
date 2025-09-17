import { useState, useEffect } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Play, Clock, Megaphone } from "lucide-react";

export default function DisplayBoard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { lastMessage } = useWebSocket();

  const { data: departments } = useQuery({
    queryKey: ['/api/departments'],
  });

  const { data: announcements } = useQuery({
    queryKey: ['/api/announcements'],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Mock currently serving data - in real implementation, this would come from WebSocket updates
  const currentlyServing = [
    {
      tokenNumber: "A47",
      departmentName: "RTO Services",
      serviceName: "DL Renewal",
      counterNumber: 3,
      startTime: "3:42 PM"
    },
    {
      tokenNumber: "B23",
      departmentName: "Income Certificate",
      serviceName: "New Application",
      counterNumber: 1,
      startTime: "3:40 PM"
    },
    {
      tokenNumber: "C15",
      departmentName: "Aadhar Services",
      serviceName: "Update Details",
      counterNumber: 2,
      startTime: "3:38 PM"
    }
  ];

  // Mock queue status data
  const queueStatus = [
    {
      departmentName: "RTO Services",
      status: "Active",
      nextToken: "A48",
      inQueue: 42,
      estWait: "18m",
      statusColor: "bg-green-600"
    },
    {
      departmentName: "Income Certificate",
      status: "Active", 
      nextToken: "B24",
      inQueue: 15,
      estWait: "12m",
      statusColor: "bg-green-600"
    },
    {
      departmentName: "Aadhar Services",
      status: "Limited",
      nextToken: "C16", 
      inQueue: 8,
      estWait: "25m",
      statusColor: "bg-yellow-600"
    },
    {
      departmentName: "Municipal Corp",
      status: "Break",
      nextToken: "D05",
      inQueue: 3,
      estWait: "4:00 PM",
      statusColor: "bg-red-600"
    }
  ];

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
                    <div className={`text-lg ${
                      index === 0 ? 'text-green-200' : 
                      index === 1 ? 'text-blue-200' : 'text-purple-200'
                    }`}>
                      Counter {service.counterNumber}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl ${
                      index === 0 ? 'text-green-100' : 
                      index === 1 ? 'text-blue-100' : 'text-purple-100'
                    }`}>
                      {service.serviceName}
                    </div>
                    <div className={`text-lg ${
                      index === 0 ? 'text-green-200' : 
                      index === 1 ? 'text-blue-200' : 'text-purple-200'
                    }`}>
                      Started: {service.startTime}
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
