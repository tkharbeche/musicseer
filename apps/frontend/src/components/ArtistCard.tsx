'use client';

import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { Plus } from 'lucide-react';

interface ArtistCardProps {
    name: string;
    imageUrl?: string;
    genres?: string[];
    onCenter?: () => void;
    onRequest?: () => void;
}

export default function ArtistCard({ name, imageUrl, genres, onRequest }: ArtistCardProps) {
    const cardRef = useRef(null);

    useEffect(() => {
        gsap.fromTo(cardRef.current,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
        );
    }, []);

    const handleHover = (entering: boolean) => {
        gsap.to(cardRef.current, {
            scale: entering ? 1.05 : 1,
            backgroundColor: entering ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            duration: 0.3
        });
    };

    return (
        <div
            ref={cardRef}
            onMouseEnter={() => handleHover(true)}
            onMouseLeave={() => handleHover(false)}
            className="group relative bg-white/5 p-4 rounded-2xl transition-all cursor-pointer flex flex-col gap-4 w-full aspect-[3/4]"
        >
            <div className="relative aspect-square w-full overflow-hidden rounded-xl shadow-xl bg-muted">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/20 text-primary">
                        <span className="text-4xl font-bold">{name.charAt(0)}</span>
                    </div>
                )}

                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRequest?.();
                    }}
                    className="absolute bottom-4 right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-2xl opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:scale-110 active:scale-95"
                >
                    <Plus className="text-white fill-current" size={24} />
                </button>
            </div>

            <div className="flex flex-col">
                <h3 className="font-bold text-lg truncate text-white">{name}</h3>
                <p className="text-sm text-muted-foreground truncate">
                    {genres && genres.length > 0 ? genres.slice(0, 2).join(', ') : 'Artist'}
                </p>
            </div>
        </div>
    );
}
