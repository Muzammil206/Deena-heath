import Image from "next/image";
import ApplicationForm from "@/components/ApplicationForm";

export default function Page() {
  return (
    <main className="wrap">
      <Image className=" logo" src="/logo2.png" alt="Deena Health Hub" width={700} height={109} priority />
      <h1>Join as a <span>doctor</span></h1>
      <p className="sub">Tell us about your practice. Our team verifies every licence before your profile goes live.</p>
      <ApplicationForm />
    </main>
  );
}
