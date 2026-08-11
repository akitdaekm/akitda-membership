import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { prisma } from "@/lib/prisma";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { PlayCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
    const items = await prisma.galleryItem.findMany({
        orderBy: { createdAt: "desc" },
    });

    const photos = items.filter((item) => item.type === "PHOTO");
    const videos = items.filter((item) => item.type === "VIDEO");

    return (
        <div className="min-h-screen flex flex-col font-sans bg-slate-50">
            <Navbar />

            {/* Header */}
            <div className="bg-slate-900 text-white py-24">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Media Gallery</h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Explore our events, workshops, and community gatherings through photos and videos.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16 flex-1">
                <Tabs defaultValue="all" className="w-full">
                    <div className="flex justify-center mb-12">
                        <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="photos">Photos</TabsTrigger>
                            <TabsTrigger value="videos">Videos</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="all" className="space-y-8">
                        <GalleryGrid items={items} />
                    </TabsContent>

                    <TabsContent value="photos" className="space-y-8">
                        <GalleryGrid items={photos} />
                    </TabsContent>

                    <TabsContent value="videos" className="space-y-8">
                        <GalleryGrid items={videos} />
                    </TabsContent>
                </Tabs>
            </div>

            <Footer />
        </div>
    );
}

function GalleryGrid({ items }: { items: any[] }) {
    if (items.length === 0) {
        return (
            <div className="text-center py-24 text-slate-500">
                <p className="text-xl">No items found.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
                <Card key={item.id} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow bg-white">
                    <div className="aspect-video relative bg-slate-200 group cursor-pointer">
                        {item.type === "PHOTO" ? (
                            <img
                                src={item.url}
                                alt={item.title || "Gallery Image"}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full relative">
                                {/* Simple YouTube Embed or Thumbnail Logic */}
                                {item.url.includes("youtube.com") || item.url.includes("youtu.be") ? (
                                    <iframe
                                        src={getEmbedUrl(item.url)}
                                        className="w-full h-full"
                                        title={item.title || "Video"}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full bg-slate-800 text-white">
                                        <PlayCircle className="h-16 w-16 opacity-80" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Overlay with Title for Photos */}
                        {item.type === "PHOTO" && (
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                                <div>
                                    <h3 className="text-white font-bold text-lg">{item.title}</h3>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* Content below for Videos to ensure title is visible properly since iframe blocks overlay events mostly */}
                    {item.type === "VIDEO" && (
                        <CardContent className="p-4">
                            <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{item.title}</h3>
                            {item.description && <p className="text-slate-500 text-sm mt-1 line-clamp-2">{item.description}</p>}
                        </CardContent>
                    )}
                    {item.type === "PHOTO" && item.description && (
                        <CardContent className="p-4">
                            <p className="text-slate-500 text-sm line-clamp-2">{item.description}</p>
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    );
}

function getEmbedUrl(url: string) {
    try {
        let videoId = "";
        if (url.includes("youtu.be")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0];
        } else if (url.includes("youtube.com/watch")) {
            videoId = new URL(url).searchParams.get("v") || "";
        } else if (url.includes("youtube.com/embed/")) {
            return url;
        }

        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
        return url;
    } catch {
        return url;
    }
}
