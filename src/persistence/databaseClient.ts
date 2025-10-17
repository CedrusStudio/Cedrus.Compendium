// import { databaseConnectionString } from '@/lib/env';

// const client = new MongoClient
// (
//     databaseConnectionString, 
//     {
//         serverApi: 
//         {
//             version: ServerApiVersion.v1,
//             strict: true,
//             deprecationErrors: true,
//         }
//     }
// );

// // cache client promise across module reloads (important in dev / Next.js)
// declare global 
// {
//   var _mongoClientPromise: Promise<MongoClient> | undefined;
// }

// let clientPromise: Promise<MongoClient>;
// if (process.env.NODE_ENV === "development") 
// {
//   if (!global._mongoClientPromise) 
//   {
//     global._mongoClientPromise = client.connect();
//   }

//   clientPromise = global._mongoClientPromise;
// } 
// else 
// {
//   clientPromise = client.connect();
// }

// export async function getCompendium() 
// {
//   const connectedClient = await clientPromise;
//   return connectedClient.db(process.env.NEXT_DATABASE_NAME);
// }

// export async function getCompendium() 
// {
//   const connectedClient = await client.connect();
//   return connectedClient.db(process.env.NEXT_DATABASE_NAME);
// }

// export async function getCharactersCollection() 
// {
//   const db = await getCompendium();
//   return db.collection("characters");
// }

// export async function findIgar() 
// {
//   try 
//   {
//     const characterCollection = await getCharactersCollection();
//     const igar = await characterCollection.findOne({});
//     console.log(igar);
//   } 
//   finally 
//   {
//     await client.close();
//   }
// }

