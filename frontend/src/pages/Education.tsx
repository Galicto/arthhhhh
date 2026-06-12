import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import educationVideoData from '../data/educationVideos.json';
import type { EducationTrack } from '../types/wealthTypes';
import Templates from './Templates';

const learningTracks = (educationVideoData as { tracks: EducationTrack[] }).tracks;

function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.replace('/', '');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export default function Education() {
  return (
    <DashboardLayout>
      <div className="px-4 md:px-8 pb-12 pt-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF5A00] to-[#FF8C00] flex items-center justify-center text-on-surface shadow-[0_0_20px_rgba(255,90,0,0.4)]">
            <span className="material-symbols-outlined text-[24px]">school</span>
          </div>
          <div>
            <h2 className="text-3xl font-black font-headline text-on-surface tracking-tight">Finance Education</h2>
            <p className="text-sm text-on-surface/50 font-body mt-1">
              Learn by sector with YouTube video tracks and ready-to-use planning templates.
            </p>
          </div>
        </div>

        {/* Video tracks */}
        <section className="bg-on-surface/5 backdrop-blur-2xl border border-on-surface/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-[#FF5A00] opacity-5 rounded-full blur-[100px]"></div>
          <h3 className="text-xl font-black font-headline text-on-surface tracking-tight mb-8 flex items-center gap-3 relative z-10">
            <span className="material-symbols-outlined text-[#FF5A00]">smart_display</span>
            YouTube Learning Tracks
          </h3>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 relative z-10">
            {learningTracks.map((track) => {
              const primaryVideo = track.videos[0];
              const embedUrl = primaryVideo ? toEmbedUrl(primaryVideo.url) : null;

              return (
                <article key={track.sector} className="rounded-2xl border border-on-surface/10 bg-[#0E1117]/60 backdrop-blur-xl p-6 space-y-5 hover:border-on-surface/20 transition-colors shadow-xl">
                  <div>
                    <h4 className="text-lg font-black font-headline text-on-surface tracking-tight">{track.sector}</h4>
                    <p className="text-xs text-on-surface/60 font-body mt-1">{track.description}</p>
                  </div>

                  <div className="aspect-video rounded-xl overflow-hidden border border-on-surface/10 bg-[#000000] shadow-inner">
                    {embedUrl ? (
                      <iframe
                        className="w-full h-full"
                        src={embedUrl}
                        title={primaryVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-on-surface/40 font-body px-4 text-center">
                        Video link is unavailable for this track.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-on-surface/40 font-body truncate">{track.channelHint}</p>
                    {primaryVideo && (
                      <a
                        href={primaryVideo.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold uppercase tracking-wider text-[#FF5A00] hover:text-[#FF8C00] transition-colors flex items-center gap-1"
                      >
                        Watch video <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </a>
                    )}
                  </div>

                  {track.videos.length > 1 && (
                    <div className="pt-3 border-t border-on-surface/10">
                      <p className="text-[11px] uppercase tracking-wider text-on-surface/40 font-body mb-2 font-bold">More videos</p>
                      <div className="space-y-2">
                        {track.videos.slice(1).map((video) => (
                          <a
                            key={video.url}
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block text-sm text-on-surface/70 hover:text-[#FF5A00] transition-colors truncate"
                          >
                            • {video.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>

        {/* Full Templates Pages */}
        <section className="bg-on-surface/5 backdrop-blur-2xl border border-on-surface/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] rounded-3xl p-8 mb-8">
          <Templates />
        </section>
      </div>
    </DashboardLayout>
  );
}
