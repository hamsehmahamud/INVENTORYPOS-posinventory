

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";

export default function ImportSuppliersPage() {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Import Suppliers</CardTitle>
        <CardDescription>Bulk import suppliers from a CSV file.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="import-file">Upload CSV File</Label>
            <div className="flex items-center gap-2">
              <Input id="import-file" type="file" className="flex-1" accept=".csv" />
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
             <p className="text-xs text-muted-foreground">
                Ensure your file is in CSV format.
            </p>
          </div>
          
          <div className="border border-dashed rounded-lg p-6 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">Drag and drop your file here or click upload.</p>
          </div>
        </div>

        <div className="space-y-2">
            <h4 className="font-semibold">Instructions</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>Download the sample CSV file to see the required format.</li>
                <li>Required columns: `name`, `email`, `phone`.</li>
                <li>Do not change the column headers.</li>
            </ul>
        </div>

      </CardContent>
      <CardFooter className="flex justify-between items-center">
         <Button variant="link" className="p-0 h-auto">Download Sample CSV</Button>
         <Button>Import Suppliers</Button>
      </CardFooter>
    </Card>
  );
}
