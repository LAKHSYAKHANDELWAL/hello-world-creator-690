import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  BookOpen, 
  Bus,
  AlertTriangle 
} from 'lucide-react';

interface FeeStats {
  totalCollected: number;
  totalPending: number;
  tuitionCollected: number;
  transportCollected: number;
  totalStudents: number;
  classStats: Array<{
    class: string;
    collected: number;
    total: number;
    percentage: number;
  }>;
}

interface FeeVisualizationProps {
  stats: FeeStats;
}

export function FeeVisualization({ stats }: FeeVisualizationProps) {
  const collectionRate = stats.totalCollected + stats.totalPending > 0 
    ? (stats.totalCollected / (stats.totalCollected + stats.totalPending)) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Collected</p>
                <p className="text-2xl font-bold text-green-600">₹{stats.totalCollected.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Fees</p>
                <p className="text-2xl font-bold text-red-600">₹{stats.totalPending.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Collection Rate</p>
                <p className="text-2xl font-bold text-blue-600">{collectionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Type Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Tuition Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Collected</span>
                <span className="font-bold text-green-600">₹{stats.tuitionCollected.toLocaleString()}</span>
              </div>
              <Progress 
                value={(stats.tuitionCollected / (stats.totalCollected || 1)) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bus className="h-5 w-5" />
              Transport Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Collected</span>
                <span className="font-bold text-green-600">₹{stats.transportCollected.toLocaleString()}</span>
              </div>
              <Progress 
                value={(stats.transportCollected / (stats.totalCollected || 1)) * 100} 
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Paying Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Class-wise Collection Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.classStats.slice(0, 8).map((classData, index) => (
              <div key={classData.class} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <span className="font-medium">{classData.class}</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    {classData.percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground mb-2">
                  <span>₹{classData.collected.toLocaleString()} / ₹{classData.total.toLocaleString()}</span>
                </div>
                <Progress value={classData.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}