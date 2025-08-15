import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '@/components/Logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
const RoleSelectionPage = () => {
  return <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 animate-fade-in">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <Logo />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Welcome to edutech</CardTitle>
            <CardDescription>Please select your role to continue</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Button asChild size="lg" className="w-full">
              <Link to="/login/student">
                Login as Guardian
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link to="/login/teacher">
                Login as Teacher
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full">
              <Link to="/login/admin">
                Login as Admin
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </CardContent>
        </Card>
         <p className="text-center text-sm text-muted-foreground mt-6">
          Having trouble? <a href="#" className="text-primary hover:underline">Contact Support</a>
        </p>
      </div>
    </div>;
};
export default RoleSelectionPage;