
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import { Copy, Download, ArrowLeft, AlertTriangle } from "lucide-react";
import { fileService } from "@/services/api";

interface FileDetails {
  id: string;
  fileName: string;
  fileSize: string;
  createdAt: string;
  status: 'processing' | 'completed' | 'failed';
  xmlOutput: string | null;
  processedAt: string | null;
  error?: {
    message: string;
    timestamp: string;
  };
}

const ConversionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [conversion, setConversion] = useState<FileDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("xml");
  const [copied, setCopied] = useState(false);
  
  useEffect(() => {
    const fetchFileDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fileService.getFile(id);
        setConversion(response.file);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load file details');
        toast({
          title: "Error",
          description: "Could not load file details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchFileDetails();
    
    // Polling for status updates if the file is processing
    const intervalId = setInterval(async () => {
      if (conversion && conversion.status === 'processing') {
        try {
          const response = await fileService.getFile(id as string);
          if (response.file.status !== 'processing') {
            setConversion(response.file);
            clearInterval(intervalId);
            
            // Show toast notification based on status
            if (response.file.status === 'completed') {
              toast({
                title: "Conversion Complete",
                description: "Your PDF has been successfully converted to XML",
              });
            } else if (response.file.status === 'failed') {
              toast({
                title: "Conversion Failed",
                description: "There was a problem converting your PDF",
                variant: "destructive",
              });
            }
          }
        } catch (err) {
          // Silent fail for polling
        }
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [id, conversion?.status]);
  
  const handleCopyXML = () => {
    if (!conversion?.xmlOutput) return;
    
    navigator.clipboard.writeText(conversion.xmlOutput);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "XML content has been copied to clipboard.",
    });
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };
  
  const handleDownloadXML = () => {
    if (!conversion?.xmlOutput) return;
    
    const blob = new Blob([conversion.xmlOutput], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const fileName = conversion.fileName.replace(".pdf", ".xml");
    
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    
    toast({
      title: "Download started",
      description: `${fileName} is being downloaded.`,
    });
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg">Loading file details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  if (error || !conversion) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Error</h1>
          </div>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Failed to load file</AlertTitle>
            <AlertDescription>
              {error || "Could not load the file details. The file may have been deleted or you don't have permission to access it."}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center">
            <Button onClick={() => navigate('/conversions')}>
              Back to Conversions
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{conversion.fileName}</h1>
            <p className="text-gray-500">
              Uploaded on {new Date(conversion.createdAt).toLocaleDateString()}
              {conversion.processedAt && ` • Processed on ${new Date(conversion.processedAt).toLocaleDateString()}`}
            </p>
          </div>
        </div>
        
        {conversion.status === 'processing' && (
          <Alert>
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <AlertTitle>Processing</AlertTitle>
            </div>
            <AlertDescription>
              Your PDF is currently being converted to XML. This may take a few moments.
            </AlertDescription>
          </Alert>
        )}
        
        {conversion.status === 'failed' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Conversion Failed</AlertTitle>
            <AlertDescription>
              {conversion.error?.message || "There was an error processing your PDF file."}
            </AlertDescription>
          </Alert>
        )}
        
        {conversion.status === 'completed' && (
          <>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={handleCopyXML}
                disabled={copied || !conversion.xmlOutput}
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? "Copied" : "Copy XML"}
              </Button>
              <Button 
                onClick={handleDownloadXML}
                disabled={!conversion.xmlOutput}
              >
                <Download className="h-4 w-4 mr-2" />
                Download XML
              </Button>
            </div>
            
            <Tabs defaultValue="xml" value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="xml">XML Output</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="original">Original PDF</TabsTrigger>
              </TabsList>
              <TabsContent value="xml">
                <Card>
                  <CardContent className="p-0">
                    {conversion.xmlOutput ? (
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto text-sm font-mono">
                        {conversion.xmlOutput}
                      </pre>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        No XML content available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="preview">
                <Card>
                  <CardContent className="p-6">
                    {conversion.xmlOutput ? (
                      <div className="prose max-w-none">
                        <XMLPreview xmlString={conversion.xmlOutput} />
                      </div>
                    ) : (
                      <div className="text-center text-gray-500">
                        No preview available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="original">
                <Card>
                  <CardContent className="p-6 flex items-center justify-center bg-gray-100 min-h-[400px]">
                    <div className="text-center">
                      <p className="text-gray-500 mb-4">PDF preview not available.</p>
                      <p className="text-sm text-gray-400">In a full implementation, this would show a PDF viewer.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

// Simple XML to HTML preview component
const XMLPreview = ({ xmlString }: { xmlString: string }) => {
  try {
    // Parse the XML string
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");
    
    // Extract document title and metadata
    const title = xmlDoc.querySelector("metadata > title")?.textContent || "Document";
    const author = xmlDoc.querySelector("metadata > author")?.textContent;
    const date = xmlDoc.querySelector("metadata > creationDate")?.textContent;
    
    // Extract sections
    const sections = Array.from(xmlDoc.querySelectorAll("section"));
    
    return (
      <div>
        <h1>{title}</h1>
        {(author || date) && (
          <p className="text-gray-500">
            {author && `by ${author}`} {date && author && "•"} {date && new Date(date).toLocaleDateString()}
          </p>
        )}
        
        {sections.map((section, index) => {
          const heading = section.querySelector("heading")?.textContent || `Section ${index + 1}`;
          const paragraphs = Array.from(section.querySelectorAll("paragraph"));
          
          return (
            <div key={index} className="mb-6">
              <h2>{heading}</h2>
              {paragraphs.map((para, paraIndex) => (
                <p key={paraIndex}>{para.textContent}</p>
              ))}
            </div>
          );
        })}
      </div>
    );
  } catch (error) {
    return (
      <div className="text-red-500">
        <p>Error parsing XML content</p>
        <p className="text-sm">{String(error)}</p>
      </div>
    );
  }
};

export default ConversionDetails;
