import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

interface FindingsStepProps {
    findings: string;
    onChange: (findings: string) => void;
    onGenerate: () => void;
    submitting: boolean;
}

export default function FindingsStep({ findings, onChange, onGenerate, submitting }: FindingsStepProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                <CardTitle>Enter Findings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Textarea
                    value={findings}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Enter findings…"
                />
                <Button onClick={onGenerate} disabled={submitting || !findings}>
                    <span>Generate Reports</span>
                </Button>
            </CardContent>
        </Card>
    );
}
