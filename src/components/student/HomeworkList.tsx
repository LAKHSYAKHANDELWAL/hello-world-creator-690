
import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Homework = {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  attachment_url: string | null;
  class_name: string;
  created_at: string;
};

interface HomeworkListProps {
  className: string; // Student's class
}

export function HomeworkList({ className }: HomeworkListProps) {
  const [homework, setHomework] = React.useState<Homework[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!className) return;
    setLoading(true);
    supabase
      .from("homework_assignments")
      .select("*")
      .eq("class_name", className)
      .order("due_date", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) {
          setHomework(data as Homework[]);
        }
        setLoading(false);
      });
  }, [className]);

  if (!className) {
    return null;
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold mb-2">Homework</h2>
      {loading ? (
        <div className="text-muted-foreground">Loading homework…</div>
      ) : homework.length === 0 ? (
        <div className="text-muted-foreground">No homework assigned.</div>
      ) : (
        <div className="grid gap-4">
          {homework.map(hw => (
            <Card key={hw.id}>
              <CardHeader>
                <CardTitle>{hw.title}</CardTitle>
                {hw.due_date && (
                  <p className="text-sm text-muted-foreground">Due: {hw.due_date}</p>
                )}
              </CardHeader>
              <CardContent>
                <p className="mb-2">{hw.description}</p>
                {hw.attachment_url && (
                  <a
                    href={hw.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline text-sm"
                  >
                    View Attachment
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
