"use client";

import React, { Suspense } from "react";
import CandidatesPageInner from "./CandidatePageInner";

export default function CandidatesPage() {
  return (
    <Suspense fallback={<div>Loading candidates...</div>}>
      <CandidatesPageInner />
    </Suspense>
  );
}
