export type Deployment = 'development' | 'production' | 'test';

declare namespace NodeJS 
{
  interface ProcessEnv 
  {
    NODE_ENV: Deployment;

    NEXT_LANGUAGE: string;
    NEXT_LANGUAGE_FALLBACK: string;
    NEXT_PUBLIC_API_URL: string;
    
    DATABASE_CONNECTION_STRING: string;
  }
}