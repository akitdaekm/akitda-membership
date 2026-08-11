"use client";

import { Users } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type OfficeBearer = {
  id: string;
  name: string;
  position: string;
  level: string;
  district?: string | null;
  phone?: string | null;
  photoUrl?: string | null;
  order: number;
};

export function CommitteeSection({ officeBearers }: { officeBearers: OfficeBearer[] }) {
  const districtBearers = officeBearers.filter((b) => b.level === "DISTRICT");
  const stateBearers = officeBearers.filter((b) => b.level === "STATE");

  const renderGrid = (bearers: OfficeBearer[], emptyMessage: string) => {
    if (bearers.length === 0) {
      return (
        <div className="text-center text-blue-300 italic mt-8 mb-4">
          {emptyMessage}
        </div>
      );
    }

    return (
      <>
        {/* Row 1: 1-5 */}
        <div className="flex flex-wrap justify-center gap-1 mb-2">
          {bearers.slice(0, 5).map((bearer) => (
            <div key={bearer.id} className="text-center group w-36">
              <div className="h-28 w-28 mx-auto bg-blue-800/50 rounded-full mb-2 overflow-hidden relative border-4 border-blue-400/20 group-hover:border-blue-400 transition-colors">
                {bearer.photoUrl ? (
                  <img src={bearer.photoUrl} alt={bearer.name} className="object-cover object-top w-full h-full" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-blue-300">
                    <Users className="h-10 w-10" />
                  </div>
                )}
              </div>
              <h4 className="text-base font-bold text-white mb-0.5 group-hover:text-blue-300 transition-colors leading-tight">{bearer.name}</h4>
              <p className="text-blue-200 text-xs font-medium mb-1">{bearer.position}</p>
            </div>
          ))}
        </div>

        {/* Row 2: 6-9 */}
        <div className="flex flex-wrap justify-center gap-1 mb-2">
          {bearers.slice(5, 9).map((bearer) => (
            <div key={bearer.id} className="text-center group w-36">
              <div className="h-28 w-28 mx-auto bg-blue-800/50 rounded-full mb-2 overflow-hidden relative border-4 border-blue-400/20 group-hover:border-blue-400 transition-colors">
                {bearer.photoUrl ? (
                  <img src={bearer.photoUrl} alt={bearer.name} className="object-cover object-top w-full h-full" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-blue-300">
                    <Users className="h-10 w-10" />
                  </div>
                )}
              </div>
              <h4 className="text-base font-bold text-white mb-0.5 group-hover:text-blue-300 transition-colors leading-tight">{bearer.name}</h4>
              <p className="text-blue-200 text-xs font-medium mb-1">{bearer.position}</p>
            </div>
          ))}
        </div>

        {/* Row 3: 10-15 */}
        <div className="flex flex-wrap justify-center gap-1">
          {bearers.slice(9, 15).map((bearer) => (
            <div key={bearer.id} className="text-center group w-36">
              <div className="h-28 w-28 mx-auto bg-blue-800/50 rounded-full mb-2 overflow-hidden relative border-4 border-blue-400/20 group-hover:border-blue-400 transition-colors">
                {bearer.photoUrl ? (
                  <img src={bearer.photoUrl} alt={bearer.name} className="object-cover object-top w-full h-full" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-blue-300">
                    <Users className="h-10 w-10" />
                  </div>
                )}
              </div>
              <h4 className="text-base font-bold text-white mb-0.5 group-hover:text-blue-300 transition-colors leading-tight">{bearer.name}</h4>
              <p className="text-blue-200 text-xs font-medium mb-1">{bearer.position}</p>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <section id="committee" className="pt-8 pb-2 bg-blue-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-blue-400 font-semibold tracking-wide uppercase mb-1">Leadership</h2>
          
          <Tabs defaultValue="district" className="w-full flex flex-col items-center mt-4">
            <TabsList className="bg-blue-950/50 border border-blue-800 p-1 rounded-xl mb-6">
              <TabsTrigger 
                value="district" 
                className="px-6 py-2.5 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-blue-300 hover:text-blue-100 transition-all"
              >
                Ernakulam District Committee
              </TabsTrigger>
              <TabsTrigger 
                value="state" 
                className="px-6 py-2.5 rounded-lg data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium text-blue-300 hover:text-blue-100 transition-all"
              >
                State Committee
              </TabsTrigger>
            </TabsList>

            <TabsContent value="district" className="w-full duration-500 animate-in fade-in">
              <h3 className="text-4xl font-bold text-white mb-8 text-center">Ernakulam District Committee</h3>
              {renderGrid(districtBearers, "District committee members to be announced.")}
            </TabsContent>
            
            <TabsContent value="state" className="w-full duration-500 animate-in fade-in">
              <h3 className="text-4xl font-bold text-white mb-8 text-center">State Committee</h3>
              {renderGrid(stateBearers, "State committee members to be announced.")}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
