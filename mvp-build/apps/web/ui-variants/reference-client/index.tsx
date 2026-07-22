"use client";

import { defineUiVariant } from "../contract";

export default defineUiVariant(function ReferenceClientVariant({ slots }) {
  return <>{slots.reference_client}</>;
});
