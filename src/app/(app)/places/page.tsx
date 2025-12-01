
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function PlacesPage() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/places/countries');
    }, [router]);
    
    return null;
}
