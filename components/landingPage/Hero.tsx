"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Search, UserPlus } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-background via-background to-primary/5">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Laporkan Keluhan Anda,
            <br />
            <span className="bg-linear-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Gubernur Akan Tindak Lanjuti
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Sistem pengaduan masyarakat terintegrasi untuk provinsi Anda. 
            Transparan, cepat, dan akuntabel. Setiap laporan akan diproses hingga tuntas.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base px-8">
                <UserPlus className="w-5 h-5" />
                Buat Pengaduan
              </Button>
            </Link>
            <Link href="/track">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8">
                <Search className="w-5 h-5" />
                Cek Status
              </Button>
            </Link>
          </div>

          {/* Stats - Sekarang pakai warna dari CSS variables */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-border">
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Pengaduan Diproses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary/80">450+</div>
              <div className="text-sm text-muted-foreground">Selesai Ditangani</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary/60">38</div>
              <div className="text-sm text-muted-foreground">Provinsi Terlayani</div>
            </div>
            <div className="text-center">
              <div className="text-2xl md:text-3xl font-bold text-primary/40">95%</div>
              <div className="text-sm text-muted-foreground">Kepuasan Publik</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave Bottom */}
      <div className="absolute bottom-0 left-0 right-0 text-border/5">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto fill-current">
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
        </svg>
      </div>
    </section>
  );
}