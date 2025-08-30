import CharacterSidebar from "@/components/character/CharacterSidebar";
import { PropsWithChildren } from "react";

export default function layout({children}: PropsWithChildren)
{
  return (
    <>
      <div className="py-6 px-4">
        {children}
      </div>
    </>
  );
};


// export default function layout({children}: PropsWithChildren)
// {
//   return (
//     <>
//       <div className="py-6 px-4 grid lg:grid-cols-8 ">
        
//         <div className="lg:block lg:col-span-1 lg:min-h-screen lg:mr-6 mb-6 lg:mb-0">
//           <CharacterSidebar />
//         </div>

//         <div className="lg:col-span-7">
//             {children}
//         </div>
//       </div>
//     </>
//   );
// };