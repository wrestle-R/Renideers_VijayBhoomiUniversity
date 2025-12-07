import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
      <h1 className="text-9xl font-bold mb-4">404</h1>
      <p className="text-2xl mb-8 italic">"Not all who wander are lost"</p>
      <Link to="/">
        <Button size="lg">
          Return Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
