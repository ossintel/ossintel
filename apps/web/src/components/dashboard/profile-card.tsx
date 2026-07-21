"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import type React from "react";
import { useState } from "react";
import {
  FaBuilding,
  FaEnvelope,
  FaGithub,
  FaGlobe,
  FaMapMarkerAlt,
  FaTwitter,
} from "react-icons/fa";
import { Readme } from "./readme";

interface ProfileCardProps {
  avatarUrl: string;
  name?: string | null;
  login: string;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  email?: string | null;
  htmlUrl: string;
  twitterUsername?: string | null;
  blog?: string | null;
  readme?: string | null;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  avatarUrl,
  name,
  login,
  bio,
  company,
  location,
  email,
  htmlUrl,
  twitterUsername,
  blog,
  readme,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-3xl flex flex-col gap-4 shadow-xl">
      <h3 className="text-base font-bold flex items-center gap-2 text-indigo-400">
        <FaGithub className="h-5 w-5" /> GitHub Profile
      </h3>
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* biome-ignore lint/performance/noImgElement: avatar is loaded dynamically from external github domain */}
        <img
          src={avatarUrl || "https://avatar.url"}
          alt={name || login}
          className="h-14 w-14 rounded-2xl border border-slate-700 object-cover shadow-inner"
        />
        <div>
          <h3 className="font-extrabold text-base text-slate-100 leading-tight">
            {name || login}
          </h3>
          <p className="text-xs text-slate-500 font-bold">@{login}</p>
        </div>
      </div>

      {bio && (
        <p className="text-xs text-slate-400 font-semibold leading-relaxed border-t border-slate-800/80 pt-3">
          {bio}
        </p>
      )}

      {(company || location || email) && (
        <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-3 text-slate-400 font-medium">
          {company && (
            <span className="text-xs flex items-center gap-2">
              <FaBuilding className="text-indigo-400 h-3.5 w-3.5" /> {company}
            </span>
          )}
          {location && (
            <span className="text-xs flex items-center gap-2">
              <FaMapMarkerAlt className="text-indigo-400 h-3.5 w-3.5" />{" "}
              {location}
            </span>
          )}
          {email && (
            <span className="text-xs flex items-center gap-2">
              <FaEnvelope className="text-indigo-400 h-3.5 w-3.5" /> {email}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-slate-800/80 pt-3">
        <a
          href={htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-400 rounded-xl transition-all"
          title="GitHub Profile"
        >
          <FaGithub className="h-4 w-4" />
        </a>
        {twitterUsername && (
          <a
            href={`https://twitter.com/${twitterUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-400 rounded-xl transition-all"
            title="Twitter Account"
          >
            <FaTwitter className="h-4 w-4" />
          </a>
        )}
        {blog && (
          <a
            href={blog.startsWith("http") ? blog : `https://${blog}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-indigo-400 rounded-xl transition-all"
            title="Website/Blog"
          >
            <FaGlobe className="h-4 w-4" />
          </a>
        )}
      </div>
      {readme && (
        <div className="border-t border-slate-800/80 pt-4 mt-1">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between py-2 px-3 bg-slate-950/40 border border-slate-850 hover:border-indigo-500/30 rounded-xl text-xs font-bold text-slate-300 hover:text-indigo-400 transition-all cursor-pointer shadow-inner"
          >
            <span className="flex items-center gap-2">
              <FaGithub className="h-3.5 w-3.5" />
              {isOpen ? "Hide Profile README" : "Show Profile README"}
            </span>
            <span>
              {isOpen ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
            </span>
          </button>
          {isOpen && (
            <div className="mt-4 max-h-80 overflow-y-auto pr-2 bg-slate-950/60 p-5 rounded-2xl border border-slate-850 animate-fade-in-up">
              <Readme readme={readme} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
