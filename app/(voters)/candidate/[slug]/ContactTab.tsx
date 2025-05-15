"use client";

import React from "react";
import { FaEnvelope, FaGlobe, FaPhone, FaLinkedin } from "react-icons/fa";

interface ContactTabProps {
  email?: string | null;
  website?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  verified?: boolean;
}

export function ContactTab({
  email,
  website,
  phone,
  linkedin,
  verified,
}: ContactTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {verified && email && (
        <div className="flex items-center space-x-3 p-4">
          <FaEnvelope className="text-gray-500" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Email</h3>
            <a
              href={`mailto:${email}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              {email}
            </a>
          </div>
        </div>
      )}
      {website && (
        <div className="flex items-center space-x-3 p-4">
          <FaGlobe className="text-gray-500" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Website</h3>
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline"
            >
              {website}
            </a>
          </div>
        </div>
      )}
      {phone && (
        <div className="flex items-center space-x-3 p-4">
          <FaPhone className="text-gray-500" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">Phone</h3>
            <a
              href={`tel:${phone}`}
              className="text-sm text-indigo-600 hover:underline"
            >
              {phone}
            </a>
          </div>
        </div>
      )}
      {linkedin && (
        <div className="flex items-center space-x-3 p-4">
          <FaLinkedin className="text-gray-500" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900">LinkedIn</h3>
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 hover:underline"
            >
              {linkedin}
            </a>
          </div>
        </div>
      )}
      {!email && !website && !phone && !linkedin && (
        <div className="md:col-span-2 text-center text-sm text-gray-500">
          No contact information available.
        </div>
      )}
    </div>
  );
}
