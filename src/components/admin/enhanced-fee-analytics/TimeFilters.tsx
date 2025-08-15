import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock } from 'lucide-react';

interface TimeFiltersProps {
  timeFilter: string;
  customStartDate: string;
  customEndDate: string;
  onTimeFilterChange: (value: string) => void;
  onCustomStartDateChange: (value: string) => void;
  onCustomEndDateChange: (value: string) => void;
  onApplyCustomRange: () => void;
}

export function TimeFilters({
  timeFilter,
  customStartDate,
  customEndDate,
  onTimeFilterChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
  onApplyCustomRange,
}: TimeFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Time Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Time Period</Label>
            <Select value={timeFilter} onValueChange={onTimeFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="prev_month">Previous Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {timeFilter === 'custom' && (
            <>
              <div>
                <Label className="text-sm font-medium mb-2 block">Start Date</Label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onCustomStartDateChange(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">End Date</Label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onCustomEndDateChange(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={onApplyCustomRange} className="w-full">
                  Apply Range
                </Button>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}