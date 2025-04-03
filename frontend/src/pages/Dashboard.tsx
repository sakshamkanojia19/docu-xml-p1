import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import RecentConversions from "@/components/dashboard/RecentConversions";
import UploadCard from "@/components/dashboard/UploadCard";
import { authService, fileService } from "@/services/api";

type Conversion = {
  id: string;
  fileName: string;
  createdAt: string;
  status: "processing" | "completed" | "failed";
  fileSize?: string;
};

const Dashboard = () => {
  const [user, setUser] = useState<{ name: string, email: string, accountType?: string } | null>(null);
  const [recentConversions, setRecentConversions] = useState<Conversion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        
        if (!authToken) {
          toast({
            title: "Authentication required",
            description: "Please sign in to access the dashboard.",
            variant: "destructive",
          });
          navigate('/login');
          return;
        }
        
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        } else {
          const { user } = await authService.getCurrentUser();
          setUser(user);
          localStorage.setItem('user', JSON.stringify(user));
        }
        
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
        toast({
          title: "Error loading dashboard",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [navigate]);
  
  const handleFileUpload = async (file: File) => {
    try {
      toast({
        title: "File upload started",
        description: `Uploading ${file.name}...`,
      });
      
      const { file: uploadedFile } = await fileService.uploadFile(file);
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded and is being processed.`,
      });
      
      navigate(`/conversion/${uploadedFile.id}`);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your file.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.name}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle>Upload PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <UploadCard onUpload={handleFileUpload} />
            </CardContent>
          </Card>
          
         
        </div>
        
        <RecentConversions conversions={recentConversions} />
        
        <div className="flex justify-center mt-6">
          <Link to="/conversions">
            <Button variant="outline">View All Conversions</Button>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
