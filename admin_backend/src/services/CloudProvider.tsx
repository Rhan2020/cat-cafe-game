import React, { createContext, useContext, useEffect, useState } from 'react';
import cloudbase from '@cloudbase/js-sdk';

// Define the shape of the context
interface CloudContextType {
  app: cloudbase.app.App | null;
  db: any; // Using 'any' to bypass incorrect type definitions for now
  // We can add auth state later
  // isLoggedIn: boolean;
}

// Create the context with a default null value
const CloudContext = createContext<CloudContextType>({ app: null, db: null });

// Custom hook for easy access to the context
export const useCloud = () => {
  return useContext(CloudContext);
};

// The provider component
export const CloudProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [app, setApp] = useState<cloudbase.app.App | null>(null);
  const [db, setDb] = useState<any>(null); // Using 'any'

  useEffect(() => {
    // IMPORTANT: Replace with your actual CloudBase environment details
    // These should ideally be stored in environment variables
    const envId = process.env.REACT_APP_CLOUDBASE_ENV_ID;

    if (!envId) {
        console.error("CloudBase Environment ID not found. Please set REACT_APP_CLOUDBASE_ENV_ID in your .env file.");
        return;
    }

    const cloudApp = cloudbase.init({
      env: envId,
    });
    
    // For admin usage, you would typically use private key login
    // For simplicity here, we'll assume anonymous login or manual login flow
    // a more secure approach would be:
    // const auth = cloudApp.auth({ persistence: 'local' });
    // await auth.signInWithTicket('YOUR_TICKET');

    const database = cloudApp.database();

    setApp(cloudApp);
    setDb(database);

    console.log("CloudBase SDK Initialized.");
  }, []);

  const value = { app, db };

  return (
    <CloudContext.Provider value={value}>
      {children}
    </CloudContext.Provider>
  );
}; 