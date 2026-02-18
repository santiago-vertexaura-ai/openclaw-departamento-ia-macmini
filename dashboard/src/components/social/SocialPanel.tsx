"use client";

import SocialCalendar from "./SocialCalendar";

export default function SocialPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto min-h-0">
        <SocialCalendar />
      </div>
    </div>
  );
}
