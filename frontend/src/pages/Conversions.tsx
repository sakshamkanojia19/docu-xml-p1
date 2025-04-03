import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import RecentConversions from "@/components/dashboard/RecentConversions";
import {fileService } from "@/services/api";


interface Conversion {
  id: string;
  fileName: string;
  createdAt: string;
  status: "processing" | "completed" | "failed";
  fileSize: string;
}

const Conversions = () => {
  const navigate = useNavigate();
  const [recentConversions, setRecentConversions] = useState<Conversion[]>([]);
  
  useEffect(() => {
  
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      navigate('/login');
      return;
    }
    
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const { files } = await fileService.getFiles();
        const formattedConversions = files.slice(0, 3).map((file: any) => ({
          id: file.id,
          fileName: file.fileName,
          createdAt: file.createdAt,
          status: file.status as "processing" | "completed" | "failed",
          fileSize: file.fileSize
        }));
        
        setRecentConversions(formattedConversions);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    loadData();
  }, [navigate]);
  
  
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Conversion History</h1>
          <p className="text-gray-500">Browse and manage your previous conversions</p>
        </div>
        <RecentConversions conversions={recentConversions} />    
      </div>
    </DashboardLayout>
  );
};

export default Conversions;
