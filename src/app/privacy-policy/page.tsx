
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Privacy Policy</CardTitle>
          <CardDescription>Last Updated: [Date]</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-foreground/90 leading-relaxed">
          <p>
            Welcome to Fiber Friends. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you visit our
            website and use our application. Please read this privacy policy
            carefully. If you do not agree with the terms of this privacy policy,
            please do not access the application.
          </p>

          <h2 className="text-xl font-semibold font-headline pt-4">1. Information We Collect</h2>
          <p>
            We may collect information about you in a variety of ways. The
            information we may collect via the Application depends on the
            content and materials you use, and includes:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>
              <strong>Personal Data:</strong> Personally identifiable information,
              such as your name, email address, that you voluntarily give to us
              when you register with the Application or when you choose to
              participate in various activities related to the Application.
            </li>
            <li>
              <strong>Usage Data:</strong> Information our servers automatically
              collect when you access the Application, such as your IP address,
              your browser type, your operating system, your access times, and
              the pages you have viewed directly before and after accessing the
              Application. (This will be further detailed based on actual analytics implemented).
            </li>
            <li>
              <strong>User-Generated Content:</strong> Symptom logs, food entries,
              product usage notes, community posts, and other content you generate
              within the app will be stored.
            </li>
          </ul>

          <h2 className="text-xl font-semibold font-headline pt-4">2. Use of Your Information</h2>
          <p>
            Having accurate information about you permits us to provide you with
            a smooth, efficient, and customized experience. Specifically, we may
            use information collected about you via the Application to:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>Create and manage your account.</li>
            <li>
              Provide AI-driven insights and personalized feedback based on your
              logged data.
            </li>
            <li>Facilitate user-to-user connections and communications (if applicable).</li>
            <li>Monitor and analyze usage and trends to improve your experience with the Application.</li>
            <li>Notify you of updates to the Application.</li>
            <li>[Add other uses as necessary]</li>
          </ul>

          <h2 className="text-xl font-semibold font-headline pt-4">3. Disclosure of Your Information</h2>
          <p>
            We may share information we have collected about you in certain
            situations. Your information may be disclosed as follows:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1">
            <li>
              <strong>By Law or to Protect Rights:</strong> If we believe the
              release of information about you is necessary to respond to legal
              process, to investigate or remedy potential violations of our
              policies, or to protect the rights, property, and safety of
              others, we may share your information as permitted or required by
              any applicable law, rule, or regulation.
            </li>
            <li>
                <strong>Anonymized Community Data:</strong> If you opt-in, anonymized and aggregated data may be used for community pattern analysis features or research purposes, always ensuring individual identities are protected.
            </li>
            <li>[Add other disclosures as necessary, e.g., third-party service providers]</li>
          </ul>

          <h2 className="text-xl font-semibold font-headline pt-4">4. Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to
            help protect your personal information. While we have taken
            reasonable steps to secure the personal information you provide to
            us, please be aware that despite our efforts, no security measures
            are perfect or impenetrable, and no method of data transmission can
            be guaranteed against any interception or other type of misuse.
          </p>
          
          <h2 className="text-xl font-semibold font-headline pt-4">5. Policy for Children</h2>
           <p>
            We do not knowingly solicit information from or market to children
            under the age of 13 (or higher, depending on jurisdiction). If you
            become aware of any data we have collected from children, please
            contact us using the contact information provided below.
          </p>


          <h2 className="text-xl font-semibold font-headline pt-4">6. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page.
            You are advised to review this Privacy Policy periodically for any
            changes.
          </p>

          <h2 className="text-xl font-semibold font-headline pt-4">7. Contact Us</h2>
          <p>
            If you have questions or comments about this Privacy Policy, please
            contact us at: [Your Contact Email/Link to Contact Form]
          </p>
          <p className="mt-6 text-sm text-muted-foreground">
            Return to <Link href="/landing" className="text-primary hover:underline">Landing Page</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
