
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Conversion {
  id: string;
  fileName: string;
  createdAt: string;
  status: "processing" | "completed" | "failed";
}

interface RecentConversionsProps {
  conversions: Conversion[];
}

const RecentConversions = ({ conversions }: RecentConversionsProps) => {
  if (conversions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Recent Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            No conversions found. Upload a PDF to get started.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Recent Conversions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conversions.map((conversion) => (
                <TableRow key={conversion.id}>
                  <TableCell className="font-medium">{conversion.fileName}</TableCell>
                  <TableCell>
                    {formatDistanceToNow(new Date(conversion.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    {conversion.status === "processing" && (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        Processing
                      </Badge>
                    )}
                    {conversion.status === "completed" && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                        Completed
                      </Badge>
                    )}
                    {conversion.status === "failed" && (
                      <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100">
                        Failed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Link to={`/conversion/${conversion.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {conversion.status === "completed" && (
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentConversions;
