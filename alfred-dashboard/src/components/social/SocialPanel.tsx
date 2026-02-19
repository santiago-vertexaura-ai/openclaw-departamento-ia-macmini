"use client";

import SocialCalendarWeekly from "./SocialCalendarWeekly";

export default function SocialPanel() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-black to-gray-900">
      <div className="flex-1 min-h-0">
        <SocialCalendarWeekly />
      </div>
    </div>
  );
}
