import { ReactNode, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { 
  Home, History, User, LogOut, Menu, X, ChevronDown, ChevronRight, ChevronUp
} from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    
    navigate('/login');
  };
  
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { path: "/conversions", label: "Conversion History", icon: <History className="h-5 w-5" /> },
    { path: "/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
  ];
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
              <span className="sr-only">Toggle menu</span>
            </Button>
            
            <Link to="/dashboard" className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">DocuXML</h1>
            </Link>
          </div>
          
          <div className="relative">
            <Button 
              variant="ghost" 
              className="flex items-center"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <div className="rounded-full bg-blue-100 h-8 w-8 flex items-center justify-center text-blue-600 font-semibold mr-2">
                {JSON.parse(localStorage.getItem('user') || '{"name":"U"}').name.charAt(0)}
              </div>
              <span className="hidden md:inline">
                {JSON.parse(localStorage.getItem('user') || '{"name":"User"}').name}
              </span>
              {isUserMenuOpen ? (
                <ChevronUp className="h-4 w-4 ml-2" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-2" />
              )}
            </Button>
            
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                <Link 
                  to="/profile" 
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="flex flex-1">
        <aside className="hidden md:flex md:w-64 border-r bg-white">
          <div className="w-full py-6">
            <nav className="mt-5 px-2">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive(item.path)
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <div className={`mr-4 ${isActive(item.path) ? "text-blue-600" : "text-gray-400"}`}>
                      {item.icon}
                    </div>
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </aside>
        
        {isSidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsSidebarOpen(false)}></div>
            
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="pt-5 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <Link to="/dashboard" className="text-xl font-bold text-blue-600">
                    DocuXML
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)}>
                    <X className="h-6 w-6" />
                  </Button>
                </div>
                <nav className="mt-8 space-y-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`group flex items-center px-2 py-3 text-base font-medium rounded-md ${
                        isActive(item.path)
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <div className={`mr-4 ${isActive(item.path) ? "text-blue-600" : "text-gray-400"}`}>
                        {item.icon}
                      </div>
                      {item.label}
                    </Link>
                  ))}
                  
                  <button
                    onClick={() => {
                      setIsSidebarOpen(false);
                      handleLogout();
                    }}
                    className="group flex items-center px-2 py-3 text-base font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full"
                  >
                    <LogOut className="mr-4 h-5 w-5 text-gray-400" />
                    Sign out
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
