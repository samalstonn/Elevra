import VerifySuccessClient from "./VerifySuccessClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verification Successful",
};

export default async function VerifySuccessPage() {
  return <VerifySuccessClient />;
}
