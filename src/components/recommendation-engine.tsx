'use client';

import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getRecommendations } from '@/app/actions';
import { Skeleton } from './ui/skeleton';

interface RecommendationEngineProps {
  text: string;
}

export function RecommendationEngine({ text }: RecommendationEngineProps) {
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetRecommendations = async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations([]);

    const result = await getRecommendations({ text });

    if (result.error) {
      setError(result.error);
    } else if (result.recommendations) {
      setRecommendations(result.recommendations);
    }
    setIsLoading(false);
  };

  return (
    <Card className="mt-12 bg-card/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <Wand2 className="text-accent" />
          Đề xuất bởi AI
        </CardTitle>
        <CardDescription>
          Thích tác phẩm này? Tìm các tác phẩm tương tự dựa trên phong cách, chủ đề và thời kỳ.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 && !isLoading && !error && (
          <Button onClick={handleGetRecommendations} variant="outline">
            Tạo đề xuất
          </Button>
        )}
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-6 w-2/3" />
          </div>
        )}
        {error && <p className="text-destructive">{error}</p>}
        {recommendations.length > 0 && (
          <ul className="list-disc list-inside space-y-2 font-body">
            {recommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
